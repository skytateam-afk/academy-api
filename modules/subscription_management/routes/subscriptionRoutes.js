/**
 * Subscription Routes
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');

console.log(' Subscription routes loaded with proper permissions');

// ============================== PUBLIC TIER ROUTES ==============================

// Get all subscription tiers (publicly readable for frontend)
router.get('/tiers', subscriptionController.getAllTiers);
router.get('/tiers/:id', subscriptionController.getTierById);
router.get('/tiers/slug/:slug', subscriptionController.getTierBySlug);

// Protected routes (authentication required)
router.use(authenticateToken);

// Admin-only tier management
router.post('/tiers', requirePermission('subscription.create'), subscriptionController.createTier);
router.put('/tiers/:id', requirePermission('subscription.update'), subscriptionController.updateTier);
router.delete('/tiers/:id', requirePermission('subscription.delete'), subscriptionController.deleteTier);
router.patch('/tiers/:id/toggle', requirePermission('subscription.manage'), subscriptionController.toggleTierActive);
router.patch('/tiers/reorder', requirePermission('subscription.manage'), subscriptionController.reorderTiers);

// ============================== USER SUBSCRIPTION ROUTES ==============================

// User subscription management
router.post('/subscribe', subscriptionController.subscribe);
router.get('/my-subscriptions', subscriptionController.getMySubscriptions);
router.get('/my-active-subscription', subscriptionController.getMyActiveSubscription);
router.patch('/cancel-subscription', subscriptionController.cancelMySubscription);

// Admin subscription management
router.get('/subscriptions', requirePermission('subscription.view'), subscriptionController.getAllSubscriptions);
router.get('/subscriptions/:id', requirePermission('subscription.view'), subscriptionController.getSubscriptionById);
router.patch('/subscriptions/:id', requirePermission('subscription.update'), subscriptionController.updateSubscription);
router.post('/subscriptions/:id/cancel', requirePermission('subscription.cancel'), subscriptionController.cancelSubscription);

// Statistics (Admin only)
router.get('/stats', requirePermission('subscription.view'), subscriptionController.getSubscriptionStats);

module.exports = router;
