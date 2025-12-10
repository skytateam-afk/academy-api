/**
 * Wishlist Routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../../middleware/auth');
const wishlistController = require('../controllers/wishlistController');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/wishlist
 * @desc    Add item to wishlist
 * @access  Private
 */
router.post('/', wishlistController.addToWishlist);

/**
 * @route   POST /api/wishlist/toggle
 * @desc    Toggle item in wishlist (add/remove)
 * @access  Private
 */
router.post('/toggle', wishlistController.toggleWishlist);

/**
 * @route   GET /api/wishlist
 * @desc    Get user's wishlist with details
 * @access  Private
 */
router.get('/', wishlistController.getWishlist);

/**
 * @route   GET /api/wishlist/count
 * @desc    Get wishlist count
 * @access  Private
 */
router.get('/count', wishlistController.getWishlistCount);

/**
 * @route   GET /api/wishlist/check/:item_type/:item_id
 * @desc    Check if item is in wishlist
 * @access  Private
 */
router.get('/check/:item_type/:item_id', wishlistController.checkWishlistStatus);

/**
 * @route   DELETE /api/wishlist/:item_type/:item_id
 * @desc    Remove item from wishlist
 * @access  Private
 */
router.delete('/:item_type/:item_id', wishlistController.removeFromWishlist);

/**
 * @route   DELETE /api/wishlist
 * @desc    Clear wishlist
 * @access  Private
 */
router.delete('/', wishlistController.clearWishlist);

/**
 * @route   PATCH /api/wishlist/:item_type/:item_id/notes
 * @desc    Update wishlist item notes
 * @access  Private
 */
router.patch('/:item_type/:item_id/notes', wishlistController.updateWishlistNotes);

module.exports = router;
