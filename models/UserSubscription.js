/**
 * UserSubscription Model
 * Handles database operations for user subscriptions
 */

const knex = require('../config/knex');
const { z } = require('zod');

class UserSubscription {
    static async create(data) {
        const subscription = {
            user_id: data.userId,
            tier_id: data.tierId,
            status: data.status || 'pending',
            started_at: data.startedAt || new Date(),
            expires_at: data.expiresAt,
            cancelled_at: data.cancelledAt,
            payment_provider: data.paymentProvider || 'manual',
            subscription_id: data.subscriptionId,
            amount_paid: data.amountPaid,
            currency: data.currency || 'USD',
            metadata: data.metadata,
            updated_at: new Date()
        };

        const [result] = await knex('user_subscriptions').insert(subscription).returning('*');
        return this.formatSubscription(result);
    }

    static async update(id, updates) {
        const updateData = {
            updated_at: new Date()
        };

        if (updates.status) updateData.status = updates.status;
        if (updates.startedAt) updateData.started_at = updates.startedAt;
        if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;
        if (updates.cancelledAt !== undefined) updateData.cancelled_at = updates.cancelledAt;
        if (updates.paymentProvider) updateData.payment_provider = updates.paymentProvider;
        if (updates.subscriptionId !== undefined) updateData.subscription_id = updates.subscriptionId;
        if (updates.amountPaid !== undefined) updateData.amount_paid = updates.amountPaid;
        if (updates.currency) updateData.currency = updates.currency;
        if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

        const [result] = await knex('user_subscriptions')
            .where({ id })
            .update(updateData)
            .returning('*');

        if (!result) {
            throw new Error('User subscription not found');
        }

        return this.formatSubscription(result);
    }

    static async delete(id) {
        const result = await knex('user_subscriptions').where({ id }).del();
        return result > 0;
    }

    static async getById(id) {
        const result = await knex('user_subscriptions')
            .where('user_subscriptions.id', id)
            .join('subscription_tiers', 'user_subscriptions.tier_id', 'subscription_tiers.id')
            .join('users', 'user_subscriptions.user_id', 'users.id')
            .select([
                'user_subscriptions.*',
                'subscription_tiers.name as tier_name',
                'subscription_tiers.slug as tier_slug',
                'subscription_tiers.price as tier_price',
                'subscription_tiers.currency as tier_currency',
                'subscription_tiers.billing_cycle_months as tier_billing_cycle_months',
                'subscription_tiers.features as tier_features',
                'users.first_name as user_first_name',
                'users.last_name as user_last_name',
                'users.email as user_email',
                'users.username as user_username'
            ])
            .first();

        return result ? this.formatSubscriptionWithDetails(result) : null;
    }

    static async getByUser(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            status,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = options;

        const query = knex('user_subscriptions')
            .where('user_subscriptions.user_id', userId)
            .join('subscription_tiers', 'user_subscriptions.tier_id', 'subscription_tiers.id')
            .join('users', 'user_subscriptions.user_id', 'users.id')
            .select([
                'user_subscriptions.*',
                'subscription_tiers.name as tier_name',
                'subscription_tiers.slug as tier_slug',
                'subscription_tiers.price as tier_price',
                'subscription_tiers.currency as tier_currency',
                'subscription_tiers.billing_cycle_months as tier_billing_cycle_months',
                'subscription_tiers.features as tier_features',
                'users.first_name as user_first_name',
                'users.last_name as user_last_name',
                'users.email as user_email',
                'users.username as user_username'
            ])
            .orderBy(`user_subscriptions.${sortBy}`, sortOrder);

        if (status) {
            query.where('user_subscriptions.status', status);
        }

        // Get total count separately (simpler query)
        const countQuery = knex('user_subscriptions')
            .where('user_subscriptions.user_id', userId);

        if (status) {
            countQuery.where('user_subscriptions.status', status);
        }

        const total = await countQuery.count('user_subscriptions.id as count').first();

        const subscriptions = await query
            .offset((page - 1) * limit)
            .limit(limit);

        const formattedSubscriptions = subscriptions.map(sub => this.formatSubscriptionWithDetails(sub));

        return {
            subscriptions: formattedSubscriptions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total.count),
                totalPages: Math.ceil(total.count / limit)
            }
        };
    }

    static async getByTier(tierId, options = {}) {
        const {
            page = 1,
            limit = 50,
            status,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = options;

        const query = knex('user_subscriptions')
            .where('user_subscriptions.tier_id', tierId)
            .join('users', 'user_subscriptions.user_id', 'users.id')
            .select([
                'user_subscriptions.*',
                'users.first_name as user_first_name',
                'users.last_name as user_last_name',
                'users.email as user_email',
                'users.username as user_username'
            ])
            .orderBy(`user_subscriptions.${sortBy}`, sortOrder);

        if (status) {
            query.where('user_subscriptions.status', status);
        }

        // Get total count separately (simpler query)
        const countQuery = knex('user_subscriptions')
            .where('user_subscriptions.tier_id', tierId);

        if (status) {
            countQuery.where('user_subscriptions.status', status);
        }

        const total = await countQuery.count('user_subscriptions.id as count').first();

        const subscriptions = await query
            .offset((page - 1) * limit)
            .limit(limit);

        const formattedSubscriptions = subscriptions.map(sub => this.formatSubscriptionWithDetails(sub));

        return {
            subscriptions: formattedSubscriptions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total.count),
                totalPages: Math.ceil(total.count / limit)
            }
        };
    }

    static async getAll(options = {}) {
        const {
            page = 1,
            limit = 50,
            status,
            userId,
            tierId,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = options;

        // Valid sort columns for user_subscriptions
        const validSortColumns = ['created_at', 'updated_at', 'started_at', 'expires_at', 'amount_paid'];
        const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

        // Get total count first (simpler query)
        let countQuery = knex('user_subscriptions');
        if (status) {
            countQuery = countQuery.where('user_subscriptions.status', status);
        }
        if (userId) {
            countQuery = countQuery.where('user_subscriptions.user_id', userId);
        }
        if (tierId) {
            countQuery = countQuery.where('user_subscriptions.tier_id', tierId);
        }
        const total = await countQuery.count('user_subscriptions.id as count').first();

        // Then get the actual data
        let dataQuery = knex('user_subscriptions')
            .join('subscription_tiers', 'user_subscriptions.tier_id', 'subscription_tiers.id')
            .join('users', 'user_subscriptions.user_id', 'users.id')
            .select([
                'user_subscriptions.*',
                'subscription_tiers.name as tier_name',
                'subscription_tiers.slug as tier_slug',
                'subscription_tiers.price as tier_price',
                'subscription_tiers.currency as tier_currency',
                'subscription_tiers.billing_cycle_months as tier_billing_cycle_months',
                'subscription_tiers.features as tier_features',
                'users.first_name as user_first_name',
                'users.last_name as user_last_name',
                'users.email as user_email',
                'users.username as user_username'
            ])
            .orderBy(`user_subscriptions.${finalSortBy}`, sortOrder);

        if (status) {
            dataQuery = dataQuery.where('user_subscriptions.status', status);
        }
        if (userId) {
            dataQuery = dataQuery.where('user_subscriptions.user_id', userId);
        }
        if (tierId) {
            dataQuery = dataQuery.where('user_subscriptions.tier_id', tierId);
        }

        const subscriptions = await dataQuery
            .offset((page - 1) * limit)
            .limit(limit);

        const formattedSubscriptions = subscriptions.map(sub => this.formatSubscriptionWithDetails(sub));

        return {
            subscriptions: formattedSubscriptions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total.count),
                totalPages: Math.ceil(total.count / limit)
            }
        };
    }

    static async subscribeUser(userId, tierId, options = {}) {
        const tier = await require('./SubscriptionTier').getById(tierId);
        if (!tier) {
            throw new Error('Subscription tier not found');
        }

        // Check if user already has active subscription to this tier
        const existingSubscription = await knex('user_subscriptions')
            .where('user_id', userId)
            .where('tier_id', tierId)
            .where('status', 'active')
            .first();

        if (existingSubscription) {
            throw new Error('User already has an active subscription to this tier');
        }

        const status = options.status || 'active';

        // Calculate expiration date only if active
        let startDate = null;
        let expirationDate = null;

        if (status === 'active') {
            startDate = new Date();
            expirationDate = new Date(startDate);
            expirationDate.setMonth(expirationDate.getMonth() + tier.billingCycleMonths);
        }

        const subscriptionData = {
            userId,
            tierId,
            status: status,
            startedAt: startDate,
            expiresAt: expirationDate,
            paymentProvider: options.paymentProvider || 'manual',
            subscriptionId: options.subscriptionId,
            amountPaid: options.amountPaid !== undefined ? options.amountPaid : (status === 'active' ? tier.price : 0), // Set amount paid only if active immediately
            currency: tier.currency,
            metadata: options.metadata || {}
        };

        const subscription = await this.create(subscriptionData);

        // Update user's active subscription only if active
        if (status === 'active') {
            await knex('users')
                .where('id', userId)
                .update({ active_subscription_id: subscription.id, updated_at: new Date() });
        }

        return subscription;
    }

    static async activateSubscription(subscriptionId, transactionDetails = {}) {
        const subscription = await this.getById(subscriptionId);
        if (!subscription) {
            throw new Error('Subscription not found');
        }

        if (subscription.status === 'active') {
            return subscription; // Already active
        }

        // Calculate usage dates
        const startDate = new Date();
        const expirationDate = new Date(startDate);
        expirationDate.setMonth(expirationDate.getMonth() + subscription.tier.billingCycleMonths);

        // Prepare update data
        const updateData = {
            status: 'active',
            started_at: startDate,
            expires_at: expirationDate,
            updated_at: new Date()
        };

        // Add payment details if provided
        if (transactionDetails.amountPaid !== undefined) updateData.amount_paid = transactionDetails.amountPaid;
        if (transactionDetails.paymentProvider) updateData.payment_provider = transactionDetails.paymentProvider;
        if (transactionDetails.subscriptionId) updateData.subscription_id = transactionDetails.subscriptionId;

        // Perform update
        const [result] = await knex('user_subscriptions')
            .where({ id: subscriptionId })
            .update(updateData)
            .returning('*');

        // Update user's active subscription
        await knex('users')
            .where('id', subscription.userId)
            .update({ active_subscription_id: subscription.id, updated_at: new Date() });

        return this.formatSubscription(result);
    }

    static async cancelSubscription(subscriptionId, reason) {
        const now = new Date();
        const [result] = await knex('user_subscriptions')
            .where({ id: subscriptionId })
            .update({
                status: 'cancelled',
                cancelled_at: now,
                metadata: knex.raw("COALESCE(metadata, '{}'::jsonb) || ?::jsonb", [JSON.stringify({ cancellation_reason: reason, cancelled_at: now })]),
                updated_at: now
            })
            .returning('*');

        if (!result) {
            throw new Error('Subscription not found');
        }

        // Clear user's active subscription if it was this one
        await knex('users')
            .where('active_subscription_id', subscriptionId)
            .update({
                active_subscription_id: null,
                updated_at: new Date()
            });

        return this.formatSubscription(result);
    }

    static async renewSubscription(subscriptionId, extendMonths = null) {
        const subscription = await knex('user_subscriptions')
            .where({ id: subscriptionId })
            .join('subscription_tiers', 'user_subscriptions.tier_id', 'subscription_tiers.id')
            .select([
                'user_subscriptions.*',
                'subscription_tiers.billing_cycle_months'
            ])
            .first();

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        const currentExpiresAt = subscription.expires_at ? new Date(subscription.expires_at) : new Date();
        const monthsToAdd = extendMonths || subscription.billing_cycle_months;
        const newExpiresAt = new Date(currentExpiresAt);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + monthsToAdd);

        const [result] = await knex('user_subscriptions')
            .where({ id: subscriptionId })
            .update({
                expires_at: newExpiresAt,
                status: 'active',
                updated_at: new Date()
            })
            .returning('*');

        return this.formatSubscription(result);
    }

    static async getUserActiveSubscription(userId) {
        const result = await knex('user_subscriptions')
            .where('user_subscriptions.user_id', userId)
            .where('user_subscriptions.status', 'active')
            .join('subscription_tiers', 'user_subscriptions.tier_id', 'subscription_tiers.id')
            .join('users', 'user_subscriptions.user_id', 'users.id')
            .select([
                'user_subscriptions.*',
                'subscription_tiers.name as tier_name',
                'subscription_tiers.slug as tier_slug',
                'subscription_tiers.price as tier_price',
                'subscription_tiers.currency as tier_currency',
                'subscription_tiers.billing_cycle_months as tier_billing_cycle_months',
                'subscription_tiers.features as tier_features',
                'users.first_name as user_first_name',
                'users.last_name as user_last_name',
                'users.email as user_email',
                'users.username as user_username'
            ])
            .orderBy('user_subscriptions.expires_at', 'desc')
            .first();

        return result ? this.formatSubscriptionWithDetails(result) : null;
    }

    static async checkSubscriptionExpired(userId) {
        const expiredSubscriptions = await knex('user_subscriptions')
            .where('user_id', userId)
            .where('status', 'active')
            .where('expires_at', '<', new Date());

        if (expiredSubscriptions.length > 0) {
            // Mark expired subscriptions
            await knex('user_subscriptions')
                .whereIn('id', expiredSubscriptions.map(sub => sub.id))
                .update({
                    status: 'expired',
                    updated_at: new Date()
                });

            // Clear user's active subscription if it expired
            for (const sub of expiredSubscriptions) {
                await knex('users')
                    .where('active_subscription_id', sub.id)
                    .update({
                        active_subscription_id: null,
                        updated_at: new Date()
                    });
            }
        }

        return expiredSubscriptions.length;
    }

    static formatSubscription(subscription) {
        return {
            id: subscription.id,
            userId: subscription.user_id,
            tierId: subscription.tier_id,
            status: subscription.status,
            startedAt: subscription.started_at,
            expiresAt: subscription.expires_at,
            cancelledAt: subscription.cancelled_at,
            paymentProvider: subscription.payment_provider,
            subscriptionId: subscription.subscription_id,
            amountPaid: subscription.amount_paid ? parseFloat(subscription.amount_paid) : null,
            currency: subscription.currency,
            metadata: subscription.metadata,
            createdAt: subscription.created_at,
            updatedAt: subscription.updated_at
        };
    }

    static formatSubscriptionWithDetails(subscription) {
        const formatted = this.formatSubscription(subscription);

        return {
            ...formatted,
            // Tier details
            tier: {
                name: subscription.tier_name,
                slug: subscription.tier_slug,
                price: subscription.tier_price,
                currency: subscription.tier_currency,
                billingCycleMonths: subscription.tier_billing_cycle_months,
                features: subscription.tier_features
            },
            // User details
            user: {
                firstName: subscription.user_first_name,
                lastName: subscription.user_last_name,
                email: subscription.user_email,
                username: subscription.user_username
            }
        };
    }
}

module.exports = UserSubscription;
