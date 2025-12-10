/**
 * Cart Controller
 * Handles HTTP requests for shopping cart management
 */

const cartRepository = require('../repositories/cartRepository');
const logger = require('../../../config/winston');
const { z } = require('zod');

// Validation schemas
const addItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100)
});

const updateQuantitySchema = z.object({
    quantity: z.number().int().min(1).max(100)
});

/**
 * Get current user's cart
 */
exports.getCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const sessionId = req.sessionID || req.headers['x-session-id'];

        if (!userId && !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'User authentication or session ID required'
            });
        }

        // Get or create cart first
        const cart = await cartRepository.getOrCreateCart(userId, sessionId);
        
        // Get cart with items
        const cartWithItems = await cartRepository.getCartWithItems(cart.id);

        res.json({
            success: true,
            data: cartWithItems
        });
    } catch (error) {
        logger.error('Error in getCart', { error: error.message, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cart'
        });
    }
};

/**
 * Add item to cart
 */
exports.addItem = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const sessionId = req.sessionID || req.headers['x-session-id'];

        if (!userId && !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'User authentication or session ID required'
            });
        }

        const validationResult = addItemSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { productId, quantity } = validationResult.data;

        // Get or create cart first
        const cart = await cartRepository.getOrCreateCart(userId, sessionId);
        
        // Add item to cart with correct parameters
        await cartRepository.addItem(cart.id, productId, quantity);

        // Get full cart with all items
        const updatedCart = await cartRepository.getCartWithItems(cart.id);

        res.status(201).json({
            success: true,
            message: 'Item added to cart successfully',
            data: updatedCart
        });
    } catch (error) {
        logger.error('Error in addItem', { error: error.message, userId: req.user?.userId });

        if (error.message.includes('Product not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('not available') || error.message.includes('out of stock')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to add item to cart'
        });
    }
};

/**
 * Update cart item quantity
 */
exports.updateItemQuantity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const sessionId = req.sessionID || req.headers['x-session-id'];
        const { itemId } = req.params;

        if (!userId && !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'User authentication or session ID required'
            });
        }

        if (!z.string().uuid().safeParse(itemId).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid item ID format'
            });
        }

        const validationResult = updateQuantitySchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { quantity } = validationResult.data;

        // Get cart first
        const cart = await cartRepository.getOrCreateCart(userId, sessionId);
        
        // Update item quantity with correct parameters (cartId, productId, quantity)
        await cartRepository.updateItemQuantity(cart.id, itemId, quantity);

        // Get full cart with items
        const updatedCart = await cartRepository.getCartWithItems(cart.id);

        if (!updatedCart) {
            return res.status(404).json({
                success: false,
                error: 'Cart not found'
            });
        }

        res.json({
            success: true,
            message: 'Cart item updated successfully',
            data: updatedCart
        });
    } catch (error) {
        logger.error('Error in updateItemQuantity', { error: error.message, userId: req.user?.userId });

        if (error.message.includes('Insufficient stock')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update cart item'
        });
    }
};

/**
 * Remove item from cart
 */
exports.removeItem = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const sessionId = req.sessionID || req.headers['x-session-id'];
        const { itemId } = req.params;

        if (!userId && !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'User authentication or session ID required'
            });
        }

        if (!z.string().uuid().safeParse(itemId).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid item ID format'
            });
        }

        // Get cart first
        const cart = await cartRepository.getOrCreateCart(userId, sessionId);
        
        // Remove item with correct parameters (cartId, productId)
        const deleted = await cartRepository.removeItem(cart.id, itemId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Cart item not found'
            });
        }

        res.json({
            success: true,
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        logger.error('Error in removeItem', { error: error.message, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to remove item from cart'
        });
    }
};

/**
 * Clear cart
 */
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const sessionId = req.sessionID || req.headers['x-session-id'];

        if (!userId && !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'User authentication or session ID required'
            });
        }

        // Get cart first
        const cart = await cartRepository.getOrCreateCart(userId, sessionId);
        
        // Clear cart with correct parameter (cartId)
        await cartRepository.clearCart(cart.id);

        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        logger.error('Error in clearCart', { error: error.message, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to clear cart'
        });
    }
};

/**
 * Merge guest cart with user cart (after login)
 */
exports.mergeGuestCart = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { sessionId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }

        // Merge guest cart with user cart
        const mergedCart = await cartRepository.mergeGuestCart(sessionId, userId);

        res.json({
            success: true,
            message: 'Guest cart merged successfully',
            data: mergedCart
        });
    } catch (error) {
        logger.error('Error in mergeGuestCart', { error: error.message, userId: req.user?.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to merge cart'
        });
    }
};

module.exports = exports;
