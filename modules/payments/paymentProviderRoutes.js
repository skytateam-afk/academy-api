/**
 * Payment Provider Routes
 * API endpoints for managing payment provider configurations
 */

const express = require('express');
const PaymentProviderController = require('./paymentProviderController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');

const router = express.Router();

// Public routes (no auth required for some endpoints)
router.get('/active', PaymentProviderController.getActiveProviders);
router.get('/currency/:currency', PaymentProviderController.getProviderForCurrency);

// Admin-only routes (require authentication and admin role)
router.use(authenticateToken); // All routes below this line require authentication
router.use(requireRole(['admin', 'super_admin'])); // Require admin role

// Provider management endpoints
router.get('/', PaymentProviderController.getProviders);
router.post('/', PaymentProviderController.upsertProvider);
router.get('/:providerId', PaymentProviderController.getProvider);
router.put('/:providerId/toggle', PaymentProviderController.toggleProvider);
router.post('/:providerId/test', PaymentProviderController.testProvider);
router.delete('/:providerId', PaymentProviderController.deleteProvider);

module.exports = router;
