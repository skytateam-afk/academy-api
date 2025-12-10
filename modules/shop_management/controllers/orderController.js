/**
 * Order Controller
 * Handles HTTP requests for shop order management
 */

const orderRepository = require('../repositories/orderRepository');
const cartRepository = require('../repositories/cartRepository');
const logger = require('../../../config/winston');
const { z } = require('zod');

// Validation schemas
const createOrderSchema = z.object({
    billingAddress: z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        address1: z.string().min(1, 'Address is required'),
        address2: z.string().optional(),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        postalCode: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
        phone: z.string().min(1, 'Phone is required')
    }),
    shippingAddress: z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        address1: z.string().min(1, 'Address is required'),
        address2: z.string().optional(),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        postalCode: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
        phone: z.string().min(1, 'Phone is required')
    }).optional(),
    useShippingAsBilling: z.boolean().default(false),
    customerNotes: z.string().optional(),
    currency: z.string().default('NGN')
});

const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'])
});

const updatePaymentStatusSchema = z.object({
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']),
    paymentProviderId: z.string().optional(),
    transactionId: z.string().uuid().optional()
});

const updateFulfillmentSchema = z.object({
    fulfillmentStatus: z.enum(['unfulfilled', 'partially_fulfilled', 'fulfilled', 'cancelled']),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().url().optional(),
    shippingCarrier: z.string().optional()
});

/**
 * Get all orders with pagination and filtering
 */
exports.getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            paymentStatus,
            fulfillmentStatus,
            userId,
            startDate,
            endDate,
            search,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const filters = {
            status,
            paymentStatus,
            fulfillmentStatus,
            userId,
            startDate,
            endDate,
            search
        };

        const result = await orderRepository.getAll({
            page: parseInt(page),
            limit: parseInt(limit),
            ...filters,
            sortBy,
            sortOrder
        });

        res.json({
            success: true,
            data: result.orders,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getAllOrders', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
};

/**
 * Get order by ID
 */
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order ID format'
            });
        }

        const order = await orderRepository.getById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check if user has permission to view this order
        // Admin and staff can view any order, regular users can only view their own orders
        const userRole = req.user?.role || '';
        const isAdmin = userRole === 'admin' || userRole === 'super_admin';
        const isStaff = userRole === 'staff';

        if (req.user && !isAdmin && !isStaff) {
            if (order.user_id !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to view this order'
                });
            }
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        logger.error('Error in getOrderById', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
};

/**
 * Get order by order number
 */
exports.getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;

        const order = await orderRepository.getByOrderNumber(orderNumber);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check if user has permission to view this order
        // Admin and staff can view any order, regular users can only view their own orders
        const userRole = req.user?.role || '';
        const isAdmin = userRole === 'admin' || userRole === 'super_admin';
        const isStaff = userRole === 'staff';

        if (req.user && !isAdmin && !isStaff) {
            if (order.user_id !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to view this order'
                });
            }
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        logger.error('Error in getOrderByNumber', { error: error.message, orderNumber: req.params.orderNumber });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
};

/**
 * Get current user's orders
 */
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const { page = 1, limit = 10, status } = req.query;

        const filters = { userId, status };

        const result = await orderRepository.getAll(
            parseInt(page),
            parseInt(limit),
            filters,
            'created_at',
            'desc'
        );

        res.json({
            success: true,
            data: result.orders,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getMyOrders', { error: error.message, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
};

/**
 * Create order from cart
 */
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const sessionId = req.sessionID || req.headers['x-session-id'];

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required to place order'
            });
        }

        const validationResult = createOrderSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { billingAddress, shippingAddress, useShippingAsBilling, customerNotes, currency } = validationResult.data;

        // Get or create cart first to get cart ID
        const userCart = await cartRepository.getOrCreateCart(userId, sessionId);

        // Get cart with items using cart ID
        const cart = await cartRepository.getCartWithItems(userCart.id);

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }

        // Calculate totals
        const subtotal = cart.items.reduce((sum, item) => sum + (item.price_at_addition * item.quantity), 0);
        const taxAmount = 0; // TODO: Implement tax calculation
        const shippingAmount = 0; // TODO: Implement shipping calculation
        const discountAmount = 0; // TODO: Implement discount calculation
        const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

        // Prepare order data
        const orderData = {
            userId,
            subtotal,
            taxAmount,
            shippingAmount,
            discountAmount,
            totalAmount,
            currency: currency || 'NGN', // Use currency from request body, default to NGN
            billingAddress,
            shippingAddress: useShippingAsBilling ? billingAddress : shippingAddress,
            customerEmail: req.user.email,
            customerPhone: billingAddress.phone,
            customerNotes,
            items: cart.items.map(item => ({
                productId: item.product_id,
                productName: item.name,
                productSku: item.sku,
                productDescription: item.short_description,
                productImageUrl: item.primary_image_url,
                quantity: item.quantity,
                unitPrice: item.price_at_addition,
                totalPrice: item.price_at_addition * item.quantity
            }))
        };

        // Create order
        const order = await orderRepository.createFromCart(cart.id, userId, orderData);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        logger.error('Error in createOrder', { error: error.message, userId: req.user?.userId });

        if (error.message.includes('out of stock') || error.message.includes('Insufficient stock')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create order'
        });
    }
};

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order ID format'
            });
        }

        const validationResult = updateOrderStatusSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { status } = validationResult.data;

        const order = await orderRepository.updateStatus(id, status);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        logger.error('Error in updateOrderStatus', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update order status'
        });
    }
};

/**
 * Update payment status
 */
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order ID format'
            });
        }

        const validationResult = updatePaymentStatusSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { paymentStatus, paymentProviderId, transactionId } = validationResult.data;

        const order = await orderRepository.updatePaymentStatus(
            id,
            paymentStatus,
            paymentProviderId,
            transactionId
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            data: order
        });
    } catch (error) {
        logger.error('Error in updatePaymentStatus', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update payment status'
        });
    }
};

/**
 * Update fulfillment status
 */
exports.updateFulfillmentStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order ID format'
            });
        }

        const validationResult = updateFulfillmentSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const order = await orderRepository.updateFulfillmentStatus(id, validationResult.data);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Fulfillment status updated successfully',
            data: order
        });
    } catch (error) {
        logger.error('Error in updateFulfillmentStatus', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to update fulfillment status'
        });
    }
};

/**
 * Get order statistics
 */
exports.getOrderStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const stats = await orderRepository.getStatistics(startDate, endDate);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error in getOrderStatistics', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order statistics'
        });
    }
};

module.exports = exports;
