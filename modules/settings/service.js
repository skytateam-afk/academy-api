const knex = require('../../config/knex');
const logger = require('../../config/winston');
const storageService = require('../../services/storageService');

class SettingsService {
    /**
     * Get settings for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User settings
     */
    async getSettings(userId) {
        try {
            let settings = await knex('user_settings')
                .where({ user_id: userId })
                .first();

            if (!settings) {
                // Create default settings if not exists
                [settings] = await knex('user_settings')
                    .insert({
                        user_id: userId,
                        ui_mode: 'explorer',
                        theme: 'green',
                        profile_public: true,
                        show_progress_publicly: true
                    })
                    .returning('*');
            }

            return settings;
        } catch (error) {
            logger.error(`Error getting settings for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Update settings for a user
     * @param {string} userId - User ID
     * @param {Object} updates - Settings to update
     * @returns {Promise<Object>} Updated settings
     */
    async updateSettings(userId, updates) {
        try {
            const { 
                ui_mode, 
                theme,
                theme_mode,
                // Email notifications
                email_course_updates,
                email_new_announcements,
                email_assignment_reminders,
                email_quiz_results,
                email_new_messages,
                email_marketing,
                // In-app notifications
                inapp_course_updates,
                inapp_new_announcements,
                inapp_assignment_reminders,
                inapp_quiz_results,
                inapp_new_messages,
                // Account preferences
                profile_public,
                show_progress_publicly,
                timezone,
                language
            } = updates;

            // Validate ui_mode if present
            if (ui_mode && !['explorer', 'sidebar'].includes(ui_mode)) {
                throw new Error('Invalid UI mode');
            }

            // Validate theme if present
            const validThemes = ['green', 'red', 'rose', 'blue', 'yellow', 'orange', 'violet'];
            if (theme && !validThemes.includes(theme)) {
                throw new Error('Invalid theme');
            }

            // Validate language if present
            if (language && !['en', 'fr', 'es', 'de', 'pt', 'ar'].includes(language)) {
                throw new Error('Invalid language');
            }

            // Check if settings exist
            const existing = await knex('user_settings')
                .where({ user_id: userId })
                .first();

            let settings;
            const updateData = {
                updated_at: new Date()
            };

            // Only include fields that are actually being updated
            if (ui_mode !== undefined) updateData.ui_mode = ui_mode;
            if (theme !== undefined) updateData.theme = theme;
            if (theme_mode !== undefined) updateData.theme_mode = theme_mode;
            if (email_course_updates !== undefined) updateData.email_course_updates = email_course_updates;
            if (email_new_announcements !== undefined) updateData.email_new_announcements = email_new_announcements;
            if (email_assignment_reminders !== undefined) updateData.email_assignment_reminders = email_assignment_reminders;
            if (email_quiz_results !== undefined) updateData.email_quiz_results = email_quiz_results;
            if (email_new_messages !== undefined) updateData.email_new_messages = email_new_messages;
            if (email_marketing !== undefined) updateData.email_marketing = email_marketing;
            if (inapp_course_updates !== undefined) updateData.inapp_course_updates = inapp_course_updates;
            if (inapp_new_announcements !== undefined) updateData.inapp_new_announcements = inapp_new_announcements;
            if (inapp_assignment_reminders !== undefined) updateData.inapp_assignment_reminders = inapp_assignment_reminders;
            if (inapp_quiz_results !== undefined) updateData.inapp_quiz_results = inapp_quiz_results;
            if (inapp_new_messages !== undefined) updateData.inapp_new_messages = inapp_new_messages;
            if (profile_public !== undefined) updateData.profile_public = profile_public;
            if (show_progress_publicly !== undefined) updateData.show_progress_publicly = show_progress_publicly;
            if (timezone !== undefined) updateData.timezone = timezone;
            if (language !== undefined) updateData.language = language;

            if (existing) {
                [settings] = await knex('user_settings')
                    .where({ user_id: userId })
                    .update(updateData)
                    .returning('*');
            } else {
                [settings] = await knex('user_settings')
                    .insert({
                        user_id: userId,
                        ui_mode: ui_mode || 'explorer',
                        theme: theme || 'green',
                        ...updateData
                    })
                    .returning('*');
            }

            return settings;
        } catch (error) {
            logger.error(`Error updating settings for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get institution settings
     * @returns {Promise<Object>} Institution settings
     */
    async getInstitutionSettings() {
        try {
            let settings = await knex('institution_settings')
                .first();

            if (!settings) {
                // Create default settings if not exists
                [settings] = await knex('institution_settings')
                    .insert({
                        organization_name: 'Learning Management System',
                        organization_description: 'Welcome to our learning platform',
                        primary_color: '#22c55e',
                        secondary_color: '#3b82f6',
                        accent_color: '#8b5cf6',
                        font_family: 'Inter',
                        allow_public_registration: true,
                        require_email_verification: true,
                        enable_course_reviews: true,
                        enable_certificates: true,
                        max_upload_size: 10485760
                    })
                    .returning('*');
            }

            return settings;
        } catch (error) {
            logger.error('Error getting institution settings:', error);
            throw error;
        }
    }

    /**
     * Update institution settings
     * @param {Object} updates - Settings to update
     * @returns {Promise<Object>} Updated settings
     */
    async updateInstitutionSettings(updates) {
        try {
            const {
                organization_name,
                organization_description,
                tagline,
                contact_email,
                contact_phone,
                support_email,
                address,
                website,
                facebook_url,
                twitter_url,
                linkedin_url,
                instagram_url,
                youtube_url,
                primary_color,
                secondary_color,
                accent_color,
                font_family,
                max_upload_size,
                allow_public_registration,
                require_email_verification,
                enable_course_reviews,
                enable_certificates,
                footer_text,
                copyright_text,
                terms_url,
                privacy_url,
                currency_code,
                currency_symbol,
                currency_position,
                // OAuth settings
                enable_google_oauth,
                google_client_id,
                google_client_secret,
                enable_facebook_oauth,
                facebook_app_id,
                facebook_app_secret,
                enable_microsoft_oauth,
                microsoft_client_id,
                microsoft_client_secret,
                enable_github_oauth,
                github_client_id,
                github_client_secret
            } = updates;

            // Check if settings exist
            const existing = await knex('institution_settings').first();

            let settings;
            const updateData = {
                updated_at: new Date()
            };

            // Only include fields that are actually being updated
            if (organization_name !== undefined) updateData.organization_name = organization_name;
            if (organization_description !== undefined) updateData.organization_description = organization_description;
            if (tagline !== undefined) updateData.tagline = tagline;
            if (contact_email !== undefined) updateData.contact_email = contact_email;
            if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
            if (support_email !== undefined) updateData.support_email = support_email;
            if (address !== undefined) updateData.address = address;
            if (website !== undefined) updateData.website = website;
            if (facebook_url !== undefined) updateData.facebook_url = facebook_url;
            if (twitter_url !== undefined) updateData.twitter_url = twitter_url;
            if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
            if (instagram_url !== undefined) updateData.instagram_url = instagram_url;
            if (youtube_url !== undefined) updateData.youtube_url = youtube_url;
            if (primary_color !== undefined) updateData.primary_color = primary_color;
            if (secondary_color !== undefined) updateData.secondary_color = secondary_color;
            if (accent_color !== undefined) updateData.accent_color = accent_color;
            if (font_family !== undefined) updateData.font_family = font_family;
            if (max_upload_size !== undefined) updateData.max_upload_size = max_upload_size;
            if (allow_public_registration !== undefined) updateData.allow_public_registration = allow_public_registration;
            if (require_email_verification !== undefined) updateData.require_email_verification = require_email_verification;
            if (enable_course_reviews !== undefined) updateData.enable_course_reviews = enable_course_reviews;
            if (enable_certificates !== undefined) updateData.enable_certificates = enable_certificates;
            if (footer_text !== undefined) updateData.footer_text = footer_text;
            if (copyright_text !== undefined) updateData.copyright_text = copyright_text;
            if (terms_url !== undefined) updateData.terms_url = terms_url;
            if (privacy_url !== undefined) updateData.privacy_url = privacy_url;
            if (currency_code !== undefined) updateData.currency_code = currency_code;
            if (currency_symbol !== undefined) updateData.currency_symbol = currency_symbol;
            if (currency_position !== undefined) updateData.currency_position = currency_position;
            
            // OAuth settings
            if (enable_google_oauth !== undefined) updateData.enable_google_oauth = enable_google_oauth;
            if (google_client_id !== undefined) updateData.google_client_id = google_client_id;
            if (google_client_secret !== undefined) updateData.google_client_secret = google_client_secret;
            if (enable_facebook_oauth !== undefined) updateData.enable_facebook_oauth = enable_facebook_oauth;
            if (facebook_app_id !== undefined) updateData.facebook_app_id = facebook_app_id;
            if (facebook_app_secret !== undefined) updateData.facebook_app_secret = facebook_app_secret;
            if (enable_microsoft_oauth !== undefined) updateData.enable_microsoft_oauth = enable_microsoft_oauth;
            if (microsoft_client_id !== undefined) updateData.microsoft_client_id = microsoft_client_id;
            if (microsoft_client_secret !== undefined) updateData.microsoft_client_secret = microsoft_client_secret;
            if (enable_github_oauth !== undefined) updateData.enable_github_oauth = enable_github_oauth;
            if (github_client_id !== undefined) updateData.github_client_id = github_client_id;
            if (github_client_secret !== undefined) updateData.github_client_secret = github_client_secret;

            if (existing) {
                [settings] = await knex('institution_settings')
                    .where({ id: existing.id })
                    .update(updateData)
                    .returning('*');
            } else {
                [settings] = await knex('institution_settings')
                    .insert(updateData)
                    .returning('*');
            }

            return settings;
        } catch (error) {
            logger.error('Error updating institution settings:', error);
            throw error;
        }
    }

    /**
     * Upload institution logo
     * @param {Object} file - File object from multer
     * @param {string} type - Logo type (logo, logo_dark, favicon, banner)
     * @returns {Promise<Object>} Updated settings with logo URL
     */
    async uploadInstitutionLogo(file, type) {
        try {
            // Validate logo type
            const validTypes = ['logo', 'logo_dark', 'favicon', 'banner'];
            if (!validTypes.includes(type)) {
                throw new Error('Invalid logo type');
            }

            // Upload to storage
            const filename = file.originalname || 'logo';
            const uploadResult = await storageService.uploadFile(
                file.buffer, 
                filename, 
                file.mimetype, 
                `institution/${type}`
            );

            // Update institution settings
            const fieldName = `${type}_url`;
            const updateData = {
                [fieldName]: uploadResult.fileUrl,
                updated_at: new Date()
            };

            // Get existing settings
            const existing = await knex('institution_settings').first();

            let settings;
            if (existing) {
                // Delete old logo from storage if it exists
                if (existing[fieldName]) {
                    try {
                        const oldPath = existing[fieldName].split('/').slice(-3).join('/');
                        await storageService.deleteFile(oldPath);
                    } catch (deleteError) {
                        logger.warn('Error deleting old logo:', deleteError);
                    }
                }

                [settings] = await knex('institution_settings')
                    .where({ id: existing.id })
                    .update(updateData)
                    .returning('*');
            } else {
                [settings] = await knex('institution_settings')
                    .insert(updateData)
                    .returning('*');
            }

            return settings;
        } catch (error) {
            logger.error('Error uploading institution logo:', error);
            throw error;
        }
    }

    /**
     * Delete institution logo
     * @param {string} type - Logo type (logo, logo_dark, favicon, banner)
     * @returns {Promise<Object>} Updated settings
     */
    async deleteInstitutionLogo(type) {
        try {
            // Validate logo type
            const validTypes = ['logo', 'logo_dark', 'favicon', 'banner'];
            if (!validTypes.includes(type)) {
                throw new Error('Invalid logo type');
            }

            const existing = await knex('institution_settings').first();
            if (!existing) {
                throw new Error('Institution settings not found');
            }

            const fieldName = `${type}_url`;
            const logoUrl = existing[fieldName];

            if (logoUrl) {
                // Delete from storage
                try {
                    const filePath = logoUrl.split('/').slice(-3).join('/');
                    await storageService.deleteFile(filePath);
                } catch (deleteError) {
                    logger.warn('Error deleting logo from storage:', deleteError);
                }
            }

            // Update settings
            const [settings] = await knex('institution_settings')
                .where({ id: existing.id })
                .update({
                    [fieldName]: null,
                    updated_at: new Date()
                })
                .returning('*');

            return settings;
        } catch (error) {
            logger.error('Error deleting institution logo:', error);
            throw error;
        }
    }

    /**
     * Get all XP activities with pagination
     * @param {number} limit - Number of items per page
     * @param {number} offset - Offset for pagination
     * @param {string} search - Search query for activity_type or description
     * @returns {Promise<Object>} XP activities with pagination
     */
    async getXPActivities(limit = 50, offset = 0, search = '') {
        try {
            // Build base query with search filter
            let baseQuery = knex('xp_activities');

            // Add search filter if provided
            if (search && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                baseQuery = baseQuery.where(function() {
                    this.where('activity_type', 'ilike', searchTerm)
                        .orWhere('description', 'ilike', searchTerm);
                });
            }

            // Get total count for pagination (without ORDER BY to avoid GROUP BY error)
            const [{ count }] = await baseQuery.clone().count('* as count');
            const total = parseInt(count);

            // Get activities with ordering and pagination
            const activities = await baseQuery.clone()
                .select('*')
                .orderBy('activity_type', 'asc')
                .limit(limit)
                .offset(offset);

            return {
                activities,
                pagination: {
                    total,
                    limit,
                    offset,
                    page: Math.floor(offset / limit) + 1,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting XP activities:', error);
            throw error;
        }
    }

    /**
     * Create new XP activity
     * @param {Object} activityData - XP activity data
     * @returns {Promise<Object>} Created XP activity
     */
    async createXPActivity(activityData) {
        try {
            const { activity_type, xp_value, description, is_active } = activityData;

            // Validate activity_type uniqueness
            const existing = await knex('xp_activities')
                .where('activity_type', activity_type)
                .first();

            if (existing) {
                throw new Error('Activity type already exists');
            }

            // Validate xp_value
            if (typeof xp_value !== 'number' || isNaN(xp_value)) {
                throw new Error('XP value must be a valid number');
            }

            const [activity] = await knex('xp_activities')
                .insert({
                    activity_type,
                    xp_value,
                    description,
                    is_active: is_active !== undefined ? is_active : true
                })
                .returning('*');

            logger.info(`Created XP activity: ${activity_type} (${xp_value} XP)`);
            return activity;
        } catch (error) {
            logger.error('Error creating XP activity:', error);
            throw error;
        }
    }

    /**
     * Update XP activity
     * @param {string} id - XP activity ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated XP activity
     */
    async updateXPActivity(id, updates) {
        try {
            const { activity_type, xp_value, description, is_active } = updates;

            // Check if activity exists
            const existing = await knex('xp_activities')
                .where('id', id)
                .first();

            if (!existing) {
                throw new Error('XP activity not found');
            }

            // Validate activity_type uniqueness (exclude current record)
            if (activity_type && activity_type !== existing.activity_type) {
                const duplicate = await knex('xp_activities')
                    .where('activity_type', activity_type)
                    .whereNot('id', id)
                    .first();

                if (duplicate) {
                    throw new Error('Activity type already exists');
                }
            }

            // Validate xp_value
            if (xp_value !== undefined && (typeof xp_value !== 'number' || isNaN(xp_value))) {
                throw new Error('XP value must be a valid number');
            }

            const updateData = {
                updated_at: new Date()
            };

            // Only include fields that are being updated
            if (activity_type !== undefined) updateData.activity_type = activity_type;
            if (xp_value !== undefined) updateData.xp_value = xp_value;
            if (description !== undefined) updateData.description = description;
            if (is_active !== undefined) updateData.is_active = is_active;

            const [activity] = await knex('xp_activities')
                .where('id', id)
                .update(updateData)
                .returning('*');

            logger.info(`Updated XP activity: ${activity.activity_type} (${activity.xp_value} XP)`);
            return activity;
        } catch (error) {
            logger.error('Error updating XP activity:', error);
            throw error;
        }
    }

    /**
     * Delete XP activity
     * @param {string} id - XP activity ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteXPActivity(id) {
        try {
            // Check if activity exists and has no associated transactions
            const existing = await knex('xp_activities')
                .where('id', id)
                .first();

            if (!existing) {
                throw new Error('XP activity not found');
            }

            // Check if this activity has been used in transactions
            const transactionCount = await knex('xp_transactions')
                .where('activity_type', existing.activity_type)
                .count('* as count')
                .first();

            if (parseInt(transactionCount.count) > 0) {
                throw new Error('Cannot delete XP activity that has been used in transactions');
            }

            await knex('xp_activities')
                .where('id', id)
                .del();

            logger.info(`Deleted XP activity: ${existing.activity_type}`);
            return true;
        } catch (error) {
            logger.error('Error deleting XP activity:', error);
            throw error;
        }
    }

    /**
     * Toggle XP activity status
     * @param {string} id - XP activity ID
     * @returns {Promise<Object>} Updated XP activity
     */
    async toggleXPActivity(id) {
        try {
            const existing = await knex('xp_activities')
                .where('id', id)
                .first();

            if (!existing) {
                throw new Error('XP activity not found');
            }

            const [activity] = await knex('xp_activities')
                .where('id', id)
                .update({
                    is_active: !existing.is_active,
                    updated_at: new Date()
                })
                .returning('*');

            logger.info(`${activity.is_active ? 'Activated' : 'Deactivated'} XP activity: ${activity.activity_type}`);
            return activity;
        } catch (error) {
            logger.error('Error toggling XP activity:', error);
            throw error;
        }
    }
}

module.exports = new SettingsService();
