/**
 * Payment Provider Controller
 * Admin endpoints for managing payment provider configurations
 */

const PaymentProviderService = require('./paymentProviderService');
const PaymentEncryption = require('../../utils/encryption');
const logger = require('../../config/winston');

class PaymentProviderController {
    /**
     * Get all payment providers (admin only)
     */
    static async getProviders(req, res) {
        try {
            const providers = await PaymentProviderService.getAllProviders();

            // Transform response to mask sensitive data for listing
            const safeProviders = providers.map(provider => ({
                id: provider.id,
                providerName: provider.provider_name,
                displayName: provider.provider_display_name,
                isActive: provider.is_active,
                supportedCurrencies: provider.supported_currencies,
                lastTestedAt: provider.last_tested_at,
                testResult: provider.test_result,
                errorMessage: provider.error_message,
                createdAt: provider.created_at,
                updatedAt: provider.updated_at,
                createdBy: provider.created_by,
                updatedBy: provider.updated_by
            }));

            res.json({
                success: true,
                data: safeProviders
            });
        } catch (error) {
            logger.error('Failed to fetch providers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch payment providers',
                error: error.message
            });
        }
    }

    /**
     * Create or update payment provider
     */
    static async upsertProvider(req, res) {
        try {
            const { providerName, displayName, secretKey, publicKey, webhookSecret, isActive, supportedCurrencies, configuration } = req.body;
            const userId = req.user?.id; // From auth middleware

            // Check if trying to activate without successful test
            if (isActive) {
                const existing = await PaymentProviderService.getAllProviders()
                    .then(providers => providers.find(p => p.provider_name === providerName))
                    .catch(() => null);

                // Require testing for new providers or untested providers
                if (!existing || !existing.test_result || existing.test_result !== 'success') {
                    return res.status(400).json({
                        success: false,
                        message: 'Provider must be tested and confirmed working before enabling. Use the "Test Connection" button in the payment providers table.',
                        errors: ['Provider must be tested and confirmed working before enabling. Use the "Test Connection" button in the payment providers table.']
                    });
                }
            }

            // Validate required fields
            const errors = PaymentProviderService.validateProviderData({
                providerName,
                displayName,
                secretKey,
                publicKey,
                webhookSecret,
                supportedCurrencies,
                configuration
            });

            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors
                });
            }

            const providerId = await PaymentProviderService.upsertProvider({
                providerName,
                displayName,
                secretKey,
                publicKey,
                webhookSecret,
                isActive,
                supportedCurrencies,
                configuration
            }, userId);

            res.json({
                success: true,
                message: 'Payment provider saved successfully',
                data: {
                    id: providerId
                }
            });
        } catch (error) {
            logger.error('Failed to save provider:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save payment provider',
                error: error.message
            });
        }
    }

    /**
     * Get single provider by ID (for editing - decrypts sensitive data)
     */
    static async getProvider(req, res) {
        try {
            const { providerId } = req.params;

            const providers = await PaymentProviderService.getAllProviders();
            const provider = providers.find(p => p.id === parseInt(providerId));

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment provider not found'
                });
            }

            // Return complete data for editing (decrypt sensitive keys)
            const editProvider = {
                id: provider.id,
                providerName: provider.provider_name,
                displayName: provider.provider_display_name,
                // Decrypt sensitive keys for editing
                secretKey: provider.secret_key_encrypted ? PaymentEncryption.decrypt(provider.secret_key_encrypted) : '',
                publicKey: provider.public_key_encrypted ? PaymentEncryption.decrypt(provider.public_key_encrypted) : '',
                webhookSecret: provider.webhook_secret_encrypted ? PaymentEncryption.decrypt(provider.webhook_secret_encrypted) : '',
                isActive: provider.is_active,
                supportedCurrencies: provider.supported_currencies,
                lastTestedAt: provider.last_tested_at,
                testResult: provider.test_result,
                errorMessage: provider.error_message,
                createdAt: provider.created_at,
                updatedAt: provider.updated_at,
                createdBy: provider.created_by,
                updatedBy: provider.updated_by
            };

            res.json({
                success: true,
                data: editProvider
            });
        } catch (error) {
            logger.error('Failed to fetch provider:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch payment provider',
                error: error.message
            });
        }
    }

    /**
     * Toggle provider active status
     */
    static async toggleProvider(req, res) {
        try {
            const { providerId } = req.params;
            const { isActive } = req.body;
            const userId = req.user?.id;

            await PaymentProviderService.toggleProvider(providerId, !!isActive, userId);

            res.json({
                success: true,
                message: `Payment provider ${isActive ? 'enabled' : 'disabled'} successfully`
            });
        } catch (error) {
            logger.error('Failed to toggle provider:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update provider status',
                error: error.message
            });
        }
    }

    /**
     * Test provider connection
     */
    static async testProvider(req, res) {
        try {
            const { providerId } = req.params;
            const userId = req.user?.id;

            const result = await PaymentProviderService.testProvider(providerId, userId);

            res.json({
                success: result.success,
                message: result.success
                    ? 'Connection test successful'
                    : result.errorMessage || 'Connection test failed',
                data: result
            });
        } catch (error) {
            logger.error('Failed to test provider:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to test payment provider connection',
                error: error.message
            });
        }
    }

    /**
     * Delete payment provider
     */
    static async deleteProvider(req, res) {
        try {
            const { providerId } = req.params;
            const userId = req.user?.id;

            await PaymentProviderService.deleteProvider(providerId, userId);

            res.json({
                success: true,
                message: 'Payment provider deleted successfully'
            });
        } catch (error) {
            logger.error('Failed to delete provider:', error);

            if (error.message.includes('pending transactions')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to delete payment provider',
                error: error.message
            });
        }
    }

    /**
     * Get active payment providers (public endpoint for frontend)
     */
    static async getActiveProviders(req, res) {
        try {
            const providers = await PaymentProviderService.getActiveProviders();

            // Return only safe data for public use
            const safeProviders = providers.map(provider => ({
                name: provider.provider_name,
                displayName: provider.provider_display_name,
                supportedCurrencies: provider.supported_currencies
            }));

            res.json({
                success: true,
                data: safeProviders
            });
        } catch (error) {
            logger.error('Failed to fetch active providers:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch payment providers',
                error: error.message
            });
        }
    }

    /**
     * Get provider for specific currency
     */
    static async getProviderForCurrency(req, res) {
        try {
            const { currency } = req.params;

            const provider = await PaymentProviderService.getProviderForCurrency(currency);

            if (!provider) {
                return res.json({
                    success: true,
                    data: null,
                    message: `No active provider found for currency ${currency}`
                });
            }

            // Return safe provider info
            res.json({
                success: true,
                data: {
                    name: provider.name,
                    displayName: provider.displayName,
                    supportedCurrencies: provider.supportedCurrencies
                }
            });
        } catch (error) {
            logger.error('Failed to get provider for currency:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch provider for currency',
                error: error.message
            });
        }
    }
}

module.exports = PaymentProviderController;
