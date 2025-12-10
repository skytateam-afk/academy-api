/**
 * Wishlist Repository
 * Handles database operations for user wishlist
 */

const knex = require('../../../config/knex');

class WishlistRepository {
  /**
   * Add item to user's wishlist
   */
  async addToWishlist(userId, itemType, itemId, notes = null) {
    const [wishlistItem] = await knex('user_wishlist')
      .insert({
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        notes: notes
      })
      .returning('*');
    
    return wishlistItem;
  }

  /**
   * Remove item from user's wishlist
   */
  async removeFromWishlist(userId, itemType, itemId) {
    return await knex('user_wishlist')
      .where({
        user_id: userId,
        item_type: itemType,
        item_id: itemId
      })
      .del();
  }

  /**
   * Check if item is in user's wishlist
   */
  async isInWishlist(userId, itemType, itemId) {
    const item = await knex('user_wishlist')
      .where({
        user_id: userId,
        item_type: itemType,
        item_id: itemId
      })
      .first();
    
    return !!item;
  }

  /**
   * Get all wishlist items for a user
   */
  async getUserWishlist(userId, itemType = null) {
    let query = knex('user_wishlist')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
    
    if (itemType) {
      query = query.where('item_type', itemType);
    }
    
    return await query;
  }

  /**
   * Get user's wishlist with full item details (courses, library items, and shop products)
   */
  async getUserWishlistWithDetails(userId, itemType = null) {
    const wishlistItems = await this.getUserWishlist(userId, itemType);
    
    const result = {
      courses: [],
      library_items: [],
      shop_products: []
    };

    // Separate courses, library items, and shop products
    const courseIds = wishlistItems
      .filter(item => item.item_type === 'course')
      .map(item => item.item_id);
    
    const libraryItemIds = wishlistItems
      .filter(item => item.item_type === 'library_item')
      .map(item => item.item_id);
    
    const shopProductIds = wishlistItems
      .filter(item => item.item_type === 'shop_product')
      .map(item => item.item_id);

    // Fetch course details
    if (courseIds.length > 0) {
      const courses = await knex('courses')
        .select(
          'courses.*',
          'categories.name as category_name',
          'categories.slug as category_slug',
          'users.username as instructor_username',
          'users.first_name as instructor_first_name',
          'users.last_name as instructor_last_name',
          'users.avatar_url as instructor_avatar'
        )
        .leftJoin('categories', 'courses.category_id', 'categories.id')
        .leftJoin('users', 'courses.instructor_id', 'users.id')
        .whereIn('courses.id', courseIds)
        .where('courses.is_published', true);
      
      // Add wishlist metadata
      result.courses = courses.map(course => {
        const wishlistItem = wishlistItems.find(
          item => item.item_type === 'course' && item.item_id === course.id
        );
        return {
          ...course,
          wishlist_added_at: wishlistItem?.created_at,
          wishlist_notes: wishlistItem?.notes
        };
      });
    }

    // Fetch library item details
    if (libraryItemIds.length > 0) {
      const libraryItems = await knex('library_items')
        .select(
          'library_items.*',
          'library_categories.name as category_name',
          'library_categories.slug as category_slug'
        )
        .leftJoin('library_categories', 'library_items.category_id', 'library_categories.id')
        .whereIn('library_items.id', libraryItemIds);
      
      // Add wishlist metadata
      result.library_items = libraryItems.map(item => {
        const wishlistItem = wishlistItems.find(
          wItem => wItem.item_type === 'library_item' && wItem.item_id === item.id
        );
        return {
          ...item,
          wishlist_added_at: wishlistItem?.created_at,
          wishlist_notes: wishlistItem?.notes
        };
      });
    }

    // Fetch shop product details
    if (shopProductIds.length > 0) {
      const shopProducts = await knex('shop_products')
        .select(
          'shop_products.*',
          'shop_categories.name as category_name',
          'shop_categories.slug as category_slug'
        )
        .leftJoin('shop_categories', 'shop_products.category_id', 'shop_categories.id')
        .whereIn('shop_products.id', shopProductIds)
        .where('shop_products.is_published', true);
      
      // Fetch primary images for each product
      const productIds = shopProducts.map(p => p.id);
      const images = await knex('shop_product_images')
        .whereIn('product_id', productIds)
        .where('is_primary', true);
      
      const imageMap = {};
      images.forEach(img => {
        imageMap[img.product_id] = img.image_url;
      });
      
      // Add wishlist metadata and primary image
      result.shop_products = shopProducts.map(product => {
        const wishlistItem = wishlistItems.find(
          wItem => wItem.item_type === 'shop_product' && wItem.item_id === product.id
        );
        return {
          ...product,
          primary_image: imageMap[product.id] || null,
          wishlist_added_at: wishlistItem?.created_at,
          wishlist_notes: wishlistItem?.notes
        };
      });
    }

    return result;
  }

  /**
   * Get wishlist count for a user
   */
  async getWishlistCount(userId, itemType = null) {
    let query = knex('user_wishlist')
      .where('user_id', userId)
      .count('* as count');
    
    if (itemType) {
      query = query.where('item_type', itemType);
    }
    
    const result = await query.first();
    return parseInt(result.count);
  }

  /**
   * Bulk check if items are in wishlist
   */
  async checkMultipleInWishlist(userId, items) {
    if (!items || items.length === 0) return {};

    const wishlistItems = await knex('user_wishlist')
      .where('user_id', userId)
      .whereIn('item_id', items.map(item => item.id));
    
    const wishlistMap = {};
    wishlistItems.forEach(item => {
      wishlistMap[item.item_id] = true;
    });
    
    return wishlistMap;
  }

  /**
   * Clear all wishlist items for a user
   */
  async clearWishlist(userId, itemType = null) {
    let query = knex('user_wishlist')
      .where('user_id', userId);
    
    if (itemType) {
      query = query.where('item_type', itemType);
    }
    
    return await query.del();
  }

  /**
   * Update wishlist item notes
   */
  async updateNotes(userId, itemType, itemId, notes) {
    const [updated] = await knex('user_wishlist')
      .where({
        user_id: userId,
        item_type: itemType,
        item_id: itemId
      })
      .update({ notes })
      .returning('*');
    
    return updated;
  }
}

module.exports = new WishlistRepository();
