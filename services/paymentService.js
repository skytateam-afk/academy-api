/**
 * Payment Service
 * Handles payment processing with Stripe and Paystack
 */

const Stripe = require('stripe');
const Paystack = require('paystack-node');
const db = require('../config/knex');
const PaymentProviderService = require('../modules/payments/paymentProviderService');
const emailService = require('./emailService');
const notificationService = require('../modules/notifications/services/notificationService');
const logger = require('../config/winston');
const UserSubscription = require('../models/UserSubscription');

class PaymentService {
    constructor() {
        // Providers will be loaded from database dynamically
        this.providers = new Map();

        console.log('Payment Service initialized - loading providers from database');
    }

    /**
     * Get provider instance (lazy loading from database)
     */
    async getProvider(providerName) {
        if (this.providers.has(providerName)) {
            return this.providers.get(providerName);
        }

        const config = await PaymentProviderService.getProviderConfig(providerName);
        if (!config) {
            console.log(`❌ ${providerName} config not found`);
            return null;
        }

        console.log(`✅ Found ${providerName} config, secretKey exists: ${!!config.secretKey}`);

        let instance = null;

        if (providerName === 'stripe' && config.secretKey) {
            instance = new Stripe(config.secretKey);
            console.log(`✅ Stripe instance created`);
        } else if (providerName === 'paystack' && config.secretKey) {
            try {
                instance = new Paystack(config.secretKey);
                console.log(`✅ Paystack instance created, has initializeTransaction method: ${!!instance?.initializeTransaction}`);
            } catch (error) {
                console.error(`❌ Paystack instance creation failed:`, error.message);
                return null;
            }
        }

        if (instance) {
            this.providers.set(providerName, instance);
        } else {
            console.log(`❌ Failed to create ${providerName} instance`);
        }

        return instance;
    }

    /**
     * Determine the best payment provider based on currency
     */
    getProviderForCurrency(currency) {
        // Paystack for Nigerian Naira
        if (currency.toUpperCase() === 'NGN') {
            return 'paystack';
        }
        // Stripe for all other currencies
        return 'stripe';
    }

    /**
     * Create a payment intent/transaction
     */
    /**
     * Create a payment intent/transaction
     */
    async createPayment({ userId, courseId, orderId, amount, currency = 'USD', provider, metadata = {} }) {
        try {
            // Check if course is free (only if courseId is provided)
            if (courseId && amount === 0) {
                return await this.createFreeEnrollment(userId, courseId);
            }

            // Auto-determine provider if not specified
            if (!provider) {
                provider = this.getProviderForCurrency(currency);
                console.log(`Currency ${currency} -> Provider ${provider} (before validation)`);
            }

            // Check if the determined provider is actually available
            const config = await PaymentProviderService.getProviderConfig(provider);
            if (!config) {
                // Try fallback to other provider
                const fallbackProvider = provider === 'paystack' ? 'stripe' : 'paystack';
                const fallbackConfig = await PaymentProviderService.getProviderConfig(fallbackProvider);
                if (fallbackConfig) {
                    console.log(`Provider ${provider} not available, falling back to ${fallbackProvider}`);
                    provider = fallbackProvider;
                } else {
                    throw new Error(`No payment provider available for currency ${currency}`);
                }
            }

            // Create transaction record
            const transactionData = {
                user_id: userId,
                amount,
                currency: currency.toUpperCase(),
                payment_method: provider,
                payment_provider: provider,
                status: 'pending',
                payment_metadata: JSON.stringify(metadata)
            };

            if (courseId) {
                transactionData.course_id = courseId;
            }

            if (orderId) {
                transactionData.order_id = orderId;
            }

            const transaction = await db('transactions')
                .insert(transactionData)
                .returning('*');

            const transactionId = transaction[0].id;

            // Create payment with provider
            let paymentData;
            if (provider === 'stripe') {
                paymentData = await this.createStripePayment({
                    amount,
                    currency,
                    transactionId,
                    userId,
                    courseId,
                    orderId,
                    metadata
                });
            } else if (provider === 'paystack') {
                paymentData = await this.createPaystackPayment({
                    amount,
                    currency,
                    transactionId,
                    userId,
                    courseId,
                    orderId,
                    metadata
                });
            }

            // Update transaction with provider details
            await db('transactions')
                .where({ id: transactionId })
                .update({
                    provider_transaction_id: paymentData.id,
                    provider_reference: paymentData.reference,
                    payment_metadata: JSON.stringify({
                        ...metadata,
                        ...paymentData
                    })
                });

            // If this is an order payment, also create a shop_transaction record
            if (orderId) {
                await db('shop_transactions').insert({
                    order_id: orderId,
                    transaction_id: transactionId,
                    amount,
                    currency: currency.toUpperCase(),
                    type: 'payment',
                    notes: `Payment initiated via ${provider}`
                });
            }

            return {
                transactionId,
                ...paymentData
            };
        } catch (error) {
            logger.error('Payment creation failed', { error: error.message, userId, courseId, orderId });
            throw error;
        }
    }

    /**
     * Create Stripe payment intent
     */
    /**
     * Create Stripe payment intent
     */
    async createStripePayment({ amount, currency, transactionId, userId, courseId, orderId, metadata }) {
        const stripe = await this.getProvider('stripe');
        if (!stripe) {
            throw new Error('Stripe is not configured');
        }

        try {
            // Define fallbacks for Redirect URLs
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const successUrlBase = process.env.PAYMENT_SUCCESS_URL || `${frontendUrl}/payment/success`;
            const cancelUrlBase = process.env.PAYMENT_CANCEL_URL || `${frontendUrl}/payment/cancel`;

            const successUrl = `${successUrlBase}${successUrlBase.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}&transactionId=${transactionId}`;
            const cancelUrl = `${cancelUrlBase}${cancelUrlBase.includes('?') ? '&' : '?'}transactionId=${transactionId}`;

            // 1. Create Payment Intent for embedded flow
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                metadata: {
                    transactionId,
                    userId,
                    courseId: courseId || '',
                    orderId: orderId || '',
                    ...metadata
                },
                automatic_payment_methods: {
                    enabled: true
                }
            });

            // 2. Create Checkout Session for redirect link flow
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: metadata.courseTitle || metadata.tierName || 'Academy Payment',
                            description: metadata.description || `Payment for transaction ${transactionId}`,
                        },
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    transactionId,
                    userId,
                    courseId: courseId || '',
                    orderId: orderId || '',
                    ...metadata
                },
                client_reference_id: transactionId
            });

            return {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                checkoutUrl: session.url,
                authorizationUrl: session.url, // Still available for redirect if needed
                reference: paymentIntent.id,
                sessionId: session.id,
                provider: 'stripe'
            };
        } catch (error) {
            logger.error('Stripe payment creation failed', { error: error.message });
            throw new Error(`Stripe error: ${error.message}`);
        }
    }

    /**
     * Create Paystack payment
     */
    /**
     * Create Paystack payment
     */
    async createPaystackPayment({ amount, currency, transactionId, userId, courseId, orderId, metadata }) {
        const paystack = await this.getProvider('paystack');
        if (!paystack) {
            throw new Error('Paystack is not configured');
        }

        try {
            // Get user email
            const user = await db('users').where({ id: userId }).first();
            if (!user) {
                throw new Error('User not found');
            }

            // Get Paystack config to retrieve callback URL
            const config = await PaymentProviderService.getProviderConfig('paystack');
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const callbackUrl = config?.configuration?.callback_url || process.env.PAYMENT_SUCCESS_URL || `${frontendUrl}/payment/success`;

            const response = await paystack.initializeTransaction({
                amount: Math.round(amount * 100), // Convert to kobo/cents
                email: user.email,
                currency: currency.toUpperCase(),
                reference: `TXN-${transactionId}`,
                metadata: JSON.stringify({
                    transactionId,
                    userId,
                    courseId: courseId || '',
                    orderId: orderId || '',
                    ...metadata
                }),
                callback_url: callbackUrl
            });

            console.log('Paystack callback URL:', callbackUrl);
            console.log('Paystack request payload:', {
                amount: Math.round(amount * 100),
                email: user.email,
                currency: currency.toUpperCase(),
                reference: `TXN-${transactionId}`,
                callback_url: callbackUrl
            });

            console.log('Paystack response status:', response.statusCode);
            console.log('Paystack response body type:', typeof response.body);

            let responseBody = response.body;
            if (typeof responseBody === 'string') {
                try {
                    responseBody = JSON.parse(responseBody);
                } catch (e) {
                    console.error('Failed to parse Paystack response body:', e);
                }
            }

            console.log('Paystack response body:', responseBody);

            if (!responseBody || !responseBody.status) {
                console.error('Paystack initialization failed:', {
                    status: responseBody?.status,
                    message: responseBody?.message,
                    hasData: !!responseBody?.data,
                    callback_url: callbackUrl
                });
                throw new Error(`Paystack API error: ${responseBody?.message || 'Initialization failed'}`);
            }

            return {
                id: responseBody.data.reference,
                authorizationUrl: responseBody.data.authorization_url,
                accessCode: responseBody.data.access_code,
                reference: responseBody.data.reference,
                provider: 'paystack'
            };
        } catch (error) {
            logger.error('Paystack payment creation failed', { error: error.message });
            throw new Error(`Paystack error: ${error.message}`);
        }
    }

    /**
     * Verify payment status
     */
    /**
     * Verify payment status
     */
    async verifyPayment(transactionId, provider) {
        try {
            let transaction;

            // Check if transactionId is a valid UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId);

            if (isUuid) {
                transaction = await db('transactions')
                    .where({ id: transactionId })
                    .first();
            } else {
                // Try to find by provider transaction ID or reference
                transaction = await db('transactions')
                    .where({ provider_transaction_id: transactionId })
                    .orWhere({ provider_reference: transactionId })
                    .first();
            }

            if (!transaction) {
                return {
                    success: false,
                    error: 'Transaction not found - this payment session may have expired',
                    code: 'TRANSACTION_NOT_FOUND'
                };
            }

            // Return early if already completed (Prevents race conditions between frontend and webhook)
            if (transaction.status === 'completed' || transaction.status === 'refunded') {
                return {
                    success: true,
                    message: `Payment already ${transaction.status}`,
                    transaction,
                    alreadyProcessed: true
                };
            }

            let verificationResult;
            let verified = false;
            let providerData = {};

            if (provider === 'stripe') {
                verificationResult = await this.verifyStripePayment(transaction.provider_transaction_id, await this.getProvider('stripe'));
                verified = verificationResult.verified;
                if (verified) {
                    const stripe = await this.getProvider('stripe');
                    if (stripe) {
                        providerData = await stripe.paymentIntents.retrieve(transaction.provider_transaction_id);
                    }
                }
            } else if (provider === 'paystack') {
                verificationResult = await this.verifyPaystackPayment(transaction.provider_reference);
                verified = verificationResult.verified;
                if (verified) {
                    providerData = verificationResult.data;
                }
            } else {
                return {
                    success: false,
                    error: 'Unknown payment provider',
                    code: 'UNKNOWN_PROVIDER'
                };
            }

            if (verified) {
                // Merge existing metadata with provider data
                let existingMetadata = {};
                try {
                    existingMetadata = typeof transaction.payment_metadata === 'string'
                        ? JSON.parse(transaction.payment_metadata)
                        : transaction.payment_metadata || {};
                } catch (e) {
                    existingMetadata = {};
                }

                await db('transactions')
                    .where({ id: transaction.id })
                    .update({
                        status: 'completed',
                        paid_at: new Date(),
                        payment_metadata: JSON.stringify({
                            ...existingMetadata,
                            ...providerData
                        })
                    });

                // Handle Course Enrollment
                if (transaction.course_id) {
                    await this.createEnrollment(transaction.user_id, transaction.course_id, transaction.id);

                    // Send Notifications (Email + In-App)
                    try {
                        const user = await db('users').where({ id: transaction.user_id }).first();
                        const course = await db('courses').select('id', 'title').where({ id: transaction.course_id }).first();
                        const notificationService = require('../modules/notifications/services/notificationService');

                        if (user && course) {
                            // 1. In-App Notifications
                            await notificationService.sendPaymentSuccessNotification(
                                user.id,
                                course.title,
                                transaction.amount,
                                transaction.currency
                            );

                            await notificationService.sendCourseEnrollmentNotification(
                                user.id,
                                course.id,
                                course.title
                            );

                            // 2. Email Confirmation
                            await emailService.sendPaymentSuccessEmail({
                                email: user.email,
                                username: user.username || user.first_name,
                                courseName: course.title,
                                amount: transaction.amount,
                                currency: transaction.currency
                            });
                            logger.info('Payment success notifications sent', { userId: user.id, courseId: transaction.course_id });
                        }
                    } catch (notifError) {
                        logger.error('Failed to send payment success notifications', { error: notifError.message, transactionId });
                    }
                }

                // Handle Subscription Activation
                let metadata = {};
                if (typeof transaction.payment_metadata === 'string') {
                    try {
                        metadata = JSON.parse(transaction.payment_metadata);
                    } catch (e) {
                        // ignore
                    }
                } else {
                    metadata = transaction.payment_metadata || {};
                }

                if (metadata.type === 'subscription_payment') {
                    let subscription;
                    if (metadata.subscriptionId) {
                        subscription = await UserSubscription.activateSubscription(metadata.subscriptionId, {
                            amountPaid: transaction.amount,
                            paymentProvider: provider,
                            subscriptionId: transaction.provider_transaction_id || transaction.provider_reference
                        });
                        logger.info('Subscription activated via payment', { subscriptionId: metadata.subscriptionId, transactionId: transaction.id });
                    } else if (metadata.tierId) {
                        // Create and activate subscription directly (matches course enrollment flow)
                        subscription = await UserSubscription.subscribeUser(transaction.user_id, metadata.tierId, {
                            status: 'active',
                            paymentProvider: provider,
                            subscriptionId: transaction.provider_transaction_id || transaction.provider_reference,
                            amountPaid: transaction.amount,
                            metadata: metadata
                        });
                        logger.info('Subscription created and activated via direct payment (tierId flow)', { subscriptionId: subscription.id, transactionId: transaction.id, tierId: metadata.tierId });
                    }

                    // Send Notifications & Emails for Subscription
                    if (subscription) {
                        try {
                            const user = await db('users').where({ id: transaction.user_id }).first();
                            const tier = await db('subscription_tiers').where({ id: subscription.tierId || metadata.tierId }).first();
                            const notificationService = require('../modules/notifications/services/notificationService');

                            if (user && tier) {
                                // 1. In-app Notification
                                await notificationService.sendSubscriptionActivationNotification(
                                    user.id,
                                    tier.name,
                                    subscription.expiresAt
                                );

                                // 2. Email Confirmation
                                await emailService.sendSubscriptionActivationEmail({
                                    email: user.email,
                                    username: user.username || user.first_name,
                                    tierName: tier.name,
                                    expiresAt: subscription.expiresAt,
                                    amount: transaction.amount,
                                    currency: transaction.currency
                                });

                                logger.info('Subscription confirmation sent', { userId: user.id, tierId: tier.id });
                            }
                        } catch (notifError) {
                            logger.error('Failed to send subscription notifications', { error: notifError.message, transactionId });
                        }
                    }
                }

                // Handle Order Completion
                if (transaction.order_id) {
                    // Update order status
                    await db('shop_orders')
                        .where({ id: transaction.order_id })
                        .update({
                            status: 'processing', // Or 'paid' depending on workflow
                            payment_status: 'paid',
                            payment_method: provider,
                            payment_provider_id: transaction.provider_transaction_id,
                            transaction_id: transaction.id,
                            paid_at: new Date()
                        });

                    // Update shop_transaction status
                    await db('shop_transactions')
                        .where({ transaction_id: transaction.id })
                        .update({
                            transaction_id: transaction.id // Ensure link
                        });
                }

                return { success: true, transaction };
            }

            // Handle explicit failures
            const failureStatuses = ['failed', 'abandoned', 'canceled', 'requires_payment_method'];
            if (failureStatuses.includes(verificationResult.status) || (!verificationResult.verified && verificationResult.error)) {

                // Parse existing metadata to ensure we don't lose it
                let currentMetadata = {};
                try {
                    currentMetadata = typeof transaction.payment_metadata === 'string'
                        ? JSON.parse(transaction.payment_metadata)
                        : transaction.payment_metadata || {};
                } catch (e) { }

                await db('transactions')
                    .where({ id: transaction.id })
                    .update({
                        status: 'failed',
                        payment_metadata: JSON.stringify({
                            ...currentMetadata,
                            ...verificationResult
                        })
                    });

                // Send Failure Email
                try {
                    const user = await db('users').where({ id: transaction.user_id }).first();
                    const notificationService = require('../modules/notifications/services/notificationService');
                    let itemName = 'Service';

                    // Use currentMetadata for type checks
                    if (transaction.course_id) {
                        const course = await db('courses').select('title').where({ id: transaction.course_id }).first();
                        if (course) itemName = course.title;
                    } else if (currentMetadata.type === 'subscription_payment') {
                        if (currentMetadata.tierName) {
                            itemName = currentMetadata.tierName;
                        } else if (currentMetadata.tierId) {
                            const tier = await db('subscription_tiers').select('name').where({ id: currentMetadata.tierId }).first();
                            if (tier) itemName = tier.name;
                        } else {
                            itemName = 'Subscription';
                        }
                    }

                    if (user) {
                        // 1. In-App Notification
                        await notificationService.sendPaymentFailedNotification(
                            user.id,
                            itemName,
                            verificationResult.error || 'Payment failed'
                        );

                        // 2. Email Confirmation
                        await emailService.sendPaymentFailedEmail({
                            email: user.email,
                            username: user.username || user.first_name,
                            courseName: itemName, // Reusing field for item name
                            reason: verificationResult.error || 'Payment failed'
                        });
                        logger.info('Payment failure notifications sent', { userId: user.id, transactionId });
                    }
                } catch (notifError) {
                    logger.error('Failed to send payment failure notifications', { error: notifError.message, transactionId });
                }
            }

            // Return the specific error from the provider verification
            return {
                success: false,
                error: verificationResult.error || 'Payment verification failed',
                code: verificationResult.status || 'VERIFICATION_FAILED',
                provider
            };
        } catch (error) {
            logger.error('Payment verification failed', { error: error.message, transactionId });
            return {
                success: false,
                error: `Payment service error: ${error.message}`,
                code: 'SERVICE_ERROR'
            };
        }
    }

    /**
     * Verify Stripe payment
     */
    async verifyStripePayment(paymentIntentId, stripeInstance) {
        if (!stripeInstance) return { verified: false, error: 'Stripe provider not available' };

        try {
            const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

            // Return detailed status information
            switch (paymentIntent.status) {
                case 'succeeded':
                    return { verified: true, status: 'succeeded', data: paymentIntent };
                case 'requires_payment_method':
                    return { verified: false, error: 'Payment failed - no valid payment method provided', status: paymentIntent.status };
                case 'requires_confirmation':
                    return { verified: false, error: 'Payment requires confirmation', status: paymentIntent.status };
                case 'canceled':
                    return { verified: false, error: 'Payment was cancelled', status: paymentIntent.status };
                case 'requires_capture':
                    return { verified: false, error: 'Payment requires capture before verification', status: paymentIntent.status };
                default:
                    return { verified: false, error: `Payment status: ${paymentIntent.status}`, status: paymentIntent.status };
            }
        } catch (error) {
            logger.error('Stripe verification failed', { error: error.message });
            return { verified: false, error: `Stripe verification error: ${error.message}` };
        }
    }

    /**
     * Verify Paystack payment
     */
    async verifyPaystackPayment(reference) {
        const paystack = await this.getProvider('paystack');
        if (!paystack) return { verified: false, error: 'Paystack provider not available' };

        try {
            const response = await paystack.verifyTransaction({ reference });

            console.log('Paystack verification response:', response.body);

            const responseBody = response.body;

            if (responseBody && responseBody.status && responseBody.data.status === 'success') {
                return {
                    verified: true,
                    status: 'success',
                    data: responseBody.data
                };
            }

            // Specific Paystack failure reasons
            if (responseBody && responseBody.data && responseBody.data.status) {
                const status = responseBody.data.status;
                switch (status) {
                    case 'failed':
                        return { verified: false, error: 'Payment failed - transaction was declined', status };
                    case 'abandoned':
                        return { verified: false, error: 'Payment was abandoned by user', status };
                    case 'ongoing':
                    case 'pending':
                        return { verified: false, error: 'Payment is still processing, please wait', status };
                    default:
                        return { verified: false, error: `Payment status: ${status}`, status };
                }
            }

            return {
                verified: false,
                error: responseBody?.message || 'Unable to verify payment status',
                status: responseBody?.data?.status || 'unknown'
            };
        } catch (error) {
            logger.error('Paystack verification failed', { error: error.message });
            return { verified: false, error: `Paystack verification error: ${error.message}` };
        }
    }

    /**
     * Create enrollment after successful payment
     */
    async createEnrollment(userId, courseId, transactionId) {
        try {
            // Check if enrollment already exists
            const existing = await db('enrollments')
                .where({ user_id: userId, course_id: courseId })
                .first();

            if (existing) {
                logger.info('Enrollment already exists', { userId, courseId });
                return existing;
            }

            // Create enrollment
            const enrollment = await db('enrollments')
                .insert({
                    user_id: userId,
                    course_id: courseId,
                    transaction_id: transactionId,
                    enrollment_type: 'paid',
                    status: 'active',
                    enrolled_at: new Date()
                })
                .returning('*');

            logger.info('Enrollment created', { userId, courseId, enrollmentId: enrollment[0].id });
            return enrollment[0];
        } catch (error) {
            logger.error('Enrollment creation failed', { error: error.message, userId, courseId });
            throw error;
        }
    }

    /**
     * Create free enrollment (no payment required)
     */
    async createFreeEnrollment(userId, courseId) {
        try {
            // Check if enrollment already exists
            const existing = await db('enrollments')
                .where({ user_id: userId, course_id: courseId })
                .first();

            if (existing) {
                return {
                    success: true,
                    message: 'Already enrolled',
                    enrollment: existing
                };
            }

            // Create free transaction record
            const transaction = await db('transactions')
                .insert({
                    user_id: userId,
                    course_id: courseId,
                    amount: 0,
                    currency: 'USD',
                    payment_method: 'free',
                    status: 'completed',
                    paid_at: new Date()
                })
                .returning('*');

            // Create enrollment
            const enrollment = await this.createEnrollment(userId, courseId, transaction[0].id);

            return {
                success: true,
                message: 'Free enrollment successful',
                enrollment,
                transaction: transaction[0]
            };
        } catch (error) {
            logger.error('Free enrollment failed', { error: error.message, userId, courseId });
            throw error;
        }
    }

    /**
     * Process refund
     */
    async refundPayment(transactionId, reason = '') {
        try {
            const transaction = await db('transactions')
                .where({ id: transactionId })
                .first();

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            if (transaction.status !== 'completed') {
                throw new Error('Only completed transactions can be refunded');
            }

            let refunded = false;

            if (transaction.payment_provider === 'stripe') {
                refunded = await this.refundStripePayment(transaction.provider_transaction_id);
            } else if (transaction.payment_provider === 'paystack') {
                refunded = await this.refundPaystackPayment(transaction.provider_reference);
            }

            if (refunded) {
                await db('transactions')
                    .where({ id: transactionId })
                    .update({
                        status: 'refunded',
                        refunded_at: new Date(),
                        refund_reason: reason
                    });

                // Update enrollment status
                await db('enrollments')
                    .where({ transaction_id: transactionId })
                    .update({ status: 'suspended' });

                return { success: true, message: 'Refund processed successfully' };
            }

            return { success: false, message: 'Refund failed' };
        } catch (error) {
            logger.error('Refund failed', { error: error.message, transactionId });
            throw error;
        }
    }

    /**
     * Refund Stripe payment
     */
    async refundStripePayment(paymentIntentId) {
        const stripe = await this.getProvider('stripe');
        if (!stripe) return false;

        try {
            await stripe.refunds.create({
                payment_intent: paymentIntentId
            });
            return true;
        } catch (error) {
            logger.error('Stripe refund failed', { error: error.message });
            return false;
        }
    }

    /**
     * Refund Paystack payment
     */
    async refundPaystackPayment(reference) {
        const paystack = await this.getProvider('paystack');
        if (!paystack) return false;

        try {
            const response = await paystack.refund.create({
                transaction: reference
            });
            return response.status;
        } catch (error) {
            logger.error('Paystack refund failed', { error: error.message });
            return false;
        }
    }

    /**
     * Handle webhook events
     */
    async handleWebhook(provider, payload, signature, rawBody) {
        try {
            // Log webhook
            await db('payment_webhooks').insert({
                provider,
                event_type: payload.type || payload.event,
                payload: JSON.stringify(payload),
                processed: false
            });

            if (provider === 'stripe') {
                return await this.handleStripeWebhook(payload, signature, rawBody);
            } else if (provider === 'paystack') {
                return await this.handlePaystackWebhook(payload, signature, rawBody);
            }

            return { success: false, message: 'Unknown provider' };
        } catch (error) {
            logger.error('Webhook handling failed', { error: error.message, provider });
            throw error;
        }
    }

    /**
     * Handle Stripe webhook
     */
    async handleStripeWebhook(payload, signature, rawBody) {
        const stripe = await this.getProvider('stripe');
        if (!stripe) return { success: false };

        try {
            const config = await PaymentProviderService.getProviderConfig('stripe');
            const webhookSecret = config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

            if (!webhookSecret) {
                return { success: false, message: 'Stripe webhook secret not configured' };
            }

            const event = stripe.webhooks.constructEvent(rawBody || JSON.stringify(payload), signature, webhookSecret);

            if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
                const object = event.data.object;
                const transactionId = object.metadata?.transactionId || object.client_reference_id;

                if (transactionId) {
                    // Check if already processed to prevent race conditions
                    const existingTx = await db('transactions').where({ id: transactionId }).select('status').first();
                    if (existingTx && (existingTx.status === 'completed' || existingTx.status === 'refunded')) {
                        return { success: true, message: 'Already processed' };
                    }

                    // Log which event triggered the verification
                    logger.info(`Stripe webhook: ${event.type} triggering verification for transaction ${transactionId}`);
                    await this.verifyPayment(transactionId, 'stripe');
                }
            }

            return { success: true };
        } catch (error) {
            logger.error('Stripe webhook error', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle Paystack webhook
     */
    async handlePaystackWebhook(payload, signature, rawBody) {
        try {
            const config = await PaymentProviderService.getProviderConfig('paystack');
            const webhookSecret = config?.webhookSecret;

            if (webhookSecret) {
                // Verify Paystack signature with webhook secret from database
                const hash = require('crypto')
                    .createHmac('sha512', webhookSecret)
                    .update(rawBody || JSON.stringify(payload))
                    .digest('hex');

                if (hash !== signature) {
                    return { success: false, message: 'Invalid signature' };
                }
            } else {
                // Fallback verification using environment variable
                const hash = require('crypto')
                    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
                    .update(rawBody || JSON.stringify(payload))
                    .digest('hex');

                if (hash !== signature) {
                    return { success: false, message: 'Invalid signature' };
                }
            }

            if (payload.event === 'charge.success') {
                const reference = payload.data.reference;
                const transactionId = reference.replace('TXN-', '');

                if (transactionId) {
                    // Check if already processed to prevent race conditions
                    const existingTx = await db('transactions').where({ id: transactionId }).select('status').first();
                    if (existingTx && (existingTx.status === 'completed' || existingTx.status === 'refunded')) {
                        return { success: true, message: 'Already processed' };
                    }
                    await this.verifyPayment(transactionId, 'paystack');
                }
            }

            return { success: true };
        } catch (error) {
            logger.error('Paystack webhook error', { error: error.message });
            return { success: false, error: error.message };
        }
    }
}

module.exports = new PaymentService();
