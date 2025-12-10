/**
 * Shop Management Routes
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');

// Optional auth middleware - allows both authenticated and unauthenticated access
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-session-id'];
    
    if (!token) {
        // No token, continue as guest
        return next();
    }
    
    // If token exists, try to authenticate but don't fail if it's invalid
    authenticateToken(req, res, (err) => {
        // Continue regardless of authentication result
        next();
    });
};
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const analyticsController = require('../controllers/analyticsController');
const { uploadFile } = require('../../../services/storageService');
const multer = require('multer');

// Configure multer for product images
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per image
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'));
        }
    }
});

// ==================== PRODUCT ROUTES ====================

/**
 * @route   GET /api/shop/products
 * @desc    Get all products with filtering and pagination
 * @access  Public
 */
router.get('/products', optionalAuth, productController.getAllProducts);

/**
 * @route   GET /api/shop/products/featured
 * @desc    Get featured products
 * @access  Public
 */
router.get('/products/featured', productController.getFeaturedProducts);

/**
 * @route   GET /api/shop/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/products/:id', productController.getProductById);

/**
 * @route   GET /api/shop/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get('/products/slug/:slug', productController.getProductBySlug);

/**
 * @route   POST /api/shop/products
 * @desc    Create new product
 * @access  Private (Admin)
 */
router.post(
    '/products',
    authenticateToken,
    requirePermission('shop_product.create'),
    productController.createProduct
);

/**
 * @route   PUT /api/shop/products/:id
 * @desc    Update product
 * @access  Private (Admin)
 */
router.put(
    '/products/:id',
    authenticateToken,
    requirePermission('shop_product.update'),
    productController.updateProduct
);

/**
 * @route   DELETE /api/shop/products/:id
 * @desc    Delete product
 * @access  Private (Admin)
 */
router.delete(
    '/products/:id',
    authenticateToken,
    requirePermission('shop_product.delete'),
    productController.deleteProduct
);

/**
 * @route   PATCH /api/shop/products/:id/publish
 * @desc    Toggle product publish status
 * @access  Private (Admin)
 */
router.patch(
    '/products/:id/publish',
    authenticateToken,
    requirePermission('shop_product.publish'),
    productController.togglePublish
);

/**
 * @route   PATCH /api/shop/products/:id/feature
 * @desc    Toggle product featured status
 * @access  Private (Admin)
 */
router.patch(
    '/products/:id/feature',
    authenticateToken,
    requirePermission('shop_product.update'),
    productController.toggleFeatured
);

/**
 * @route   POST /api/shop/products/:id/images
 * @desc    Add product image
 * @access  Private (Admin)
 */
router.post(
    '/products/:id/images',
    authenticateToken,
    requirePermission('shop_product.update'),
    upload.single('image'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No image file uploaded'
                });
            }

            // Upload to R2
            const uploadResult = await uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                'shop/products',
                { productId: req.params.id }
            );

            // Add image URL to request body for controller
            req.body.imageUrl = uploadResult.fileUrl;
            
            productController.addProductImage(req, res);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to upload image'
            });
        }
    }
);

/**
 * @route   DELETE /api/shop/products/:id/images/:imageId
 * @desc    Delete product image
 * @access  Private (Admin)
 */
router.delete(
    '/products/:id/images/:imageId',
    authenticateToken,
    requirePermission('shop_product.update'),
    productController.deleteProductImage
);

/**
 * @route   PATCH /api/shop/products/:id/images/:imageId/primary
 * @desc    Set primary product image
 * @access  Private (Admin)
 */
router.patch(
    '/products/:id/images/:imageId/primary',
    authenticateToken,
    requirePermission('shop_product.update'),
    productController.setPrimaryImage
);

/**
 * @route   PATCH /api/shop/products/:id/stock
 * @desc    Update product stock
 * @access  Private (Admin)
 */
router.patch(
    '/products/:id/stock',
    authenticateToken,
    requirePermission('shop_product.update'),
    productController.updateStock
);

// ==================== CATEGORY ROUTES ====================

/**
 * @route   GET /api/shop/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/categories', categoryController.getAllCategories);

/**
 * @route   GET /api/shop/categories/tree
 * @desc    Get category tree (hierarchical)
 * @access  Public
 */
router.get('/categories/tree', categoryController.getCategoryTree);

/**
 * @route   GET /api/shop/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get('/categories/:id', categoryController.getCategoryById);

/**
 * @route   GET /api/shop/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/categories/slug/:slug', categoryController.getCategoryBySlug);

/**
 * @route   POST /api/shop/categories
 * @desc    Create new category
 * @access  Private (Admin)
 */
router.post(
    '/categories',
    authenticateToken,
    requirePermission('shop_category.create'),
    categoryController.createCategory
);

/**
 * @route   PUT /api/shop/categories/:id
 * @desc    Update category
 * @access  Private (Admin)
 */
router.put(
    '/categories/:id',
    authenticateToken,
    requirePermission('shop_category.update'),
    categoryController.updateCategory
);

/**
 * @route   DELETE /api/shop/categories/:id
 * @desc    Delete category
 * @access  Private (Admin)
 */
router.delete(
    '/categories/:id',
    authenticateToken,
    requirePermission('shop_category.delete'),
    categoryController.deleteCategory
);

// ==================== CART ROUTES ====================

/**
 * @route   GET /api/shop/cart
 * @desc    Get current user's cart
 * @access  Private/Guest (with session)
 */
router.get('/cart', optionalAuth, cartController.getCart);

/**
 * @route   POST /api/shop/cart/items
 * @desc    Add item to cart
 * @access  Private/Guest (with session)
 */
router.post('/cart/items', optionalAuth, cartController.addItem);

/**
 * @route   PUT /api/shop/cart/items/:itemId
 * @desc    Update cart item quantity
 * @access  Private/Guest (with session)
 */
router.put('/cart/items/:itemId', optionalAuth, cartController.updateItemQuantity);

/**
 * @route   DELETE /api/shop/cart/items/:itemId
 * @desc    Remove item from cart
 * @access  Private/Guest (with session)
 */
router.delete('/cart/items/:itemId', optionalAuth, cartController.removeItem);

/**
 * @route   DELETE /api/shop/cart
 * @desc    Clear cart
 * @access  Private/Guest (with session)
 */
router.delete('/cart', optionalAuth, cartController.clearCart);

/**
 * @route   POST /api/shop/cart/merge
 * @desc    Merge guest cart with user cart (after login)
 * @access  Private
 */
router.post('/cart/merge', authenticateToken, cartController.mergeGuestCart);

// ==================== ORDER ROUTES ====================

/**
 * @route   GET /api/shop/orders
 * @desc    Get all orders (Admin) or user's orders
 * @access  Private
 */
router.get(
    '/orders',
    authenticateToken,
    requirePermission('shop_order.read'),
    orderController.getAllOrders
);

/**
 * @route   GET /api/shop/orders/my
 * @desc    Get current user's orders
 * @access  Private
 */
router.get('/orders/my', authenticateToken, orderController.getMyOrders);

/**
 * @route   GET /api/shop/orders/statistics
 * @desc    Get order statistics
 * @access  Private (Admin)
 */
router.get(
    '/orders/statistics',
    authenticateToken,
    requirePermission('shop_analytics.view'),
    orderController.getOrderStatistics
);

// ==================== ANALYTICS ROUTES ====================

/**
 * @route   GET /api/shop/analytics
 * @desc    Get comprehensive shop analytics
 * @access  Private (Admin)
 */
router.get(
    '/analytics',
    authenticateToken,
    requirePermission('shop_analytics.view'),
    analyticsController.getAnalytics
);

/**
 * @route   GET /api/shop/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/orders/:id', authenticateToken, orderController.getOrderById);

/**
 * @route   GET /api/shop/orders/number/:orderNumber
 * @desc    Get order by order number
 * @access  Private
 */
router.get('/orders/number/:orderNumber', authenticateToken, orderController.getOrderByNumber);

/**
 * @route   POST /api/shop/orders
 * @desc    Create order from cart
 * @access  Private
 */
router.post('/orders', authenticateToken, orderController.createOrder);

/**
 * @route   PATCH /api/shop/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin)
 */
router.patch(
    '/orders/:id/status',
    authenticateToken,
    requirePermission('shop_order.update'),
    orderController.updateOrderStatus
);

/**
 * @route   PATCH /api/shop/orders/:id/payment
 * @desc    Update payment status
 * @access  Private (Admin)
 */
router.patch(
    '/orders/:id/payment',
    authenticateToken,
    requirePermission('shop_order.update'),
    orderController.updatePaymentStatus
);

/**
 * @route   PATCH /api/shop/orders/:id/fulfillment
 * @desc    Update fulfillment status
 * @access  Private (Admin)
 */
router.patch(
    '/orders/:id/fulfillment',
    authenticateToken,
    requirePermission('shop_order.manage'),
    orderController.updateFulfillmentStatus
);

module.exports = router;
