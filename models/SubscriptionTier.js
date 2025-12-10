/**
 * SubscriptionTier Model
 * Handles database operations for subscription tiers
 */

const knex = require('../config/knex');

class SubscriptionTier {
    static async create(data) {
        const tier = {
            slug: data.slug,
            name: data.name,
            description: data.description,
            short_description: data.shortDescription,
            price: data.price,
            currency: data.currency || 'USD',
            billing_cycle_months: data.billingCycleMonths || 1,
            billing_cycle_days: data.billingCycleDays || 30,
            features: Array.isArray(data.features) ? JSON.stringify(data.features) : data.features,
            is_popular: data.isPopular || false,
            max_users: data.maxUsers || -1,
            is_active: data.isActive !== undefined ? data.isActive : true,
            sort_order: data.sortOrder || 0,
            stripe_price_id: data.stripePriceId,
            updated_at: new Date()
        };

        const [result] = await knex('subscription_tiers').insert(tier).returning('*');
        return this.formatTier(result);
    }

    static async update(id, updates) {
        const updateData = {
            updated_at: new Date()
        };

        if (updates.slug) updateData.slug = updates.slug;
        if (updates.name) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.shortDescription !== undefined) updateData.short_description = updates.shortDescription;
        if (updates.price) updateData.price = updates.price;
        if (updates.currency) updateData.currency = updates.currency;
        if (updates.billingCycleMonths !== undefined) updateData.billing_cycle_months = updates.billingCycleMonths;
        if (updates.billingCycleDays !== undefined) updateData.billing_cycle_days = updates.billingCycleDays;
        if (updates.features !== undefined) updateData.features = Array.isArray(updates.features) ? JSON.stringify(updates.features) : updates.features;
        if (updates.isPopular !== undefined) updateData.is_popular = updates.isPopular;
        if (updates.maxUsers !== undefined) updateData.max_users = updates.maxUsers;
        if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
        if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
        if (updates.stripePriceId !== undefined) updateData.stripe_price_id = updates.stripePriceId;

        const [result] = await knex('subscription_tiers')
            .where({ id })
            .update(updateData)
            .returning('*');

        if (!result) {
            throw new Error('Subscription tier not found');
        }

        return this.formatTier(result);
    }

    static async delete(id) {
        // Check if tier is being used by any active subscriptions
        const activeSubscriptions = await knex('user_subscriptions')
            .where('tier_id', id)
            .where('status', 'active')
            .count('id as count')
            .first();

        if (parseInt(activeSubscriptions.count) > 0) {
            throw new Error('Cannot delete tier that has active subscriptions');
        }

        const result = await knex('subscription_tiers').where({ id }).del();
        return result > 0;
    }

    static async getById(id) {
        const result = await knex('subscription_tiers').where({ id }).first();
        return result ? this.formatTier(result) : null;
    }

    static async getBySlug(slug) {
        const result = await knex('subscription_tiers').where({ slug }).first();
        return result ? this.formatTier(result) : null;
    }

    static async getAll(options = {}) {
        const {
            page = 1,
            limit = 50,
            isActive = true,
            sortBy = 'sort_order',
            sortOrder = 'asc'
        } = options;

        // Get total count first (simpler query)
        let countQuery = knex('subscription_tiers');
        if (isActive !== null) {
            countQuery = countQuery.where('is_active', isActive);
        }
        const total = await countQuery.count('id as count').first();

        // Then get the actual data with ordering
        let dataQuery = knex('subscription_tiers')
            .select('*')
            .orderBy(sortBy, sortOrder);

        if (isActive !== null) {
            dataQuery = dataQuery.where('is_active', isActive);
        }

        const tiers = await dataQuery
            .offset((page - 1) * limit)
            .limit(limit);

        const formattedTiers = tiers.map(tier => this.formatTier(tier));

        return {
            tiers: formattedTiers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total.count),
                totalPages: Math.ceil(total.count / limit)
            }
        };
    }

    static async toggleActive(id) {
        const [result] = await knex('subscription_tiers')
            .where({ id })
            .update({
                is_active: knex.raw('NOT is_active'),
                updated_at: new Date()
            })
            .returning('*');

        if (!result) {
            throw new Error('Subscription tier not found');
        }

        return this.formatTier(result);
    }

    static async reorder(sortOrder) {
        const updates = Object.entries(sortOrder).map(([id, order]) => ({
            id,
            sort_order: order,
            updated_at: new Date()
        }));

        await knex.transaction(async (trx) => {
            for (const update of updates) {
                await trx('subscription_tiers')
                    .where('id', update.id)
                    .update({
                        sort_order: update.sort_order,
                        updated_at: update.updated_at
                    });
            }
        });

        return true;
    }

    static async getSubscriptionCount(tierId) {
        const result = await knex('user_subscriptions')
            .where('tier_id', tierId)
            .where('status', 'active')
            .count('id as count')
            .first();

        return parseInt(result.count);
    }

    static formatTier(tier) {
        return {
            id: tier.id,
            slug: tier.slug,
            name: tier.name,
            description: tier.description,
            shortDescription: tier.short_description,
            price: parseFloat(tier.price),
            currency: tier.currency,
            billingCycleMonths: tier.billing_cycle_months,
            billingCycleDays: tier.billing_cycle_days,
            features: tier.features ? (typeof tier.features === 'string' ? JSON.parse(tier.features) : tier.features) : [],
            isPopular: tier.is_popular,
            maxUsers: tier.max_users,
            isActive: tier.is_active,
            sortOrder: tier.sort_order,
            stripePriceId: tier.stripe_price_id,
            createdAt: tier.created_at,
            updatedAt: tier.updated_at
        };
    }
}

module.exports = SubscriptionTier;
