/**
 * Wishlist Controller
 * Handles HTTP requests for wishlist operations
 */

const wishlistRepository = require('../repositories/wishlistRepository');
const logger = require('../../../config/winston');

/**
 * Add item to wishlist
 */
exports.addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { item_type, item_id, notes } = req.body;

    // Validate item_type
    if (!['course', 'library_item', 'shop_product'].includes(item_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "course", "library_item", or "shop_product"'
      });
    }

    // Check if already in wishlist
    const alreadyExists = await wishlistRepository.isInWishlist(userId, item_type, item_id);
    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: 'Item is already in your wishlist'
      });
    }

    const wishlistItem = await wishlistRepository.addToWishlist(userId, item_type, item_id, notes);

    logger.info('Item added to wishlist', { userId, item_type, item_id });

    res.status(201).json({
      success: true,
      message: 'Item added to wishlist',
      data: wishlistItem
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from wishlist
 */
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { item_type, item_id } = req.params;

    const deleted = await wishlistRepository.removeFromWishlist(userId, item_type, item_id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    logger.info('Item removed from wishlist', { userId, item_type, item_id });

    res.json({
      success: true,
      message: 'Item removed from wishlist'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle item in wishlist (add if not present, remove if present)
 */
exports.toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { item_type, item_id } = req.body;

    // Validate item_type
    if (!['course', 'library_item', 'shop_product'].includes(item_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be "course", "library_item", or "shop_product"'
      });
    }

    const isInWishlist = await wishlistRepository.isInWishlist(userId, item_type, item_id);

    if (isInWishlist) {
      await wishlistRepository.removeFromWishlist(userId, item_type, item_id);
      logger.info('Item removed from wishlist (toggle)', { userId, item_type, item_id });
      
      return res.json({
        success: true,
        message: 'Item removed from wishlist',
        in_wishlist: false
      });
    } else {
      await wishlistRepository.addToWishlist(userId, item_type, item_id);
      logger.info('Item added to wishlist (toggle)', { userId, item_type, item_id });
      
      return res.json({
        success: true,
        message: 'Item added to wishlist',
        in_wishlist: true
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Check if item is in wishlist
 */
exports.checkWishlistStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { item_type, item_id } = req.params;

    const isInWishlist = await wishlistRepository.isInWishlist(userId, item_type, item_id);

    res.json({
      success: true,
      data: {
        in_wishlist: isInWishlist
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's wishlist with details
 */
exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { item_type } = req.query;

    const wishlist = await wishlistRepository.getUserWishlistWithDetails(
      userId,
      item_type || null
    );

    // Get counts
    const coursesCount = wishlist.courses.length;
    const libraryItemsCount = wishlist.library_items.length;
    const shopProductsCount = wishlist.shop_products?.length || 0;
    const totalCount = coursesCount + libraryItemsCount + shopProductsCount;

    res.json({
      success: true,
      data: {
        courses: wishlist.courses,
        library_items: wishlist.library_items,
        shop_products: wishlist.shop_products || [],
        counts: {
          total: totalCount,
          courses: coursesCount,
          library_items: libraryItemsCount,
          shop_products: shopProductsCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wishlist count
 */
exports.getWishlistCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { item_type } = req.query;

    const count = await wishlistRepository.getWishlistCount(userId, item_type || null);

    res.json({
      success: true,
      data: {
        count
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear wishlist
 */
exports.clearWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { item_type } = req.query;

    await wishlistRepository.clearWishlist(userId, item_type || null);

    logger.info('Wishlist cleared', { userId, item_type });

    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update wishlist item notes
 */
exports.updateWishlistNotes = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { item_type, item_id } = req.params;
    const { notes } = req.body;

    const updated = await wishlistRepository.updateNotes(userId, item_type, item_id, notes);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    res.json({
      success: true,
      message: 'Notes updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
