/**
 * XP Service
 * Business logic for awarding and managing XP
 */

const UserXP = require('../models/UserXP');
const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class XPService {
    /**
     * Award XP for video completion
     */
    static async awardModuleCompletionXP(userId, moduleId, contentType) {
        try {
            // Guard: unsupported types
            const allowedTypes = ['video', 'text', 'audio','text_file'];
            if (!allowedTypes.includes(contentType)) {
                logger.warn(`XP not supported for content type: ${contentType}`);
                return null;
            }

            // Prevent duplicate XP
            const alreadyAwarded = await UserXP.hasEarnedXPFor(
                userId,
                contentType,
                moduleId
            );

            if (alreadyAwarded) {
                logger.info(`XP already awarded for ${contentType} module ${moduleId}`);
                return null;
            }

            // Fetch XP configuration
            const activity = await knex('xp_activities')
                .where({
                    activity_type: contentType,
                    is_active: true
                })
                .first();

            if (!activity) {
                logger.warn(`${contentType} completion XP activity not found or inactive`);
                return null;
            }

            // Award XP
            return await UserXP.addXP(
                userId,
                activity.xp_value,
                contentType,
                moduleId,
                'module',
                `Completed ${contentType} module`,
                { module_id: moduleId }
            );

        } catch (error) {
            logger.error(`Error awarding ${contentType} completion XP:`, error);
            throw error;
        }
    }

    /**
     * Award XP for passing a quiz
     */
    static async awardQuizPassXP(userId, moduleId, score) {
        try {
            // Check if XP already awarded for passing this quiz
            const alreadyAwarded = await UserXP.hasEarnedXPFor(userId, 'quiz_pass', moduleId);
            if (alreadyAwarded) {
                logger.info(`XP already awarded for quiz module ${moduleId} to user ${userId}`);
                return null;
            }

            // Get XP value for quiz pass
            const activity = await knex('xp_activities')
                .where({ activity_type: 'quiz_pass', is_active: true })
                .first();

            if (!activity) {
                logger.warn('Quiz pass XP activity not found or inactive');
                return null;
            }

            // Award XP
            const result = await UserXP.addXP(
                userId,
                activity.xp_value,
                'quiz_pass',
                moduleId,
                'module',
                `Passed quiz with ${score}% score`,
                { module_id: moduleId, score }
            );

            return result;
        } catch (error) {
            logger.error('Error awarding quiz pass XP:', error);
            throw error;
        }
    }

    /**
     * Deduct XP for failing a quiz
     */
    static async deductQuizFailXP(userId, moduleId, score, wrongAnswersCount) {
        try {
            // Get XP value for quiz fail (should be negative)
            const activity = await knex('xp_activities')
                .where({ activity_type: 'quiz_fail', is_active: true })
                .first();

            if (!activity) {
                logger.warn('Quiz fail XP activity not found or inactive');
                return null;
            }

            // Deduct XP (activity.xp_value should already be negative, e.g., -5)
            // Multiply by number of wrong answers for proportional deduction
            const deduction = activity.xp_value * wrongAnswersCount;

            const result = await UserXP.addXP(
                userId,
                deduction,
                'quiz_fail',
                moduleId,
                'module',
                `Failed quiz with ${score}% score (${wrongAnswersCount} wrong answers)`,
                { module_id: moduleId, score, wrong_answers_count: wrongAnswersCount }
            );

            return result;
        } catch (error) {
            logger.error('Error deducting quiz fail XP:', error);
            throw error;
        }
    }

    /**
     * Award XP for lesson completion
     */
    static async awardLessonCompletionXP(userId, lessonId) {
        try {
            // Check if XP already awarded for this lesson
            const alreadyAwarded = await UserXP.hasEarnedXPFor(userId, 'lesson_complete', lessonId);
            if (alreadyAwarded) {
                logger.info(`XP already awarded for lesson ${lessonId} to user ${userId}`);
                return null;
            }

            // Get XP value for lesson completion
            const activity = await knex('xp_activities')
                .where({ activity_type: 'lesson_complete', is_active: true })
                .first();

            if (!activity) {
                logger.warn('Lesson completion XP activity not found or inactive');
                return null;
            }

            // Get lesson details for better description
            const lesson = await knex('lessons')
                .where('id', lessonId)
                .select('title')
                .first();

            // Award XP
            const result = await UserXP.addXP(
                userId,
                activity.xp_value,
                'lesson_complete',
                lessonId,
                'lesson',
                `Completed entire lesson: ${lesson?.title || 'Unknown Lesson'}`,
                { lesson_id: lessonId }
            );

            return result;
        } catch (error) {
            logger.error('Error awarding lesson completion XP:', error);
            throw error;
        }
    }

    /**
     * Award XP for course completion
     */
    static async awardCourseCompletionXP(userId, courseId) {
        try {
            // Check if XP already awarded for this course
            const alreadyAwarded = await UserXP.hasEarnedXPFor(userId, 'course_complete', courseId);
            if (alreadyAwarded) {
                logger.info(`XP already awarded for course ${courseId} to user ${userId}`);
                return null;
            }

            // Get XP value for course completion
            const activity = await knex('xp_activities')
                .where({ activity_type: 'course_complete', is_active: true })
                .first();

            if (!activity) {
                logger.warn('Course completion XP activity not found or inactive');
                return null;
            }

            // Get course details for better description
            const course = await knex('courses')
                .where('id', courseId)
                .select('title')
                .first();

            // Award XP
            const result = await UserXP.addXP(
                userId,
                activity.xp_value,
                'course_complete',
                courseId,
                'course',
                `Completed entire course: ${course?.title || 'Unknown Course'}`,
                { course_id: courseId }
            );

            return result;
        } catch (error) {
            logger.error('Error awarding course completion XP:', error);
            throw error;
        }
    }

    /**
     * Get user's XP statistics
     */
    static async getUserXPStats(userId) {
        try {
            const xpData = await UserXP.getUserXP(userId);

            // Get recent transactions
            const recentTransactions = await knex('xp_transactions')
                .where('user_id', userId)
                .orderBy('created_at', 'desc')
                .limit(5);

            // Get XP breakdown by activity type
            const breakdown = await knex('xp_transactions')
                .where('user_id', userId)
                .select('activity_type')
                .sum('amount as total_xp')
                .count('* as count')
                .groupBy('activity_type');

            // Get all XP levels for level calculation
            const levels = await knex('xp_levels')
                .where('is_active', true)
                .orderBy('min_xp', 'asc');

            // Calculate user's level from database
            const userLevel = this._calculateUserLevel(xpData.total_xp, levels);
            const nextLevel = this._getNextLevel(xpData.total_xp, levels);
            const progressToNextLevel = this._calculateLevelProgress(xpData.total_xp, levels);

            return {
                ...xpData,
                recent_transactions: recentTransactions,
                breakdown,
                // Add level information from database
                level: userLevel ? userLevel.level_number : 1,
                level_name: userLevel ? userLevel.name : 'Beginner',
                level_badge_icon: userLevel ? userLevel.badge_icon : '🌱',
                level_badge_image_url: userLevel ? userLevel.badge_image_url : null,
                level_badge_color: userLevel ? userLevel.badge_color : '#10B981',
                level_description: userLevel ? userLevel.description : null,
                next_level: nextLevel,
                progress_to_next_level: progressToNextLevel
            };
        } catch (error) {
            logger.error('Error getting user XP stats:', error);
            throw error;
        }
    }

    /**
     * Get XP transaction history
     */
    static async getXPHistory(userId, limit = 50, offset = 0) {
        return UserXP.getTransactionHistory(userId, limit, offset);
    }

    /**
     * Get leaderboard with pagination and levels
     */
    static async getLeaderboard(limit = 10, offset = 0) {
        try {
            const leaderboard = await UserXP.getLeaderboard(limit, offset);

            // Get all XP levels for level calculation
            const levels = await knex('xp_levels')
                .where('is_active', true)
                .orderBy('min_xp', 'asc');

            // Add level information to each user
            const leaderboardWithLevels = leaderboard.map(user => {
                const userLevel = this._calculateUserLevel(user.total_xp, levels);
                return {
                    ...user,
                    level: userLevel ? userLevel.level_number : 1,
                    level_name: userLevel ? userLevel.name : 'Beginner',
                    level_badge_icon: userLevel ? userLevel.badge_icon : '🌱',
                    level_badge_image_url: userLevel ? userLevel.badge_image_url : null,
                    level_badge_color: userLevel ? userLevel.badge_color : '#10B981',
                    level_description: userLevel ? userLevel.description : null
                };
            });

            return leaderboardWithLevels;
        } catch (error) {
            logger.error('Error getting leaderboard with levels:', error);
            throw error;
        }
    }

    /**
     * Get all XP levels (for configuration)
     */
    static async getAllLevels() {
        try {
            return await knex('xp_levels')
                .where('is_active', true)
                .orderBy('level_number', 'asc');
        } catch (error) {
            logger.error('Error getting XP levels:', error);
            throw error;
        }
    }

    /**
     * Get user's current level based on XP
     */
    static async getUserLevel(userId) {
        try {
            const xpData = await UserXP.getUserXP(userId);
            const levels = await knex('xp_levels')
                .where('is_active', true)
                .orderBy('min_xp', 'asc');

            const userLevel = this._calculateUserLevel(xpData.total_xp, levels);

            return {
                ...xpData,
                level: userLevel ? userLevel.level_number : 1,
                level_name: userLevel ? userLevel.name : 'Beginner',
                level_badge_icon: userLevel ? userLevel.badge_icon : '🌱',
                level_badge_color: userLevel ? userLevel.badge_color : '#10B981',
                level_description: userLevel ? userLevel.description : null,
                next_level: this._getNextLevel(xpData.total_xp, levels),
                progress_to_next_level: this._calculateLevelProgress(xpData.total_xp, levels)
            };
        } catch (error) {
            logger.error('Error getting user level:', error);
            throw error;
        }
    }

    /**
     * Calculate user's level from XP amount (private helper)
     */
    static _calculateUserLevel(xp, levels) {
        if (!levels || levels.length === 0) return null;

        // Find the appropriate level based on XP
        for (let i = levels.length - 1; i >= 0; i--) {
            const level = levels[i];
            if (xp >= level.min_xp && (level.max_xp === null || xp <= level.max_xp)) {
                return level;
            }
        }

        // Default to first level if no match
        return levels[0];
    }

    /**
     * Get next level information (private helper)
     */
    static _getNextLevel(xp, levels) {
        const currentLevel = this._calculateUserLevel(xp, levels);
        if (!currentLevel) return null;

        // Find next level
        const nextLevel = levels.find(l => l.level_number === currentLevel.level_number + 1);
        return nextLevel ? {
            level_number: nextLevel.level_number,
            name: nextLevel.name,
            min_xp: nextLevel.min_xp,
            badge_icon: nextLevel.badge_icon
        } : null;
    }

    /**
     * Calculate progress to next level (private helper)
     */
    static _calculateLevelProgress(xp, levels) {
        const currentLevel = this._calculateUserLevel(xp, levels);
        if (!currentLevel || !currentLevel.max_xp) return 100; // Max level

        const xpInCurrentLevel = xp - currentLevel.min_xp;
        const xpNeededForLevel = currentLevel.max_xp - currentLevel.min_xp + 1;
        const progress = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));

        return progress;
    }

    /**
     * Create new XP level (admin only)
     */
    static async createLevel(levelData) {
        try {
            const [newLevel] = await knex('xp_levels')
                .insert({
                    name: levelData.name,
                    description: levelData.description || null,
                    badge_icon: levelData.badge_icon || '🌱',
                    badge_image_url: levelData.badge_image_url || null,
                    badge_color: levelData.badge_color || '#3B82F6',
                    min_xp: levelData.min_xp,
                    max_xp: levelData.max_xp || null,
                    level_number: levelData.level_number,
                    display_order: levelData.display_order || levelData.level_number,
                    is_active: levelData.is_active !== undefined ? levelData.is_active : true,
                    metadata: levelData.metadata || null
                })
                .returning('*');

            return newLevel;
        } catch (error) {
            logger.error('Error creating XP level:', error);
            throw error;
        }
    }

    /**
     * Update XP level (admin only)
     */
    static async updateLevel(id, updates) {
        try {
            const [updatedLevel] = await knex('xp_levels')
                .where('id', id)
                .update({
                    ...updates,
                    updated_at: knex.fn.now()
                })
                .returning('*');

            if (!updatedLevel) {
                throw new Error('XP level not found');
            }

            return updatedLevel;
        } catch (error) {
            logger.error('Error updating XP level:', error);
            throw error;
        }
    }

    /**
     * Delete XP level (admin only)
     */
    static async deleteLevel(id) {
        try {
            const deleted = await knex('xp_levels')
                .where('id', id)
                .delete();

            if (!deleted) {
                throw new Error('XP level not found');
            }

            return true;
        } catch (error) {
            logger.error('Error deleting XP level:', error);
            throw error;
        }
    }

    /**
     * Toggle XP level active status (admin only)
     */
    static async toggleLevel(id) {
        try {
            const level = await knex('xp_levels')
                .where('id', id)
                .first();

            if (!level) {
                throw new Error('XP level not found');
            }

            const [updatedLevel] = await knex('xp_levels')
                .where('id', id)
                .update({
                    is_active: !level.is_active,
                    updated_at: knex.fn.now()
                })
                .returning('*');

            return updatedLevel;
        } catch (error) {
            logger.error('Error toggling XP level:', error);
            throw error;
        }
    }
}

module.exports = XPService;
