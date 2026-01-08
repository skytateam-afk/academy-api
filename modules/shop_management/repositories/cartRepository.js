/**
 * Cart Repository
 * Handles database operations for shopping cart
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class CartRepository {
  /**
   * Get or create cart for user
   */
  async getOrCreateCart(userId, sessionId = null) {
    try {
      let cart;

      if (userId) {
        cart = await knex('shop_carts')
          .where('user_id', userId)
          .first();
      } else if (sessionId) {
        cart = await knex('shop_carts')
          .where('session_id', sessionId)
          .first();
      }

      if (!cart) {
        const cartData = {
          expires_at: knex.raw("NOW() + INTERVAL '30 days'")
        };

        if (userId) {
          cartData.user_id = userId;
        } else if (sessionId) {
          cartData.session_id = sessionId;
        }

        [cart] = await knex('shop_carts')
          .insert(cartData)
          .returning('*');
      }

      return cart;
    } catch (error) {
      logger.error('Error in CartRepository.getOrCreateCart', { error: error.message, userId, sessionId });
      throw error;
    }
  }

  /**
   * Get cart with items
   */
  async getCartWithItems(cartId) {
    try {
      const cart = await knex('shop_carts')
        .where('id', cartId)
        .first();

      if (!cart) {
        return null;
      }

      // Get cart items with product details
      cart.items = await knex('shop_cart_items as ci')
        .join('shop_products as p', 'ci.product_id', 'p.id')
        .where('ci.cart_id', cartId)
        .select(
          'ci.*',
          'ci.price_at_addition as unit_price', // Alias for frontend compatibility
          'p.name as product_name',
          'p.slug as product_slug',
          'p.price as current_price',
          'p.stock_quantity',
          'p.stock_status',
          'p.is_published'
        );

      // Get primary image for each product
      for (const item of cart.items) {
        const primaryImage = await knex('shop_product_images')
          .where('product_id', item.product_id)
          .where('is_primary', true)
          .orWhere(function () {
            this.where('product_id', item.product_id);
          })
          .orderBy('is_primary', 'desc')
          .orderBy('display_order', 'asc')
          .first();

        item.product_image_url = primaryImage?.image_url || null;
      }

      // Calculate totals
      cart.subtotal = cart.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price_at_addition) * item.quantity);
      }, 0);

      cart.item_count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      
      // Set other required fields (tax, shipping, total)
      cart.tax = cart.tax || 0;
      cart.shipping = cart.shipping || 0;
      cart.total = cart.total || cart.subtotal;

      return cart;
    } catch (error) {
      logger.error('Error in CartRepository.getCartWithItems', { error: error.message, cartId });
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  async addItem(cartId, productId, quantity = 1) {
    try {
      // Get product details
      const product = await knex('shop_products')
        .where('id', productId)
        .first();

      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.is_published) {
        throw new Error('Product is not available');
      }

      // Check stock
      if (product.track_inventory && product.stock_quantity < quantity) {
        throw new Error('Insufficient stock');
      }

      // Check if item already exists in cart
      const existingItem = await knex('shop_cart_items')
        .where('cart_id', cartId)
        .where('product_id', productId)
        .first();

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;

        // Check stock for new quantity
        if (product.track_inventory && product.stock_quantity < newQuantity) {
          throw new Error('Insufficient stock');
        }

        const [updatedItem] = await knex('shop_cart_items')
          .where('id', existingItem.id)
          .update({
            quantity: newQuantity,
            updated_at: new Date()
          })
          .returning('*');

        return updatedItem;
      } else {
        // Add new item
        const [newItem] = await knex('shop_cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            quantity,
            price_at_addition: product.price
          })
          .returning('*');

        return newItem;
      }
    } catch (error) {
      logger.error('Error in CartRepository.addItem', { error: error.message, cartId, productId });
      throw error;
    }
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(cartId, itemId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeItem(cartId, itemId);
      }

      // Get cart item to find product_id
      const cartItem = await knex('shop_cart_items')
        .where('id', itemId)
        .where('cart_id', cartId)
        .first();

      if (!cartItem) {
        return null;
      }

      // Get product for stock check
      const product = await knex('shop_products')
        .where('id', cartItem.product_id)
        .first();

      if (product && product.track_inventory && product.stock_quantity < quantity) {
        throw new Error('Insufficient stock');
      }

      const [updatedItem] = await knex('shop_cart_items')
        .where('id', itemId)
        .update({
          quantity,
          updated_at: new Date()
        })
        .returning('*');

      return updatedItem;
    } catch (error) {
      logger.error('Error in CartRepository.updateItemQuantity', { error: error.message, cartId, itemId });
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(cartId, itemId) {
    try {
      await knex('shop_cart_items')
        .where('id', itemId)
        .where('cart_id', cartId)
        .del();

      return true;
    } catch (error) {
      logger.error('Error in CartRepository.removeItem', { error: error.message, cartId, itemId });
      throw error;
    }
  }

  /**
   * Clear cart
   */
  async clearCart(cartId) {
    try {
      await knex('shop_cart_items')
        .where('cart_id', cartId)
        .del();

      return true;
    } catch (error) {
      logger.error('Error in CartRepository.clearCart', { error: error.message, cartId });
      throw error;
    }
  }

  /**
   * Merge guest cart with user cart
   */
  async mergeGuestCart(guestSessionId, userId) {
    const trx = await knex.transaction();

    try {
      // Get guest cart
      const guestCart = await trx('shop_carts')
        .where('session_id', guestSessionId)
        .first();

      if (!guestCart) {
        await trx.commit();
        return null;
      }

      // Get or create user cart
      let userCart = await trx('shop_carts')
        .where('user_id', userId)
        .first();

      if (!userCart) {
        [userCart] = await trx('shop_carts')
          .insert({
            user_id: userId,
            expires_at: trx.raw("NOW() + INTERVAL '30 days'")
          })
          .returning('*');
      }

      // Get guest cart items
      const guestItems = await trx('shop_cart_items')
        .where('cart_id', guestCart.id);

      // Merge items
      for (const guestItem of guestItems) {
        const existingItem = await trx('shop_cart_items')
          .where('cart_id', userCart.id)
          .where('product_id', guestItem.product_id)
          .first();

        if (existingItem) {
          // Update quantity
          await trx('shop_cart_items')
            .where('id', existingItem.id)
            .update({
              quantity: existingItem.quantity + guestItem.quantity,
              updated_at: trx.fn.now()
            });
        } else {
          // Add item to user cart
          await trx('shop_cart_items')
            .insert({
              cart_id: userCart.id,
              product_id: guestItem.product_id,
              quantity: guestItem.quantity,
              price_at_addition: guestItem.price_at_addition
            });
        }
      }

      // Delete guest cart
      await trx('shop_cart_items').where('cart_id', guestCart.id).del();
      await trx('shop_carts').where('id', guestCart.id).del();

      await trx.commit();

      // Return merged cart with items
      return await this.getCartWithItems(userCart.id);
    } catch (error) {
      await trx.rollback();
      logger.error('Error in CartRepository.mergeGuestCart', { error: error.message, guestSessionId, userId });
      throw error;
    }
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts() {
    try {
      const expiredCarts = await knex('shop_carts')
        .where('expires_at', '<', new Date())
        .select('id');

      if (expiredCarts.length > 0) {
        const cartIds = expiredCarts.map(cart => cart.id);

        await knex('shop_cart_items')
          .whereIn('cart_id', cartIds)
          .del();

        await knex('shop_carts')
          .whereIn('id', cartIds)
          .del();

        logger.info('Cleaned up expired carts', { count: expiredCarts.length });
      }

      return expiredCarts.length;
    } catch (error) {
      logger.error('Error in CartRepository.cleanupExpiredCarts', { error: error.message });
      throw error;
    }
  }
}

module.exports = new CartRepository();
