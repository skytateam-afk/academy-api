const settingsService = require('./service');
const logger = require('../../config/winston');

class SettingsController {
    /**
     * Get user settings
     */
    async getSettings(req, res) {
        try {
            const settings = await settingsService.getSettings(req.user.userId);

            res.json({
                success: true,
                data: settings
            });
        } catch (error) {
            logger.error('Get settings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch settings'
            });
        }
    }

    /**
     * Update user settings
     */
    async updateSettings(req, res) {
        try {
            const settings = await settingsService.updateSettings(req.user.userId, req.body);

            res.json({
                success: true,
                message: 'Settings updated successfully',
                data: settings
            });
        } catch (error) {
            logger.error('Update settings error:', error);

            if (error.message === 'Invalid UI mode') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to update settings'
            });
        }
    }

    /**
     * Get institution settings
     */
    async getInstitutionSettings(req, res) {
        try {
            const settings = await settingsService.getInstitutionSettings();

            // Filter out sensitive/private settings for public access
            let publicSettings = settings;

            // If request is not authenticated (public access), filter to public-only settings
            if (!req.user) {
                publicSettings = {
                    organization_name: settings.organization_name,
                    organization_description: settings.organization_description,
                    tagline: settings.tagline,
                    contact_email: settings.contact_email,
                    contact_phone: settings.contact_phone,
                    support_email: settings.support_email,
                    address: settings.address,
                    website: settings.website,
                    facebook_url: settings.facebook_url,
                    twitter_url: settings.twitter_url,
                    linkedin_url: settings.linkedin_url,
                    instagram_url: settings.instagram_url,
                    youtube_url: settings.youtube_url,
                    logo_url: settings.logo_url,
                    logo_dark_url: settings.logo_dark_url,
                    favicon_url: settings.favicon_url,
                    banner_url: settings.banner_url,
                    primary_color: settings.primary_color,
                    secondary_color: settings.secondary_color,
                    accent_color: settings.accent_color,
                    font_family: settings.font_family,
                    allow_public_registration: settings.allow_public_registration,
                    enable_course_reviews: settings.enable_course_reviews,
                    enable_certificates: settings.enable_certificates,
                    footer_text: settings.footer_text,
                    copyright_text: settings.copyright_text,
                    terms_url: settings.terms_url,
                    privacy_url: settings.privacy_url,
                    currency_code: settings.currency_code,
                    currency_symbol: settings.currency_symbol,
                    currency_position: settings.currency_position
                };
            }

            res.json({
                success: true,
                data: publicSettings
            });
        } catch (error) {
            logger.error('Get institution settings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch institution settings'
            });
        }
    }

    /**
     * Update institution settings (Admin only)
     */
    async updateInstitutionSettings(req, res) {
        try {
            const settings = await settingsService.updateInstitutionSettings(req.body);

            res.json({
                success: true,
                message: 'Institution settings updated successfully',
                data: settings
            });
        } catch (error) {
            logger.error('Update institution settings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update institution settings'
            });
        }
    }

    /**
     * Upload institution logo (Admin only)
     */
    async uploadInstitutionLogo(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const { type } = req.body;
            if (!type) {
                return res.status(400).json({
                    success: false,
                    error: 'Logo type is required'
                });
            }

            const settings = await settingsService.uploadInstitutionLogo(req.file, type);

            res.json({
                success: true,
                message: 'Logo uploaded successfully',
                data: settings
            });
        } catch (error) {
            logger.error('Upload institution logo error:', error);
            
            if (error.message === 'Invalid logo type') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to upload logo'
            });
        }
    }

    /**
     * Delete institution logo (Admin only)
     */
    async deleteInstitutionLogo(req, res) {
        try {
            const { type } = req.params;

            const settings = await settingsService.deleteInstitutionLogo(type);

            res.json({
                success: true,
                message: 'Logo deleted successfully',
                data: settings
            });
        } catch (error) {
            logger.error('Delete institution logo error:', error);

            if (error.message === 'Invalid logo type' || error.message === 'Institution settings not found') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to delete logo'
            });
        }
    }

    /**
     * Get XP activities (Admin only)
     */
    async getXPActivities(req, res) {
        try {
            const { limit, offset, search } = req.query;

            const result = await settingsService.getXPActivities(
                parseInt(limit) || 50,
                parseInt(offset) || 0,
                search || ''
            );

            res.json({
                success: true,
                data: result.activities,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Get XP activities error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch XP activities'
            });
        }
    }

    /**
     * Create XP activity (Admin only)
     */
    async createXPActivity(req, res) {
        try {
            const activity = await settingsService.createXPActivity(req.body);

            res.status(201).json({
                success: true,
                message: 'XP activity created successfully',
                data: activity
            });
        } catch (error) {
            logger.error('Create XP activity error:', error);

            if (error.message === 'Activity type already exists' || error.message === 'XP value must be a valid number') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to create XP activity'
            });
        }
    }

    /**
     * Update XP activity (Admin only)
     */
    async updateXPActivity(req, res) {
        try {
            const { id } = req.params;
            const activity = await settingsService.updateXPActivity(id, req.body);

            res.json({
                success: true,
                message: 'XP activity updated successfully',
                data: activity
            });
        } catch (error) {
            logger.error('Update XP activity error:', error);

            if (error.message === 'XP activity not found' ||
                error.message === 'Activity type already exists' ||
                error.message === 'XP value must be a valid number') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to update XP activity'
            });
        }
    }

    /**
     * Delete XP activity (Admin only)
     */
    async deleteXPActivity(req, res) {
        try {
            const { id } = req.params;
            await settingsService.deleteXPActivity(id);

            res.json({
                success: true,
                message: 'XP activity deleted successfully'
            });
        } catch (error) {
            logger.error('Delete XP activity error:', error);

            if (error.message === 'XP activity not found' ||
                error.message === 'Cannot delete XP activity that has been used in transactions') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to delete XP activity'
            });
        }
    }

    /**
     * Toggle XP activity status (Admin only)
     */
    async toggleXPActivity(req, res) {
        try {
            const { id } = req.params;
            const activity = await settingsService.toggleXPActivity(id);

            res.json({
                success: true,
                message: `XP activity ${activity.is_active ? 'activated' : 'deactivated'} successfully`,
                data: activity
            });
        } catch (error) {
            logger.error('Toggle XP activity error:', error);

            if (error.message === 'XP activity not found') {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to toggle XP activity'
            });
        }
    }
}

module.exports = new SettingsController();
