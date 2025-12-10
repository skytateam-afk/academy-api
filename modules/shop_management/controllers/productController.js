/**
 * Product Controller
 * Handles HTTP requests for shop product management
 */

const productRepository = require('../repositories/productRepository');
const logger = require('../../../config/winston');
const { z } = require('zod');

/**
 * Convert camelCase object keys to snake_case
 */
const toSnakeCase = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const snakeCaseObj = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snakeCaseObj[snakeKey] = value;
    }
    return snakeCaseObj;
};

// Validation schemas
const createProductSchema = z.object({
    name: z.string().min(3).max(255),
    description: z.string().optional(),
    short_description: z.string().max(500).optional(),
    shortDescription: z.string().max(500).optional(),
    category_id: z.string().uuid().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    sku: z.string().max(100).optional(),
    price: z.coerce.number().min(0),
    compare_at_price: z.coerce.number().min(0).optional().nullable(),
    compareAtPrice: z.coerce.number().min(0).optional().nullable(),
    cost_price: z.coerce.number().min(0).optional().nullable(),
    costPrice: z.coerce.number().min(0).optional().nullable(),
    currency: z.string().length(3).default('USD'),
    stock_quantity: z.coerce.number().int().min(0).default(0),
    stockQuantity: z.coerce.number().int().min(0).default(0),
    low_stock_threshold: z.coerce.number().int().min(0).optional().nullable(),
    lowStockThreshold: z.coerce.number().int().min(0).optional().nullable(),
    track_inventory: z.boolean().default(true),
    trackInventory: z.boolean().default(true),
    allow_backorders: z.boolean().default(false),
    allowBackorders: z.boolean().default(false),
    weight: z.coerce.number().min(0).optional().nullable(),
    dimensions: z.object({
        length: z.coerce.number(),
        width: z.coerce.number(),
        height: z.coerce.number(),
        unit: z.string()
    }).optional().nullable(),
    is_physical: z.boolean().default(true),
    isPhysical: z.boolean().default(true),
    is_digital: z.boolean().default(false),
    isDigital: z.boolean().default(false),
    is_published: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    digital_file_url: z.string().url().optional().nullable(),
    digitalFileUrl: z.string().url().optional().nullable(),
    meta_title: z.string().max(255).optional().nullable(),
    metaTitle: z.string().max(255).optional().nullable(),
    meta_description: z.string().optional().nullable(),
    metaDescription: z.string().optional().nullable(),
    metadata: z.record(z.any()).optional().nullable()
});

const updateProductSchema = createProductSchema.partial();

/**
 * Get all products with pagination and filtering
 */
exports.getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search,
            categoryId,
            isPublished,
            isFeatured,
            minPrice,
            maxPrice,
            inStock,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const filters = {
            search,
            categoryId,
            isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
            isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined
        };

        const result = await productRepository.getAll(
            parseInt(page),
            parseInt(limit),
            filters,
            sortBy,
            sortOrder
        );

        res.json({
            success: true,
            data: result.products,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getAllProducts', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products'
        });
    }
};

/**
 * Get featured products
 */
exports.getFeaturedProducts = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const products = await productRepository.getFeatured(limit);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        logger.error('Error in getFeaturedProducts', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch featured products'
        });
    }
};

/**
 * Get product by ID
 */
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        const product = await productRepository.getById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Increment view count
        productRepository.incrementViewCount(id).catch(err =>
            logger.error('Failed to increment view count', { productId: id, error: err.message })
        );

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        logger.error('Error in getProductById', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product'
        });
    }
};

/**
 * Get product by slug
 */
exports.getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const product = await productRepository.getBySlug(slug);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Increment view count
        productRepository.incrementViewCount(product.id).catch(err =>
            logger.error('Failed to increment view count', { productId: product.id, error: err.message })
        );

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        logger.error('Error in getProductBySlug', { error: error.message, slug: req.params.slug });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product'
        });
    }
};

/**
 * Create new product
 */
exports.createProduct = async (req, res) => {
    try {
        const validationResult = createProductSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        // Convert camelCase to snake_case for database
        const productData = toSnakeCase(validationResult.data);

        const product = await productRepository.create(productData);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        logger.error('Error in createProduct', { error: error.message });

        if (error.message.includes('SKU already exists')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create product'
        });
    }
};

/**
 * Update product
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        const validationResult = updateProductSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        // Convert camelCase to snake_case for database
        const productData = toSnakeCase(validationResult.data);

        const product = await productRepository.update(id, productData);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        logger.error('Error in updateProduct', { error: error.message, id: req.params.id });

        if (error.message.includes('SKU already exists')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update product'
        });
    }
};

/**
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        const deleted = await productRepository.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deleteProduct', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to delete product'
        });
    }
};

/**
 * Toggle publish status
 */
exports.togglePublish = async (req, res) => {
    try {
        const { id } = req.params;
        // Accept both camelCase and snake_case
        const isPublished = req.body.isPublished !== undefined ? req.body.isPublished : req.body.is_published;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        if (typeof isPublished !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isPublished must be a boolean'
            });
        }

        const product = await productRepository.togglePublish(id, isPublished);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: `Product ${isPublished ? 'published' : 'unpublished'} successfully`,
            data: product
        });
    } catch (error) {
        logger.error('Error in togglePublish', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update product publish status'
        });
    }
};

/**
 * Toggle featured status
 */
exports.toggleFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        // Accept both camelCase and snake_case
        const isFeatured = req.body.isFeatured !== undefined ? req.body.isFeatured : req.body.is_featured;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        if (typeof isFeatured !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isFeatured must be a boolean'
            });
        }

        const product = await productRepository.toggleFeatured(id, isFeatured);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: `Product ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
            data: product
        });
    } catch (error) {
        logger.error('Error in toggleFeatured', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update product featured status'
        });
    }
};

/**
 * Add product image
 */
exports.addProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl, altText, displayOrder, isPrimary } = req.body;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                error: 'Image URL is required'
            });
        }

        const image = await productRepository.addImage(id, {
            imageUrl,
            altText,
            displayOrder: displayOrder || 0,
            isPrimary: isPrimary || false
        });

        res.status(201).json({
            success: true,
            message: 'Product image added successfully',
            data: image
        });
    } catch (error) {
        logger.error('Error in addProductImage', { error: error.message, id: req.params.id });

        if (error.message.includes('Product not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('maximum of 10 images')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to add product image'
        });
    }
};

/**
 * Delete product image
 */
exports.deleteProductImage = async (req, res) => {
    try {
        const { id, imageId } = req.params;

        if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(imageId).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID format'
            });
        }

        const deleted = await productRepository.deleteImage(id, imageId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }

        res.json({
            success: true,
            message: 'Product image deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deleteProductImage', { error: error.message, id: req.params.id });

        if (error.message.includes('at least 1 image')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to delete product image'
        });
    }
};

/**
 * Set primary product image
 */
exports.setPrimaryImage = async (req, res) => {
    try {
        const { id, imageId } = req.params;

        if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(imageId).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID format'
            });
        }

        const updated = await productRepository.setPrimaryImage(id, imageId);

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Image not found'
            });
        }

        // Fetch and return the updated product with images
        const product = await productRepository.getById(id);

        res.json({
            success: true,
            message: 'Primary image set successfully',
            data: product
        });
    } catch (error) {
        logger.error('Error in setPrimaryImage', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to set primary image'
        });
    }
};

/**
 * Update product stock
 */
exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid product ID format'
            });
        }

        if (typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity must be a non-negative number'
            });
        }

        const product = await productRepository.updateStock(id, quantity);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: product
        });
    } catch (error) {
        logger.error('Error in updateStock', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update stock'
        });
    }
};

module.exports = exports;
