/**
 * Subscription Controller
 * Handles HTTP requests for subscription management
 */

const SubscriptionTier = require('../../../models/SubscriptionTier');
const UserSubscription = require('../../../models/UserSubscription');
const logger = require('../../../config/winston');
const knex = require('../../../config/knex');
const { z } = require('zod');
const PaymentService = require('../../../services/paymentService');

// Validation schemas
const createTierSchema = z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    description: z.string().optional(),
    shortDescription: z.string().max(200).optional(),
    price: z.number().min(0),
    currency: z.string().length(3).default('USD'),
    billingCycleMonths: z.number().int().min(1).max(12).default(1),
    billingCycleDays: z.number().int().min(1).max(365).default(30),
    features: z.array(z.string()).optional(),
    maxUsers: z.number().int().min(-1).default(-1), // -1 for unlimited
    isPopular: z.boolean().optional(),
    sortOrder: z.number().int().min(0).default(0)
});

const updateTierSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
    description: z.string().optional().nullable(),
    shortDescription: z.string().max(200).optional().nullable(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    billingCycleMonths: z.number().int().min(1).max(12).optional(),
    billingCycleDays: z.number().int().min(1).max(365).optional(),
    features: z.array(z.string()).optional().nullable(),
    maxUsers: z.number().int().min(-1).optional(),
    isPopular: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
});

const subscribeSchema = z.object({
    tierId: z.string().uuid(),
    paymentProvider: z.enum(['stripe', 'paystack', 'manual']).default('manual'),
    subscriptionId: z.string().optional()
});

const updateSubscriptionSchema = z.object({
    status: z.enum(['active', 'cancelled', 'expired', 'pending']).optional(),
    paymentProvider: z.string().optional(),
    subscriptionId: z.string().optional().nullable(),
    amountPaid: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    extendsMonths: z.number().int().min(1).optional()
});

const cancelSubscriptionSchema = z.object({
    reason: z.string().min(5).max(500).optional()
});

/**
 * Get all subscription tiers
 */
exports.getAllTiers = async (req, res) => {
    try {
        logger.info('getAllTiers called', { query: req.query });

        const {
            page,
            limit,
            isActive,
            search,
            sortBy,
            sortOrder
        } = req.query;

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            isActive: isActive === 'false' ? false : true,
            sortBy: sortBy || 'sort_order',
            sortOrder: sortOrder || 'asc'
        };

        let tiers = await SubscriptionTier.getAll(options);

        // Filter by search if provided
        if (search) {
            const searchTerm = search.toLowerCase();
            tiers.tiers = tiers.tiers.filter(tier =>
                tier.name.toLowerCase().includes(searchTerm) ||
                tier.description?.toLowerCase().includes(searchTerm) ||
                tier.slug.toLowerCase().includes(searchTerm)
            );
        }

        res.json({
            success: true,
            data: tiers.tiers,
            pagination: tiers.pagination
        });
    } catch (error) {
        logger.error('Error in getAllTiers', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription tiers'
        });
    }
};

/**
 * Get subscription tier by ID
 */
exports.getTierById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tier ID format'
            });
        }

        const tier = await SubscriptionTier.getById(id);

        if (!tier) {
            return res.status(404).json({
                success: false,
                error: 'Subscription tier not found'
            });
        }

        res.json({
            success: true,
            data: tier
        });
    } catch (error) {
        logger.error('Error in getTierById', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription tier'
        });
    }
};

/**
 * Get subscription tier by slug
 */
exports.getTierBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const tier = await SubscriptionTier.getBySlug(slug);

        if (!tier) {
            return res.status(404).json({
                success: false,
                error: 'Subscription tier not found'
            });
        }

        res.json({
            success: true,
            data: tier
        });
    } catch (error) {
        logger.error('Error in getTierBySlug', { error: error.message, slug: req.params.slug });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription tier'
        });
    }
};

/**
 * Create new subscription tier
 */
exports.createTier = async (req, res) => {
    try {
        logger.info('Creating subscription tier', { body: req.body });

        const validationResult = createTierSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const tier = await SubscriptionTier.create(validationResult.data);

        logger.info('Subscription tier created successfully', { id: tier.id, name: tier.name });

        res.status(201).json({
            success: true,
            message: 'Subscription tier created successfully',
            data: tier
        });
    } catch (error) {
        logger.error('Error in createTier', { error: error.message });

        if (error.message.includes('duplicate key')) {
            return res.status(409).json({
                success: false,
                error: 'Tier slug already exists'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create subscription tier'
        });
    }
};

/**
 * Update subscription tier
 */
exports.updateTier = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info('Updating subscription tier', { id, body: req.body });

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tier ID format'
            });
        }

        const validationResult = updateTierSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const tier = await SubscriptionTier.update(id, validationResult.data);

        logger.info('Subscription tier updated successfully', { id, name: tier.name });

        res.json({
            success: true,
            message: 'Subscription tier updated successfully',
            data: tier
        });
    } catch (error) {
        logger.error('Error in updateTier', { error: error.message, id: req.params.id });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('duplicate key')) {
            return res.status(409).json({
                success: false,
                error: 'Tier slug already exists'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update subscription tier'
        });
    }
};

/**
 * Delete subscription tier
 */
exports.deleteTier = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tier ID format'
            });
        }

        const deleted = await SubscriptionTier.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Subscription tier not found'
            });
        }

        logger.info('Subscription tier deleted successfully', { id });

        res.json({
            success: true,
            message: 'Subscription tier deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deleteTier', { error: error.message, id: req.params.id });

        if (error.message.includes('Cannot delete')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to delete subscription tier'
        });
    }
};

/**
 * Toggle tier active status
 */
exports.toggleTierActive = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tier ID format'
            });
        }

        const tier = await SubscriptionTier.toggleActive(id);

        logger.info('Tier active status toggled', { id, isActive: tier.isActive });

        res.json({
            success: true,
            message: `Tier ${tier.isActive ? 'activated' : 'deactivated'} successfully`,
            data: tier
        });
    } catch (error) {
        logger.error('Error in toggleTierActive', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to toggle tier status'
        });
    }
};

/**
 * Reorder subscription tiers
 */
exports.reorderTiers = async (req, res) => {
    try {
        const { sortOrder } = req.body;

        // Validate sortOrder is an object with UUID keys and numeric values
        const sortOrderSchema = z.record(z.string().uuid(), z.number().int().min(0));
        const validationResult = sortOrderSchema.safeParse(sortOrder);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid sort order format',
                details: validationResult.error.errors
            });
        }

        await SubscriptionTier.reorder(sortOrder);

        logger.info('Tiers reordered successfully', { sortOrder });

        res.json({
            success: true,
            message: 'Tier order updated successfully'
        });
    } catch (error) {
        logger.error('Error in reorderTiers', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to reorder tiers'
        });
    }
};

/**
 * Subscribe user to a tier
 */
exports.subscribe = async (req, res) => {
    try {
        const userId = req.user.userId;
        logger.info('User subscribing', { userId, body: req.body });

        const validationResult = subscribeSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { tierId, paymentProvider, subscriptionId } = validationResult.data;

        // Get tier details to check if it's free
        const tier = await SubscriptionTier.getById(tierId);
        if (!tier) {
            return res.status(404).json({
                success: false,
                error: 'Subscription tier not found'
            });
        }

        const isFree = tier.price === 0;
        const initialStatus = isFree ? 'active' : 'pending';

        const subscription = await UserSubscription.subscribeUser(userId, tierId, {
            paymentProvider: isFree ? 'none' : paymentProvider,
            subscriptionId: isFree ? null : subscriptionId,
            status: initialStatus
        });

        // If free, we are done
        if (isFree) {
            logger.info('User subscribed to free tier', { userId, tierId, subscriptionId: subscription.id });
            return res.status(201).json({
                success: true,
                message: 'Subscription created successfully',
                data: subscription
            });
        }

        // If paid, initiate payment
        try {
            const paymentResult = await PaymentService.createPayment({
                userId,
                amount: tier.price,
                currency: tier.currency,
                provider: paymentProvider,
                metadata: {
                    type: 'subscription_payment',
                    subscriptionId: subscription.id,
                    tierId: tierId
                }
            });

            logger.info('Subscription payment initiated', { userId, tierId, transactionId: paymentResult.transactionId });

            return res.status(201).json({
                success: true,
                message: 'Subscription pending payment',
                data: {
                    subscription,
                    payment: paymentResult
                }
            });

        } catch (paymentError) {
            logger.error('Payment initiation failed', { error: paymentError.message, userId, subscriptionId: subscription.id });
            // Optionally cancel the pending subscription or leave it to expire
            return res.status(500).json({
                success: false,
                error: 'Failed to initiate payment',
                details: paymentError.message
            });
        }

    } catch (error) {
        logger.error('Error in subscribe', { error: error.message, userId: req.user?.id });

        if (error.message.includes('already has an active subscription')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create subscription'
        });
    }
};

/**
 * Get current user's subscriptions
 */
exports.getMySubscriptions = async (req, res) => {
    try {
        const userId = req.user.userId;

        const {
            page,
            limit,
            status,
            sortBy,
            sortOrder
        } = req.query;

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            status,
            sortBy,
            sortOrder
        };

        const result = await UserSubscription.getByUser(userId, options);

        res.json({
            success: true,
            data: result.subscriptions,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getMySubscriptions', { error: error.message, userId: req.user?.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscriptions'
        });
    }
};

/**
 * Get current user's active subscription
 */
exports.getMyActiveSubscription = async (req, res) => {
    try {
        const userId = req.user.userId;

        const subscription = await UserSubscription.getUserActiveSubscription(userId);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: 'No active subscription found'
            });
        }

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        logger.error('Error in getMyActiveSubscription', { error: error.message, userId: req.user?.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch active subscription'
        });
    }
};

/**
 * Cancel user's subscription
 */
exports.cancelMySubscription = async (req, res) => {
    try {
        const userId = req.user.userId;
        const validationResult = cancelSubscriptionSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { reason } = validationResult.data;

        // Find user's active subscription
        const activeSubscription = await UserSubscription.getUserActiveSubscription(userId);

        if (!activeSubscription) {
            return res.status(404).json({
                success: false,
                error: 'No active subscription found'
            });
        }

        const cancelledSubscription = await UserSubscription.cancelSubscription(
            activeSubscription.id,
            reason
        );

        logger.info('Subscription cancelled', { userId, subscriptionId: cancelledSubscription.id });

        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: cancelledSubscription
        });
    } catch (error) {
        logger.error('Error in cancelMySubscription', { error: error.message, userId: req.user?.id });
        res.status(500).json({
            success: false,
            error: 'Failed to cancel subscription'
        });
    }
};

/**
 * Get all subscriptions (Admin only)
 */
exports.getAllSubscriptions = async (req, res) => {
    try {
        const {
            page,
            limit,
            status,
            userId,
            tierId,
            sortBy,
            sortOrder
        } = req.query;

        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            status,
            userId,
            tierId,
            sortBy,
            sortOrder
        };

        const result = await UserSubscription.getAll(options);

        res.json({
            success: true,
            data: result.subscriptions,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getAllSubscriptions', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscriptions'
        });
    }
};

/**
 * Get subscription by ID
 */
exports.getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subscription ID format'
            });
        }

        const subscription = await UserSubscription.getById(id);

        if (!subscription) {
            return res.status(404).json({
                success: false,
                error: 'Subscription not found'
            });
        }

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        logger.error('Error in getSubscriptionById', { error: error.message, id: req.params.id });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription'
        });
    }
};

/**
 * Update subscription (Admin only)
 */
exports.updateSubscription = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subscription ID format'
            });
        }

        const validationResult = updateSubscriptionSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        // Handle status special cases
        const updates = validationResult.data;

        if (updates.status === 'cancelled' && !req.body.confirmed) {
            return res.status(400).json({
                success: false,
                error: 'Confirmation required for cancellation',
                details: {
                    requiresConfirmation: true,
                    action: 'Cancel subscription'
                }
            });
        }

        if (updates.status === 'active' && updates.extendsMonths) {
            // Renew/extend subscription
            const renewed = await UserSubscription.renewSubscription(id, updates.extendsMonths);
            logger.info('Subscription renewed/extended', { subscriptionId: id, extendsMonths: updates.extendsMonths });
            return res.json({
                success: true,
                message: `Subscription extended by ${updates.extendsMonths} months`,
                data: renewed
            });
        }

        // Regular update
        const subscription = await UserSubscription.update(id, updates);

        logger.info('Subscription updated', { id, updates });

        res.json({
            success: true,
            message: 'Subscription updated successfully',
            data: subscription
        });
    } catch (error) {
        logger.error('Error in updateSubscription', { error: error.message, id: req.params.id });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update subscription'
        });
    }
};

/**
 * Cancel subscription (Admin only)
 */
exports.cancelSubscription = async (req, res) => {
    try {
        const { id } = req.params;

        if (!z.string().uuid().safeParse(id).success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subscription ID format'
            });
        }

        const validationResult = cancelSubscriptionSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.errors
            });
        }

        const { reason } = validationResult.data;

        if (!req.body.confirmed) {
            return res.status(400).json({
                success: false,
                error: 'Confirmation required for cancellation',
                details: {
                    requiresConfirmation: true,
                    action: 'Cancel subscription'
                }
            });
        }

        const cancelledSubscription = await UserSubscription.cancelSubscription(id, reason);

        logger.info('Subscription cancelled by admin', { subscriptionId: id, reason });

        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: cancelledSubscription
        });
    } catch (error) {
        logger.error('Error in cancelSubscription', { error: error.message, id: req.params.id });

        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to cancel subscription'
        });
    }
};

/**
 * Get subscription statistics (Admin only)
 */
exports.getSubscriptionStats = async (req, res) => {
    try {
        // Get tier statistics
        const tiersQuery = await require('../../../config/knex')
            .select(
                'subscription_tiers.name',
                'subscription_tiers.slug',
                'subscription_tiers.price',
                'subscription_tiers.currency'
            )
            .count('user_subscriptions.id as subscription_count')
            .from('subscription_tiers')
            .leftJoin('user_subscriptions', function () {
                this.on('subscription_tiers.id', '=', 'user_subscriptions.tier_id')
                    .andOn('user_subscriptions.status', '=', knex.raw("'active'"));
            })
            .groupBy('subscription_tiers.id', 'subscription_tiers.name', 'subscription_tiers.slug', 'subscription_tiers.price', 'subscription_tiers.currency');

        // Get overall statistics
        const statsQuery = await require('../../../config/knex')
            .select(
                require('../../../config/knex').raw(`
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                    COUNT(*) as total_count,
                    SUM(amount_paid) as total_revenue
                `)
            )
            .from('user_subscriptions');

        const [tiersStats, overallStats] = await Promise.all([tiersQuery, statsQuery]);

        res.json({
            success: true,
            data: {
                tiers: tiersStats,
                overall: {
                    activeSubscriptions: parseInt(overallStats[0].active_count),
                    expiredSubscriptions: parseInt(overallStats[0].expired_count),
                    cancelledSubscriptions: parseInt(overallStats[0].cancelled_count),
                    pendingSubscriptions: parseInt(overallStats[0].pending_count),
                    totalSubscriptions: parseInt(overallStats[0].total_count),
                    totalRevenue: parseFloat(overallStats[0].total_revenue || 0)
                }
            }
        });
    } catch (error) {
        logger.error('Error in getSubscriptionStats', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription statistics'
        });
    }
};

module.exports = exports;
