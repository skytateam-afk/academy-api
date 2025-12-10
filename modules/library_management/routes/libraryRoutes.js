/**
 * Library Management Routes
 */

const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const upload = require('../../../middleware/upload');
const { uploadLibraryFiles, uploadLibraryThumbnail, handleUploadError } = require('../../../middleware/uploadLibrary');

// ==================== CATEGORY ROUTES ====================

/**
 * @route   GET /api/library/categories
 * @desc    Get all library categories
 * @access  Public
 */
router.get('/categories', libraryController.getAllCategories);

/**
 * @route   GET /api/library/categories/:id
 * @desc    Get library category by ID
 * @access  Public
 */
router.get('/categories/:id', libraryController.getCategoryById);

/**
 * @route   POST /api/library/categories
 * @desc    Create library category
 * @access  Private - Admin/Librarian
 */
router.post(
  '/categories',
  authenticateToken,
  requirePermission('library.manage'),
  libraryController.createCategory
);

/**
 * @route   PUT /api/library/categories/:id
 * @desc    Update library category
 * @access  Private - Admin/Librarian
 */
router.put(
  '/categories/:id',
  authenticateToken,
  requirePermission('library.manage'),
  libraryController.updateCategory
);

/**
 * @route   DELETE /api/library/categories/:id
 * @desc    Delete library category
 * @access  Private - Admin/Librarian
 */
router.delete(
  '/categories/:id',
  authenticateToken,
  requirePermission('library.delete'),
  libraryController.deleteCategory
);

// ==================== ITEM ROUTES ====================

/**
 * @route   GET /api/library/items/featured
 * @desc    Get featured library items
 * @access  Public
 */
router.get('/items/featured', libraryController.getFeaturedItems);

/**
 * @route   GET /api/library/items/popular
 * @desc    Get popular library items
 * @access  Public
 */
router.get('/items/popular', libraryController.getPopularItems);

/**
 * @route   GET /api/library/items/recent
 * @desc    Get recently added library items
 * @access  Public
 */
router.get('/items/recent', libraryController.getRecentItems);

/**
 * @route   GET /api/library/items/search
 * @desc    Search library items
 * @access  Public
 */
router.get('/items/search', libraryController.searchItems);

/**
 * @route   GET /api/library/items
 * @desc    Get all library items
 * @access  Public
 */
router.get('/items', libraryController.getAllItems);

/**
 * @route   GET /api/library/items/:id
 * @desc    Get library item by ID
 * @access  Public
 */
router.get('/items/:id', libraryController.getItemById);

/**
 * @route   POST /api/library/items
 * @desc    Create library item (with optional file and thumbnail uploads)
 * @access  Private - Admin/Librarian
 */
router.post(
  '/items',
  authenticateToken,
  requirePermission('library.manage'),
  uploadLibraryFiles,
  handleUploadError,
  libraryController.createItem
);

/**
 * @route   PUT /api/library/items/:id
 * @desc    Update library item (with optional file and thumbnail uploads)
 * @access  Private - Admin/Librarian
 */
router.put(
  '/items/:id',
  authenticateToken,
  requirePermission('library.manage'),
  uploadLibraryFiles,
  handleUploadError,
  libraryController.updateItem
);

/**
 * @route   DELETE /api/library/items/:id
 * @desc    Delete library item
 * @access  Private - Admin/Librarian
 */
router.delete(
  '/items/:id',
  authenticateToken,
  requirePermission('library.delete'),
  libraryController.deleteItem
);

/**
 * @route   POST /api/library/items/:id/cover
 * @desc    Upload cover image for library item
 * @access  Private - Admin/Librarian
 */
router.post(
  '/items/:id/cover',
  authenticateToken,
  requirePermission('library.manage'),
  upload.single('cover'),
  libraryController.uploadCoverImage
);

/**
 * @route   POST /api/library/items/:id/file
 * @desc    Upload digital file (PDF/MP3) with thumbnail for library item
 * @access  Private - Admin/Librarian
 */
router.post(
  '/items/:id/file',
  authenticateToken,
  requirePermission('library.manage'),
  uploadLibraryFiles,
  handleUploadError,
  libraryController.uploadDigitalFile
);

/**
 * @route   POST /api/library/items/:id/thumbnail
 * @desc    Upload thumbnail only for library item
 * @access  Private - Admin/Librarian
 */
router.post(
  '/items/:id/thumbnail',
  authenticateToken,
  requirePermission('library.manage'),
  uploadLibraryThumbnail,
  handleUploadError,
  libraryController.uploadThumbnail
);

/**
 * @route   GET /api/library/items/:id/download
 * @desc    Download digital file for library item
 * @access  Private - Authenticated users
 */
router.get(
  '/items/:id/download',
  authenticateToken,
  libraryController.downloadFile
);

/**
 * @route   POST /api/library/items/:id/download
 * @desc    Track download for library item
 * @access  Private - Authenticated users only
 */
router.post(
  '/items/:id/download',
  authenticateToken,
  libraryController.trackDownload
);

// ==================== BORROWING ROUTES ====================

/**
 * @route   GET /api/library/borrowings/my
 * @desc    Get current user's borrowings
 * @access  Private
 */
router.get(
  '/borrowings/my',
  authenticateToken,
  libraryController.getMyBorrowings
);

/**
 * @route   GET /api/library/borrowings/overdue
 * @desc    Get overdue borrowings
 * @access  Private - Admin/Librarian
 */
router.get(
  '/borrowings/overdue',
  authenticateToken,
  requirePermission('library.view'),
  libraryController.getOverdueBorrowings
);

/**
 * @route   GET /api/library/borrowings
 * @desc    Get all borrowings
 * @access  Private - Admin/Librarian
 */
router.get(
  '/borrowings',
  authenticateToken,
  requirePermission('library.view'),
  libraryController.getAllBorrowings
);

/**
 * @route   POST /api/library/borrowings
 * @desc    Borrow a library item
 * @access  Private - Admin/Librarian
 */
router.post(
  '/borrowings',
  authenticateToken,
  requirePermission('library.manage'),
  libraryController.borrowItem
);

/**
 * @route   PUT /api/library/borrowings/:id/return
 * @desc    Return a borrowed item
 * @access  Private - Admin/Librarian
 */
router.put(
  '/borrowings/:id/return',
  authenticateToken,
  requirePermission('library.manage'),
  libraryController.returnItem
);

// ==================== RESERVATION ROUTES ====================

/**
 * @route   GET /api/library/reservations/my
 * @desc    Get current user's reservations
 * @access  Private
 */
router.get(
  '/reservations/my',
  authenticateToken,
  libraryController.getMyReservations
);

/**
 * @route   GET /api/library/reservations
 * @desc    Get all reservations
 * @access  Private - Admin/Librarian
 */
router.get(
  '/reservations',
  authenticateToken,
  requirePermission('library.view'),
  libraryController.getAllReservations
);

/**
 * @route   POST /api/library/reservations
 * @desc    Reserve a library item
 * @access  Private
 */
router.post(
  '/reservations',
  authenticateToken,
  libraryController.reserveItem
);

/**
 * @route   DELETE /api/library/reservations/:id
 * @desc    Cancel a reservation
 * @access  Private
 */
router.delete(
  '/reservations/:id',
  authenticateToken,
  libraryController.cancelReservation
);

// ==================== STATISTICS ROUTES ====================

/**
 * @route   GET /api/library/statistics/my
 * @desc    Get current user's library statistics
 * @access  Private
 */
router.get(
  '/statistics/my',
  authenticateToken,
  libraryController.getMyLibraryStatistics
);

/**
 * @route   GET /api/library/statistics
 * @desc    Get library statistics
 * @access  Private - Admin/Librarian
 */
router.get(
  '/statistics',
  authenticateToken,
  requirePermission('library.view'),
  libraryController.getLibraryStatistics
);

/**
 * @route   GET /api/library/stats
 * @desc    Get library statistics (alias)
 * @access  Private - Admin/Librarian
 */
router.get(
  '/stats',
  authenticateToken,
  requirePermission('library.view'),
  libraryController.getLibraryStatistics
);

module.exports = router;
