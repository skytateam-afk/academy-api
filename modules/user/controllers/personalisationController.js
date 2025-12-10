/**
 * Personalisation Controller
 * Handles HTTP requests for user personalisations
 */

const personalisationRepository = require('../repositories/personalisationRepository');
const logger = require('../../../config/winston');

/**
 * Get user preferences
 */
exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.userId;
        const personalisation = await personalisationRepository.getByUserId(userId);

        res.json({
            success: true,
            data: personalisation ? personalisation.data : {}
        });
    } catch (error) {
        logger.error('Error in getPreferences', { error: error.message, userId: req.user.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch preferences'
        });
    }
};

/**
 * Update user preferences
 */
exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.userId;
        const updates = req.body;

        const personalisation = await personalisationRepository.update(userId, updates);

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            data: personalisation.data
        });
    } catch (error) {
        logger.error('Error in updatePreferences', { error: error.message, userId: req.user.userId });
        res.status(500).json({
            success: false,
            error: 'Failed to update preferences'
        });
    }
};
