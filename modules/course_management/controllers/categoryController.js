/**
 * Category Controller
 * Handles HTTP requests for category management
 */

const Category = require('../../../models/Category');
const logger = require('../../../config/winston');
const { z } = require('zod');

// Validation schemas
const createCategorySchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    parentId: z.string().uuid().optional(),
    iconUrl: z.string().optional(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
});

const updateCategorySchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    parentId: z.string().uuid().optional().nullable(),
    iconUrl: z.string().optional(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
});

const reorderSchema = z.array(z.object({
    id: z.string().uuid(),
    displayOrder: z.number().int().min(0)
}));

/**
 * Get all categories
 */
exports.getAllCategories = async (req, res) => {
    try {
        const { parentId, isActive, includeChildren } = req.query;

        const options = {};

        if (parentId !== undefined) {
            options.parentId = parentId === 'null' ? null : parentId;
        }

        if (isActive !== undefined) {
            options.isActive = isActive === 'true';
        }

        if (includeChildren !== undefined) {
            options.includeChildren = includeChildren === 'true';
        }

        const categories = await Category.getAll(options);

        res.json({
            success: true,
            data: categories,
            count: categories.length
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
 * Get category tree
 */
exports.getCategoryTree = async (req, res) => {
    try {
        const tree = await Category.getTree();

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

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID format'
            });
        }

        const category = await Category.getById(id);

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

        const category = await Category.getBySlug(slug);

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
        // Validate request body
        const validationResult = createCategorySchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const category = await Category.create(validationResult.data);

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        logger.error('Error in createCategory', { error: error.message });

        if (error.message.includes('already exists')) {
            return res.status(400).json({
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

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID format'
            });
        }

        // Validate request body
        const validationResult = updateCategorySchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const category = await Category.update(id, validationResult.data);

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        logger.error('Error in updateCategory', { error: error.message, id: req.params.id });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('already exists') || error.message.includes('circular') || error.message.includes('own parent')) {
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

        // Validate UUID
        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID format'
            });
        }

        await Category.delete(id);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deleteCategory', { error: error.message, id: req.params.id });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('Cannot delete')) {
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

/**
 * Reorder categories
 */
exports.reorderCategories = async (req, res) => {
    try {
        // Validate request body
        const validationResult = reorderSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        await Category.reorder(validationResult.data);

        res.json({
            success: true,
            message: 'Categories reordered successfully'
        });
    } catch (error) {
        logger.error('Error in reorderCategories', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to reorder categories'
        });
    }
};
