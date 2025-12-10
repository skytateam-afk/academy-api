/**
 * XP Controller
 * Handles XP-related API endpoints
 */

const XPService = require('../services/xpService');
const logger = require('../../../config/winston');

/**
 * Get current user's XP profile
 */
exports.getXPProfile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const xpStats = await XPService.getUserXPStats(userId);

        res.json({
            success: true,
            data: xpStats
        });
    } catch (error) {
        logger.error('Error getting XP profile:', error);
        next(error);
    }
};

/**
 * Get XP transaction history
 */
exports.getXPHistory = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { limit = 50, offset = 0 } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const history = await XPService.getXPHistory(
            userId,
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        logger.error('Error getting XP history:', error);
        next(error);
    }
};

/**
 * Get XP leaderboard with pagination
 */
exports.getLeaderboard = async (req, res, next) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        const leaderboard = await XPService.getLeaderboard(
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            data: leaderboard,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        logger.error('Error getting leaderboard:', error);
        next(error);
    }
};

/**
 * Get all XP levels/badges
 */
exports.getLevels = async (req, res, next) => {
    try {
        const levels = await XPService.getAllLevels();

        res.json({
            success: true,
            data: levels
        });
    } catch (error) {
        logger.error('Error getting XP levels:', error);
        next(error);
    }
};

/**
 * Get user's level information
 */
exports.getUserLevel = async (req, res, next) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const levelInfo = await XPService.getUserLevel(userId);

        res.json({
            success: true,
            data: levelInfo
        });
    } catch (error) {
        logger.error('Error getting user level:', error);
        next(error);
    }
};

/**
 * Create new XP level (admin only)
 */
exports.createLevel = async (req, res, next) => {
    try {
        const levelData = req.body;
        const newLevel = await XPService.createLevel(levelData);

        res.status(201).json({
            success: true,
            data: newLevel,
            message: 'XP level created successfully'
        });
    } catch (error) {
        logger.error('Error creating XP level:', error);
        next(error);
    }
};

/**
 * Update XP level (admin only)
 */
exports.updateLevel = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const updatedLevel = await XPService.updateLevel(id, updates);

        res.json({
            success: true,
            data: updatedLevel,
            message: 'XP level updated successfully'
        });
    } catch (error) {
        logger.error('Error updating XP level:', error);
        next(error);
    }
};

/**
 * Delete XP level (admin only)
 */
exports.deleteLevel = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        await XPService.deleteLevel(id);

        res.json({
            success: true,
            message: 'XP level deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting XP level:', error);
        next(error);
    }
};

/**
 * Toggle XP level active status (admin only)
 */
exports.toggleLevel = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const updatedLevel = await XPService.toggleLevel(id);

        res.json({
            success: true,
            data: updatedLevel,
            message: 'XP level status updated successfully'
        });
    } catch (error) {
        logger.error('Error toggling XP level:', error);
        next(error);
    }
};

/**
 * Upload badge image for XP level (admin only)
 */
exports.uploadBadgeImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const storageService = require('../../../services/storageService');
        
        // Upload to storage
        const uploadResult = await storageService.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'xp/badges'
        );

        res.json({
            success: true,
            data: {
                badge_image_url: uploadResult.fileUrl
            },
            message: 'Badge image uploaded successfully'
        });
    } catch (error) {
        logger.error('Error uploading badge image:', error);
        next(error);
    }
};

module.exports = exports;
