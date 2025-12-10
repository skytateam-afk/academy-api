/**
 * Payment Controller
 * Handles payment-related HTTP requests
 */

const paymentService = require('../../services/paymentService');
const PaymentProviderService = require('./paymentProviderService');
const db = require('../../config/knex');
const logger = require('../../config/winston');
const emailService = require('../../services/emailService');
const notificationService = require('../notifications/services/notificationService');

class PaymentController {
    /**
     * Initialize payment for a course
     * POST /api/payments/initialize
     */
    /**
     * Initialize payment for a course or order
     * POST /api/payments/initialize
     */
    async initializePayment(req, res) {
        try {
            const { courseId, orderId, provider: requestedProvider, currency: requestedCurrency } = req.body;
            const userId = req.user.userId;

            if (!courseId && !orderId) {
                return res.status(400).json({
                    success: false,
                    error: 'Course ID or Order ID is required'
                });
            }

            let amount;
            let currency;
            let metadata = {
                userEmail: req.user.email
            };

            // Handle Course Payment
            if (courseId) {
                // Get course details to check price
                const course = await db('courses').where({ id: courseId }).first();

                if (!course) {
                    return res.status(404).json({
                        success: false,
                        error: 'Course not found'
                    });
                }

                // Check if user is already enrolled
                const existingEnrollment = await db('enrollments')
                    .where({ user_id: userId, course_id: courseId })
                    .first();

                if (existingEnrollment) {
                    return res.status(400).json({
                        success: false,
                        error: 'Already enrolled in this course'
                    });
                }

                amount = parseFloat(course.price);
                currency = requestedCurrency || course.currency || 'USD';
                metadata.courseTitle = course.title;
            }
            // Handle Order Payment
            else if (orderId) {
                const order = await db('shop_orders').where({ id: orderId }).first();

                if (!order) {
                    return res.status(404).json({
                        success: false,
                        error: 'Order not found'
                    });
                }

                if (order.user_id !== userId) {
                    return res.status(403).json({
                        success: false,
                        error: 'Unauthorized access to order'
                    });
                }

                if (order.payment_status === 'paid') {
                    return res.status(400).json({
                        success: false,
                        error: 'Order is already paid'
                    });
                }

                amount = parseFloat(order.total_amount);
                currency = requestedCurrency || order.currency || 'USD';
                metadata.orderNumber = order.order_number;
            }

            // Determine payment provider based on currency
            let selectedProvider;
            if (requestedProvider) {
                // Use requested provider if specified
                selectedProvider = requestedProvider;
            } else {
                // Auto-select based on currency: NGN -> Paystack, others -> Stripe
                selectedProvider = currency === 'NGN' ? 'paystack' : 'stripe';
            }

            console.log(`Payment init - Currency: ${currency}, Provider: ${selectedProvider}`);

            const paymentData = await paymentService.createPayment({
                userId,
                courseId,
                orderId,
                amount,
                currency,
                provider: selectedProvider,
                metadata
            });

            console.log(`Payment data provider: ${paymentData?.provider}`);

            res.status(200).json({
                success: true,
                data: paymentData
            });
        } catch (error) {
            logger.error('Payment initialization failed', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Verify payment
     * POST /api/payments/verify/:transactionId
     */
    async verifyPayment(req, res) {
        try {
            const { transactionId } = req.params;
            const { provider } = req.body;

            if (!provider) {
                return res.status(400).json({
                    success: false,
                    error: 'Payment provider is required'
                });
            }

            const result = await paymentService.verifyPayment(transactionId, provider);

            if (result.success) {
                // Get course details for notification
                const course = await db('courses')
                    .where({ id: result.transaction.course_id })
                    .first();

                // Send payment success notification
                if (course) {
                    notificationService.sendPaymentSuccessNotification(
                        result.transaction.user_id,
                        course.title,
                        result.transaction.amount,
                        result.transaction.currency
                    ).catch(err => logger.error('Failed to send payment success notification', { error: err.message }));

                    // Send enrollment notification
                    notificationService.sendCourseEnrollmentNotification(
                        result.transaction.user_id,
                        course.id,
                        course.title
                    ).catch(err => logger.error('Failed to send enrollment notification', { error: err.message }));

                    // Get user details for email notification
                    const user = await db('users').where({ id: result.transaction.user_id }).first();

                    if (user) {
                        // Send payment success email notification (don't block response if it fails)
                        emailService.sendPaymentSuccessEmail({
                            email: user.email,
                            username: user.username,
                            courseName: course.title,
                            amount: result.transaction.amount,
                            currency: result.transaction.currency
                        }).catch(err => logger.error('Failed to send payment success email', { error: err.message }));

                        // Send enrollment email notification (don't block response if it fails)
                        emailService.sendEnrollmentEmail({
                            email: user.email,
                            courseName: course.title,
                            courseUrl: `${process.env.FRONTEND_URL}/courses/${course.id}`
                        }).catch(err => logger.error('Failed to send enrollment email', { error: err.message }));
                    }
                }

                res.status(200).json({
                    success: true,
                    message: 'Payment verified successfully',
                    data: result.transaction
                });
            } else {
                // Send payment failure notification
                const transaction = await db('transactions').where({ id: transactionId }).first();
                if (transaction) {
                    const course = await db('courses').where({ id: transaction.course_id }).first();
                    const user = await db('users').where({ id: transaction.user_id }).first();

                    if (course) {
                        notificationService.sendPaymentFailedNotification(
                            transaction.user_id,
                            course.title,
                            result.message
                        ).catch(err => logger.error('Failed to send payment failure notification', { error: err.message }));

                        // Send payment failure email notification (don't block response if it fails)
                        if (user) {
                            emailService.sendPaymentFailedEmail({
                                email: user.email,
                                username: user.username,
                                courseName: course.title,
                                reason: result.message
                            }).catch(err => logger.error('Failed to send payment failure email', { error: err.message }));
                        }
                    }
                }

                res.status(400).json({
                    success: false,
                    error: result.message || 'Payment verification failed'
                });
            }
        } catch (error) {
            logger.error('Payment verification failed', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Verify payment by reference (for direct Paystack verification when local transaction is not found)
     * POST /api/payments/verify-by-ref/:reference
     */
    async verifyByReference(req, res) {
        try {
            const { reference } = req.params;
            const { provider } = req.body;

            if (!provider) {
                return res.status(400).json({
                    success: false,
                    error: 'Payment provider is required'
                });
            }

            // If not Paystack, return error
            if (provider !== 'paystack') {
                return res.status(400).json({
                    success: false,
                    error: 'Reference verification only supported for Paystack'
                });
            }

            // Find transaction by provider_reference
            const transaction = await db('transactions')
                .where({ provider_reference: reference })
                .first();

            if (transaction) {
                // If transaction exists, use normal verification via service
                const result = await paymentService.verifyPayment(transaction.id, provider);

                if (result.success) {
                    // Get course details for notification
                    const course = await db('courses')
                        .where({ id: result.transaction.course_id })
                        .first();

                    // Send payment success notification
                    if (course) {
                        notificationService.sendPaymentSuccessNotification(
                            result.transaction.user_id,
                            course.title,
                            result.transaction.amount,
                            result.transaction.currency
                        ).catch(err => logger.error('Failed to send payment success notification', { error: err.message }));

                        // Send enrollment notification
                        notificationService.sendCourseEnrollmentNotification(
                            result.transaction.user_id,
                            course.id,
                            course.title
                        ).catch(err => logger.error('Failed to send enrollment notification', { error: err.message }));

                        // Get user details for email notification
                        const user = await db('users').where({ id: result.transaction.user_id }).first();

                        if (user) {
                            // Send payment success email notification (don't block response if it fails)
                            emailService.sendPaymentSuccessEmail({
                                email: user.email,
                                username: user.username,
                                courseName: course.title,
                                amount: result.transaction.amount,
                                currency: result.transaction.currency
                            }).catch(err => logger.error('Failed to send payment success email', { error: err.message }));

                            // Send enrollment email notification (don't block response if it fails)
                            emailService.sendEnrollmentEmail({
                                email: user.email,
                                courseName: course.title,
                                courseUrl: `${process.env.FRONTEND_URL}/courses/${course.id}`
                            }).catch(err => logger.error('Failed to send enrollment email', { error: err.message }));
                        }
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Payment verified successfully',
                        data: result.transaction
                    });
                } else {
                    // Check if it's pending/ongoing and automatic call -> treat as canceled
                    let error = result.error || 'Payment verification failed'
                    if (result.error === "Payment is still processing, please wait" && req.body.automatic) {
                        error = "Payment was canceled by user"
                    }
                    res.status(400).json({
                        success: false,
                        error: error
                    });
                }
                return;
            } else {
                // If no local transaction found, verify directly with Paystack
                const paymentService = require('../../services/paymentService');
                const result = await paymentService.verifyPaystackPayment(reference);

                if (result.verified) {
                    return res.status(200).json({
                        success: true,
                        message: 'Payment verified successfully',
                        status: 'success'
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        error: result.error || 'Payment verification failed',
                        status: result.status || 'failed'
                    });
                }
            }
        } catch (error) {
            logger.error('Payment verification by reference failed', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get user's transaction history
     * GET /api/payments/transactions
     */
    async getTransactions(req, res) {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 10, status } = req.query;

            let query = db('transactions')
                .where({ user_id: userId })
                .orderBy('created_at', 'desc');

            if (status) {
                query = query.where({ status });
            }

            const offset = (page - 1) * limit;
            const transactions = await query.limit(limit).offset(offset);

            const totalQuery = db('transactions').where({ user_id: userId });
            if (status) {
                totalQuery.where({ status });
            }
            const [{ count }] = await totalQuery.count('* as count');

            res.status(200).json({
                success: true,
                data: transactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(count),
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            logger.error('Failed to fetch transactions', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Get specific transaction
     * GET /api/payments/transactions/:id
     */
    async getTransaction(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const transaction = await db('transactions')
                .where({ id, user_id: userId })
                .first();

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found'
                });
            }

            res.status(200).json({
                success: true,
                data: transaction
            });
        } catch (error) {
            logger.error('Failed to fetch transaction', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Process refund (admin only)
     * POST /api/payments/refund/:transactionId
     */
    async refundPayment(req, res) {
        try {
            const { transactionId } = req.params;
            const { reason } = req.body;

            const result = await paymentService.refundPayment(transactionId, reason);

            if (result.success) {
                // Get transaction and course details for notification
                const transaction = await db('transactions').where({ id: transactionId }).first();
                if (transaction) {
                    const course = await db('courses').where({ id: transaction.course_id }).first();
                    const user = await db('users').where({ id: transaction.user_id }).first();

                    if (course) {
                        notificationService.sendRefundNotification(
                            transaction.user_id,
                            course.title,
                            transaction.amount,
                            transaction.currency
                        ).catch(err => logger.error('Failed to send refund notification', { error: err.message }));

                        // Send refund email notification (don't block response if it fails)
                        if (user) {
                            emailService.sendRefundProcessedEmail({
                                email: user.email,
                                username: user.username,
                                courseName: course.title,
                                amount: transaction.amount,
                                currency: transaction.currency
                            }).catch(err => logger.error('Failed to send refund email', { error: err.message }));
                        }
                    }
                }

                res.status(200).json({
                    success: true,
                    message: result.message
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.message
                });
            }
        } catch (error) {
            logger.error('Refund failed', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Stripe webhook handler
     * POST /api/payments/webhooks/stripe
     */
    async stripeWebhook(req, res) {
        try {
            const signature = req.headers['stripe-signature'];
            const payload = req.body;

            const result = await paymentService.handleWebhook('stripe', payload, signature);

            if (result.success) {
                res.status(200).json({ received: true });
            } else {
                res.status(400).json({ error: result.error || 'Webhook processing failed' });
            }
        } catch (error) {
            logger.error('Stripe webhook error', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Paystack webhook handler
     * POST /api/payments/webhooks/paystack
     */
    async paystackWebhook(req, res) {
        try {
            const signature = req.headers['x-paystack-signature'];
            const payload = req.body;

            const result = await paymentService.handleWebhook('paystack', payload, signature);

            if (result.success) {
                res.status(200).json({ received: true });
            } else {
                res.status(400).json({ error: result.message || 'Webhook processing failed' });
            }
        } catch (error) {
            logger.error('Paystack webhook error', { error: error.message });
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get payment configuration (public keys for frontend)
     * GET /api/payments/config
     */
    async getPaymentConfig(req, res) {
        try {
            // Get active payment providers with decrypted keys for public config
            const db = require('../../config/knex');
            const PaymentEncryption = require('../../utils/encryption');

            const activeProviders = await db('payment_providers')
                .where('is_active', true)
                .select('provider_name', 'public_key_encrypted', 'secret_key_encrypted');

            // Build configuration from active providers with decrypted keys
            const config = {
                stripe: {
                    enabled: false,
                    publishableKey: null
                },
                paystack: {
                    enabled: false,
                    publicKey: null
                },
                defaultCurrency: process.env.DEFAULT_CURRENCY || 'NGN' // Changed to NGN as default
            };

            // Map active providers to config, decrypting public keys
            for (const provider of activeProviders) {
                if (provider.provider_name === 'stripe' && provider.public_key_encrypted) {
                    config.stripe.enabled = true;
                    config.stripe.publishableKey = PaymentEncryption.decrypt(provider.public_key_encrypted);
                } else if (provider.provider_name === 'paystack' && provider.public_key_encrypted) {
                    config.paystack.enabled = true;
                    config.paystack.publicKey = PaymentEncryption.decrypt(provider.public_key_encrypted);
                }
            }

            res.status(200).json({
                success: true,
                data: config
            });
        } catch (error) {
            logger.error('Failed to fetch payment config', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new PaymentController();
