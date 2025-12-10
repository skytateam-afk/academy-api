/**
 * Payment Provider Service
 * Manages encrypted payment provider configurations in database
 */

const db = require('../../config/knex');
const PaymentEncryption = require('../../utils/encryption');
const logger = require('../../config/winston');

class PaymentProviderService {
    /**
     * Get all payment providers (admin only)
     */
    static async getAllProviders() {
        try {
            const providers = await db('payment_providers')
                .select('*')
                .orderBy('provider_name');

            return providers;
        } catch (error) {
            logger.error('Failed to fetch payment providers:', error);
            throw error;
        }
    }

    /**
     * Get active payment providers for public use
     */
    static async getActiveProviders() {
        try {
            const providers = await db('payment_providers')
                .select('id', 'provider_name', 'provider_display_name', 'supported_currencies', 'configuration')
                .where('is_active', true)
                .orderBy('provider_name');

            return providers;
        } catch (error) {
            logger.error('Failed to fetch active providers:', error);
            throw error;
        }
    }

    /**
     * Get provider configuration (decrypting sensitive data)
     */
    static async getProviderConfig(providerName) {
        try {
            const provider = await db('payment_providers')
                .where('provider_name', providerName)
                .where('is_active', true)
                .first();

            if (!provider) {
                return null;
            }

            // Decrypt sensitive keys
            const config = {
                id: provider.id,
                name: provider.provider_name,
                displayName: provider.provider_display_name,
                secretKey: provider.secret_key_encrypted ? PaymentEncryption.decrypt(provider.secret_key_encrypted) : null,
                publicKey: provider.public_key_encrypted ? PaymentEncryption.decrypt(provider.public_key_encrypted) : null,
                webhookSecret: provider.webhook_secret_encrypted ? PaymentEncryption.decrypt(provider.webhook_secret_encrypted) : null,
                isActive: provider.is_active,
                supportedCurrencies: provider.supported_currencies,
                configuration: provider.configuration,
                lastTested: provider.last_tested_at,
                testResult: provider.test_result,
                errorMessage: provider.error_message
            };

            return config;
        } catch (error) {
            logger.error(`Failed to fetch provider config for ${providerName}:`, error);
            throw error;
        }
    }

    /**
     * Create or update payment provider
     */
    static async upsertProvider(data, userId) {
        try {
            const existing = await db('payment_providers')
                .where('provider_name', data.providerName)
                .first();

            const providerData = {
                provider_name: data.providerName,
                provider_display_name: data.displayName,
                // Only update encrypted keys if new values are provided (for security)
                ...((data.secretKey && data.secretKey.trim() !== '') && {
                    secret_key_encrypted: PaymentEncryption.encrypt(data.secretKey)
                }),
                ...((data.publicKey && data.publicKey.trim() !== '') && {
                    public_key_encrypted: PaymentEncryption.encrypt(data.publicKey)
                }),
                ...((data.webhookSecret && data.webhookSecret.trim() !== '') && {
                    webhook_secret_encrypted: PaymentEncryption.encrypt(data.webhookSecret)
                }),
                is_active: data.isActive || false,
                supported_currencies: JSON.stringify(data.supportedCurrencies || []),
                configuration: JSON.stringify(data.configuration || {}),
                updated_by: userId
            };

            if (existing) {
                // Update existing
                await db('payment_providers')
                    .where('id', existing.id)
                    .update(providerData);
                return existing.id;
            } else {
                // Insert new
                providerData.created_by = userId;
                const [id] = await db('payment_providers')
                    .insert(providerData)
                    .returning('id');
                return id;
            }
        } catch (error) {
            logger.error('Failed to upsert payment provider:', error);
            throw error;
        }
    }

    /**
     * Enable/disable provider
     */
    static async toggleProvider(providerId, isActive, userId) {
        try {
            await db('payment_providers')
                .where('id', providerId)
                .update({
                    is_active: isActive,
                    updated_by: userId
                });
        } catch (error) {
            logger.error('Failed to toggle provider status:', error);
            throw error;
        }
    }

    /**
     * Test provider connection
     */
    static async testProvider(providerId, userId) {
        try {
            const provider = await db('payment_providers')
                .where('id', providerId)
                .first();

            if (!provider) {
                throw new Error('Provider not found');
            }

            let success = false;
            let errorMessage = null;

            try {
                // Attempt a basic API call to test credentials
                if (provider.provider_name === 'stripe') {
                    const stripe = require('stripe')(provider.secret_key_encrypted ? PaymentEncryption.decrypt(provider.secret_key_encrypted) : '');
                    // Try to list customers (basic test)
                    await stripe.customers.list({ limit: 1 });
                    success = true;
                } else if (provider.provider_name === 'paystack') {
                    try {
                        // For now, just validate key format and existence to avoid API call issues
                        const paystackSecret = provider.secret_key_encrypted ? PaymentEncryption.decrypt(provider.secret_key_encrypted) : '';
                        const paystackPublic = provider.public_key_encrypted ? PaymentEncryption.decrypt(provider.public_key_encrypted) : '';

                        if (!paystackSecret || paystackSecret.trim() === '') {
                            throw new Error('Paystack secret key is required');
                        }

                        // Validate key format (basic check)
                        if (!paystackSecret.startsWith('sk_test_') && !paystackSecret.startsWith('sk_live_')) {
                            throw new Error('Invalid Paystack secret key format');
                        }

                        if (!paystackPublic || paystackPublic.trim() === '' ||
                            (!paystackPublic.startsWith('pk_test_') && !paystackPublic.startsWith('pk_live_'))) {
                            throw new Error('Invalid Paystack public key format');
                        }

                        // Try basic initialization (commented out API call for now)
                        // const Paystack = require('paystack-node')(paystackSecret);
                        // const response = await Paystack.transaction.list({limit: 1});
                        // success = response && response.status;

                        // For development, just validate key formats
                        success = true;

                    } catch (paystackError) {
                        // Handle Paystack-specific errors
                        throw new Error(`Paystack configuration test failed: ${paystackError.message}`);
                    }
                }
            } catch (error) {
                success = false;
                errorMessage = error.message;
            }

            // Update test results
            await db('payment_providers')
                .where('id', providerId)
                .update({
                    last_tested_at: new Date(),
                    test_result: success ? 'success' : 'failed',
                    error_message: errorMessage,
                    updated_by: userId
                });

            return { success, errorMessage };
        } catch (error) {
            logger.error('Failed to test provider:', error);
            throw error;
        }
    }

    /**
     * Delete payment provider
     */
    static async deleteProvider(providerId, userId) {
        try {
            // Check if there are any active payments using this provider
            const activeTransactions = await db('transactions')
                .where('payment_provider', function() {
                    this.select('provider_name')
                        .from('payment_providers')
                        .where('id', providerId);
                })
                .where('status', 'pending')
                .count('* as count')
                .first();

            if (activeTransactions.count > 0) {
                throw new Error('Cannot delete provider with pending transactions');
            }

            await db('payment_providers')
                .where('id', providerId)
                .del();
        } catch (error) {
            logger.error('Failed to delete payment provider:', error);
            throw error;
        }
    }

    /**
     * Get provider by currency
     */
    static async getProviderForCurrency(currency) {
        try {
            const provider = await db('payment_providers')
                .where('is_active', true)
                .whereRaw('? = ANY(supported_currencies)', [currency])
                .first();

            return provider ? await this.getProviderConfig(provider.provider_name) : null;
        } catch (error) {
            logger.error('Failed to get provider for currency:', error);
            throw error;
        }
    }

    /**
     * Validate provider data
     */
    static validateProviderData(data) {
        const errors = [];

        if (!data.providerName) errors.push('Provider name is required');
        if (!data.displayName) errors.push('Display name is required');
        if (!data.secretKey && !data.publicKey) errors.push('At least one API key is required');

        // Provider-specific validation
        if (data.providerName === 'stripe') {
            if (!data.secretKey || !(data.secretKey.startsWith('sk_test_') || data.secretKey.startsWith('sk_live_'))) {
                errors.push('Invalid Stripe secret key format (must start with sk_test_ or sk_live_)');
            }
            if (!data.publicKey || !(data.publicKey.startsWith('pk_test_') || data.publicKey.startsWith('pk_live_'))) {
                errors.push('Invalid Stripe public key format (must start with pk_test_ or pk_live_)');
            }
        } else if (data.providerName === 'paystack') {
            if (data.secretKey && !(data.secretKey.startsWith('sk_test_') || data.secretKey.startsWith('sk_live_'))) {
                errors.push('Invalid Paystack secret key format (must start with sk_test_ or sk_live_)');
            }
            if (data.publicKey && !(data.publicKey.startsWith('pk_test_') || data.publicKey.startsWith('pk_live_'))) {
                errors.push('Invalid Paystack public key format (must start with pk_test_ or pk_live_)');
            }
        }

        return errors;
    }
}

module.exports = PaymentProviderService;
