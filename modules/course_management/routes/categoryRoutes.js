/**
 * Category Routes
 * RESTful routes for category management
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');

/**
 * @route   GET /api/categories
 * @desc    Get all categories with optional filtering
 * @access  Public
 * @query   parentId - Filter by parent category ID (use 'null' for root categories)
 * @query   isActive - Filter by active status (true/false)
 * @query   includeChildren - Include child categories (true/false)
 */
router.get(
    '/',
    categoryController.getAllCategories
);

/**
 * @route   GET /api/categories/tree
 * @desc    Get category tree (hierarchical structure)
 * @access  Public
 */
router.get(
    '/tree',
    categoryController.getCategoryTree
);

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get(
    '/slug/:slug',
    categoryController.getCategoryBySlug
);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get(
    '/:id',
    categoryController.getCategoryById
);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (requires category.create permission)
 * @body    name, description, parentId, iconUrl, displayOrder, isActive
 */
router.post(
    '/',
    authenticateToken,
    requirePermission('category.create'),
    categoryController.createCategory
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (requires category.update permission)
 * @body    name, description, parentId, iconUrl, displayOrder, isActive
 */
router.put(
    '/:id',
    authenticateToken,
    requirePermission('category.update'),
    categoryController.updateCategory
);

/**
 * @route   POST /api/categories/reorder
 * @desc    Reorder categories
 * @access  Private (requires category.update permission)
 * @body    Array of {id, displayOrder}
 */
router.post(
    '/reorder',
    authenticateToken,
    requirePermission('category.update'),
    categoryController.reorderCategories
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (requires category.delete permission)
 */
router.delete(
    '/:id',
    authenticateToken,
    requirePermission('category.delete'),
    categoryController.deleteCategory
);

module.exports = router;
