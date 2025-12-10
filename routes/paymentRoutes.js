/**
 * Payment Routes
 * TODO: Move to payments module
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../modules/payments/paymentController');
const paymentProviderRoutes = require('../modules/payments/paymentProviderRoutes');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/payments/config
 * @desc    Get payment configuration (public keys for frontend)
 * @access  Public
 */
router.get('/config', paymentController.getPaymentConfig);

/**
 * @route   POST /api/payments/webhooks/stripe
 * @desc    Stripe webhook handler
 * @access  Public
 */
router.post('/webhooks/stripe', paymentController.stripeWebhook);

/**
 * @route   POST /api/payments/webhooks/paystack
 * @desc    Paystack webhook handler
 * @access  Public
 */
router.post('/webhooks/paystack', paymentController.paystackWebhook);

// Mount payment provider management routes
router.use('/providers', paymentProviderRoutes);

// Apply authentication middleware for remaining routes
router.use(authenticateToken);

/**
 * @route   POST /api/payments/initialize
 * @desc    Initialize a payment
 * @access  Protected
 */
router.post('/initialize', paymentController.initializePayment);

/**
 * @route   POST /api/payments/verify/:transactionId
 * @desc    Verify a payment
 * @access  Protected
 */
router.post('/verify/:transactionId', paymentController.verifyPayment);

/**
 * @route   POST /api/payments/verify-by-ref/:reference
 * @desc    Verify a payment by reference (fallback for direct Paystack verification)
 * @access  Protected
 */
router.post('/verify-by-ref/:reference', paymentController.verifyByReference);

/**
 * @route   GET /api/payments/transactions
 * @desc    Get payment transactions
 * @access  Protected
 */
router.get('/transactions', paymentController.getTransactions);

/**
 * @route   GET /api/payments/transactions/:id
 * @desc    Get specific transaction
 * @access  Protected
 */
router.get('/transactions/:id', paymentController.getTransaction);

/**
 * @route   POST /api/payments/refund/:transactionId
 * @desc    Process refund (admin only)
 * @access  Protected (admin)
 */
router.post('/refund/:transactionId', paymentController.refundPayment);

module.exports = router;
