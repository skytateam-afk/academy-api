/**
 * Category Controller
 * Handles HTTP requests for shop category management
 */

const categoryRepository = require('../repositories/categoryRepository');
const logger = require('../../../config/winston');
const { z } = require('zod');

// Validation schemas
const createCategorySchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().optional().nullable(),
    parent_id: z.string().uuid().optional().nullable(),
    icon_url: z.string().url().optional().nullable(),
    display_order: z.number().int().min(0).optional().default(0),
    is_active: z.boolean().optional().default(true)
});

const updateCategorySchema = createCategorySchema.partial();

/**
 * Get all categories
 */
exports.getAllCategories = async (req, res) => {
    try {
        const { includeInactive } = req.query;
        
        const categories = await categoryRepository.getAll(includeInactive === 'true');

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        logger.error('Error in getAllCategories', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
};

/**
 * Get category tree (hierarchical structure)
 */
exports.getCategoryTree = async (req, res) => {
    try {
        const tree = await categoryRepository.getTree();

        res.json({
            success: true,
            data: tree
        });
    } catch (error) {
        logger.error('Error in getCategoryTree', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category tree'
        });
    }
};

/**
 * Get category by ID
 */
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID format'
            });
        }

        const category = await categoryRepository.getById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        logger.error('Error in getCategoryById', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category'
        });
    }
};

/**
 * Get category by slug
 */
exports.getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const category = await categoryRepository.getBySlug(slug);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        logger.error('Error in getCategoryBySlug', { error: error.message, slug: req.params.slug });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category'
        });
    }
};

/**
 * Create new category
 */
exports.createCategory = async (req, res) => {
    try {
        const validationResult = createCategorySchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const category = await categoryRepository.create(validationResult.data);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        logger.error('Error in createCategory', { error: error.message });

        if (error.message.includes('Parent category not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create category'
        });
    }
};

/**
 * Update category
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID format'
            });
        }

        const validationResult = updateCategorySchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const category = await categoryRepository.update(id, validationResult.data);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        logger.error('Error in updateCategory', { error: error.message, id: req.params.id });

        if (error.message.includes('Parent category not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('Cannot set category as its own parent')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update category'
        });
    }
};

/**
 * Delete category
 */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID format'
            });
        }

        const deleted = await categoryRepository.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deleteCategory', { error: error.message, id: req.params.id });

        if (error.message.includes('has child categories')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('has associated products')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to delete category'
        });
    }
};

module.exports = exports;
