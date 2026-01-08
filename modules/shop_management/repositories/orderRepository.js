/**
 * Order Repository
 * Handles database operations for shop orders
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class OrderRepository {
  /**
   * Generate unique order number
   */
  async generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create order from cart
   */
  async createFromCart(cartId, userId, orderData) {
    const trx = await knex.transaction();

    try {
      // Get cart items
      const cartItems = await trx('shop_cart_items as ci')
        .join('shop_products as p', 'ci.product_id', 'p.id')
        .where('ci.cart_id', cartId)
        .select('ci.*', 'p.name', 'p.sku', 'p.description', 'p.stock_quantity', 'p.track_inventory');

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price_at_addition) * item.quantity);
      }, 0);

      const taxAmount = orderData.taxAmount || 0;
      const shippingAmount = orderData.shippingAmount || 0;
      const discountAmount = orderData.discountAmount || 0;
      const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Ensure addresses are properly stringified
      let billingAddressJson = null;
      let shippingAddressJson = null;

      if (orderData.billingAddress) {
        try {
          billingAddressJson = typeof orderData.billingAddress === 'string'
            ? orderData.billingAddress
            : JSON.stringify(orderData.billingAddress);
        } catch (e) {
          logger.error('Error stringifying billing address', { error: e.message });
          throw new Error('Invalid billing address format');
        }
      }

      if (orderData.shippingAddress) {
        try {
          shippingAddressJson = typeof orderData.shippingAddress === 'string'
            ? orderData.shippingAddress
            : JSON.stringify(orderData.shippingAddress);
        } catch (e) {
          logger.error('Error stringifying shipping address', { error: e.message });
          throw new Error('Invalid shipping address format');
        }
      }

      // Create order
      const [order] = await trx('shop_orders')
        .insert({
          order_number: orderNumber,
          user_id: userId,
          subtotal,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          currency: orderData.currency || 'USD',
          billing_address: billingAddressJson,
          shipping_address: shippingAddressJson,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone,
          customer_notes: orderData.customerNotes,
          payment_method: orderData.paymentMethod,
          status: 'pending',
          payment_status: 'pending',
          fulfillment_status: 'unfulfilled'
        })
        .returning('*');

      // Create order items and update product stock
      for (const cartItem of cartItems) {
        // Check stock availability
        if (cartItem.track_inventory && cartItem.stock_quantity < cartItem.quantity) {
          throw new Error(`Insufficient stock for ${cartItem.name}`);
        }

        // Get product image
        const primaryImage = await trx('shop_product_images')
          .where('product_id', cartItem.product_id)
          .orderBy('is_primary', 'desc')
          .orderBy('display_order', 'asc')
          .first();

        // Create order item
        await trx('shop_order_items')
          .insert({
            order_id: order.id,
            product_id: cartItem.product_id,
            product_name: cartItem.name,
            product_sku: cartItem.sku,
            product_description: cartItem.description,
            product_image_url: primaryImage?.image_url,
            quantity: cartItem.quantity,
            unit_price: cartItem.price_at_addition,
            total_price: cartItem.price_at_addition * cartItem.quantity
          });

        // Update product stock and sales count
        if (cartItem.track_inventory) {
          await trx('shop_products')
            .where('id', cartItem.product_id)
            .decrement('stock_quantity', cartItem.quantity);
        }

        await trx('shop_products')
          .where('id', cartItem.product_id)
          .increment('sales_count', cartItem.quantity);
      }

      // DO NOT clear cart here - only clear after payment verification succeeds
      // The cart will be cleared in the payment verification step

      await trx.commit();

      return await this.getById(order.id);
    } catch (error) {
      await trx.rollback();
      logger.error('Error in OrderRepository.createFromCart', { error: error.message, cartId, userId });
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getById(orderId) {
    try {
      const order = await knex('shop_orders as o')
        .leftJoin('users as u', 'o.user_id', 'u.id')
        .where('o.id', orderId)
        .select(
          'o.*',
          'u.username',
          'u.email as user_email',
          'u.first_name',
          'u.last_name'
        )
        .first();

      if (order) {
        // Parse JSON fields (only if they're strings)
        if (order.billing_address && typeof order.billing_address === 'string') {
          try {
            order.billing_address = JSON.parse(order.billing_address);
          } catch (e) {
            logger.error('Error parsing billing_address', { error: e.message, orderId });
          }
        }
        if (order.shipping_address && typeof order.shipping_address === 'string') {
          try {
            order.shipping_address = JSON.parse(order.shipping_address);
          } catch (e) {
            logger.error('Error parsing shipping_address', { error: e.message, orderId });
          }
        }
        if (order.metadata && typeof order.metadata === 'string') {
          try {
            order.metadata = JSON.parse(order.metadata);
          } catch (e) {
            logger.error('Error parsing metadata', { error: e.message, orderId });
          }
        }

        // Get order items
        order.items = await knex('shop_order_items')
          .where('order_id', orderId)
          .select('*');
      }

      return order;
    } catch (error) {
      logger.error('Error in OrderRepository.getById', { error: error.message, orderId });
      throw error;
    }
  }

  /**
   * Get order by order number
   */
  async getByOrderNumber(orderNumber) {
    try {
      const order = await knex('shop_orders as o')
        .leftJoin('users as u', 'o.user_id', 'u.id')
        .where('o.order_number', orderNumber)
        .select(
          'o.*',
          'u.username',
          'u.email as user_email',
          'u.first_name',
          'u.last_name'
        )
        .first();

      if (order) {
        // Parse JSON fields (only if they're strings)
        if (order.billing_address && typeof order.billing_address === 'string') {
          try {
            order.billing_address = JSON.parse(order.billing_address);
          } catch (e) {
            logger.error('Error parsing billing_address', { error: e.message, orderNumber });
          }
        }
        if (order.shipping_address && typeof order.shipping_address === 'string') {
          try {
            order.shipping_address = JSON.parse(order.shipping_address);
          } catch (e) {
            logger.error('Error parsing shipping_address', { error: e.message, orderNumber });
          }
        }
        if (order.metadata && typeof order.metadata === 'string') {
          try {
            order.metadata = JSON.parse(order.metadata);
          } catch (e) {
            logger.error('Error parsing metadata', { error: e.message, orderNumber });
          }
        }

        order.items = await knex('shop_order_items')
          .where('order_id', order.id)
          .select('*');
      }

      return order;
    } catch (error) {
      logger.error('Error in OrderRepository.getByOrderNumber', { error: error.message, orderNumber });
      throw error;
    }
  }

  /**
   * Get all orders with pagination
   */
  async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        userId,
        status,
        paymentStatus,
        fulfillmentStatus,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      const offset = (page - 1) * limit;

      let query = knex('shop_orders as o')
        .leftJoin('users as u', 'o.user_id', 'u.id')
        .select(
          'o.*',
          'u.username',
          'u.email as user_email',
          'u.first_name',
          'u.last_name'
        );

      // Apply filters
      if (userId) {
        query = query.where('o.user_id', userId);
      }

      if (status) {
        query = query.where('o.status', status);
      }

      if (paymentStatus) {
        query = query.where('o.payment_status', paymentStatus);
      }

      if (fulfillmentStatus) {
        query = query.where('o.fulfillment_status', fulfillmentStatus);
      }

      if (search) {
        query = query.where(function () {
          this.where('o.order_number', 'ilike', `%${search}%`)
            .orWhere('o.customer_email', 'ilike', `%${search}%`)
            .orWhere('u.username', 'ilike', `%${search}%`);
        });
      }

      // Get total count
      const countQuery = query.clone().clearSelect().count('* as count').first();
      const { count } = await countQuery;
      const total = parseInt(count);

      // Apply sorting
      const validSortFields = ['created_at', 'total_amount', 'status'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      query = query.orderBy(`o.${sortField}`, sortOrder);

      // Apply pagination
      const orders = await query.limit(limit).offset(offset);

      // Parse JSON fields (only if they're strings)
      for (const order of orders) {
        if (order.billing_address && typeof order.billing_address === 'string') {
          try {
            order.billing_address = JSON.parse(order.billing_address);
          } catch (e) {
            logger.error('Error parsing billing_address in getAll', { error: e.message, orderId: order.id });
          }
        }
        if (order.shipping_address && typeof order.shipping_address === 'string') {
          try {
            order.shipping_address = JSON.parse(order.shipping_address);
          } catch (e) {
            logger.error('Error parsing shipping_address in getAll', { error: e.message, orderId: order.id });
          }
        }

        // Construct customer_name from user data
        if (order.first_name || order.last_name) {
          order.customer_name = `${order.first_name || ''} ${order.last_name || ''}`.trim();
        } else if (order.username) {
          order.customer_name = order.username;
        }

        // Get item count
        const { count: itemCount } = await knex('shop_order_items')
          .where('order_id', order.id)
          .count('* as count')
          .first();

        order.item_count = parseInt(itemCount);
      }

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in OrderRepository.getAll', { error: error.message });
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateStatus(orderId, status) {
    try {
      const [order] = await knex('shop_orders')
        .where('id', orderId)
        .update({
          status,
          updated_at: new Date()
        })
        .returning('*');

      return order;
    } catch (error) {
      logger.error('Error in OrderRepository.updateStatus', { error: error.message, orderId });
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId, paymentStatus, transactionId = null) {
    try {
      const updateData = {
        payment_status: paymentStatus,
        updated_at: new Date()
      };

      if (paymentStatus === 'paid') {
        updateData.paid_at = new Date()
        updateData.status = 'paid';
      }

      if (transactionId) {
        updateData.transaction_id = transactionId;
      }

      const [order] = await knex('shop_orders')
        .where('id', orderId)
        .update(updateData)
        .returning('*');

      return order;
    } catch (error) {
      logger.error('Error in OrderRepository.updatePaymentStatus', { error: error.message, orderId });
      throw error;
    }
  }

  /**
   * Update fulfillment status
   */
  async updateFulfillmentStatus(orderId, fulfillmentStatus, trackingData = null) {
    try {
      const updateData = {
        fulfillment_status: fulfillmentStatus,
        updated_at: new Date()
      };

      if (trackingData) {
        if (trackingData.trackingNumber) updateData.tracking_number = trackingData.trackingNumber;
        if (trackingData.trackingUrl) updateData.tracking_url = trackingData.trackingUrl;
        if (trackingData.shippingCarrier) updateData.shipping_carrier = trackingData.shippingCarrier;
      }

      if (fulfillmentStatus === 'fulfilled') {
        updateData.status = 'shipped';
      }

      const [order] = await knex('shop_orders')
        .where('id', orderId)
        .update(updateData)
        .returning('*');

      return order;
    } catch (error) {
      logger.error('Error in OrderRepository.updateFulfillmentStatus', { error: error.message, orderId });
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getStatistics(userId = null) {
    try {
      let query = knex('shop_orders');

      if (userId) {
        query = query.where('user_id', userId);
      }

      const result = await query
        .select(
          knex.raw('COUNT(*) as total_orders'),
          knex.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_orders', ['pending']),
          knex.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed_orders', ['delivered']),
          knex.raw('SUM(CASE WHEN payment_status = ? THEN 1 ELSE 0 END) as paid_orders', ['paid']),
          knex.raw('SUM(total_amount) as total_revenue'),
          knex.raw('AVG(total_amount) as average_order_value')
        )
        .first();

      return {
        total_orders: parseInt(result.total_orders) || 0,
        pending_orders: parseInt(result.pending_orders) || 0,
        completed_orders: parseInt(result.completed_orders) || 0,
        paid_orders: parseInt(result.paid_orders) || 0,
        total_revenue: parseFloat(result.total_revenue) || 0,
        average_order_value: parseFloat(result.average_order_value) || 0
      };
    } catch (error) {
      logger.error('Error in OrderRepository.getStatistics', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = new OrderRepository();
