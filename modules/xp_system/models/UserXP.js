/**
 * UserXP Model
 * Handles user XP tracking and level calculations
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class UserXP {
    /**
     * Get all active XP levels from database
     */
    static async getXPLevels() {
        return await knex('xp_levels')
            .where('is_active', true)
            .orderBy('min_xp', 'asc');
    }

    /**
     * Calculate user's level from XP based on database levels
     */
    static calculateLevel(totalXP, levels = null) {
        // If levels provided, use database-driven calculation
        if (levels && levels.length > 0) {
            for (let i = levels.length - 1; i >= 0; i--) {
                const level = levels[i];
                if (totalXP >= level.min_xp && (level.max_xp === null || totalXP <= level.max_xp)) {
                    return level.level_number;
                }
            }
            return levels[0].level_number;
        }
        
        // Fallback to formula if no levels provided
        if (totalXP < 0) totalXP = 0;
        return Math.floor(Math.sqrt(totalXP / 100)) + 1;
    }

    /**
     * Get current level object from database
     */
    static async getCurrentLevel(totalXP) {
        const levels = await this.getXPLevels();
        if (!levels || levels.length === 0) return null;
        
        for (let i = levels.length - 1; i >= 0; i--) {
            const level = levels[i];
            if (totalXP >= level.min_xp && (level.max_xp === null || totalXP <= level.max_xp)) {
                return level;
            }
        }
        return levels[0];
    }

    /**
     * Calculate XP needed to reach next level from database
     * Now async to fetch from database
     */
    static async getXPToNextLevel(totalXP) {
        const levels = await this.getXPLevels();
        if (!levels || levels.length === 0) return 100;
        
        // Find current level
        const currentLevel = this.calculateLevel(totalXP, levels);
        const nextLevelObj = levels.find(l => l.level_number === currentLevel + 1);
        
        if (!nextLevelObj) {
            // Already at max level
            return 0;
        }
        
        // Return XP needed to reach the START of next level
        return Math.max(0, nextLevelObj.min_xp - totalXP);
    }

    /**
     * Get or create user XP record
     */
    static async getOrCreateUserXP(userId) {
        let userXP = await knex('user_xp')
            .where('user_id', userId)
            .first();

        if (!userXP) {
            // Get the first level from database
            const firstLevel = await knex('xp_levels')
                .where('is_active', true)
                .orderBy('level_number', 'asc')
                .first();
            
            const initialLevel = firstLevel?.level_number || 1;
            const xpToNextLevel = firstLevel ? (firstLevel.max_xp - 0) : 100;
            
            // Create new XP record for user
            const [created] = await knex('user_xp')
                .insert({
                    user_id: userId,
                    total_xp: 0,
                    current_level: initialLevel,
                    xp_to_next_level: xpToNextLevel
                })
                .returning('*');

            userXP = created;
            logger.info(`Created XP record for user ${userId}`);
        }

        return userXP;
    }

    /**
     * Recalculate and update user level based on actual total XP
     * This fixes data inconsistency when transactions are deleted/modified
     */
    static async recalculateUserLevel(userId) {
        // Get actual total XP from transactions
        const result = await knex('xp_transactions')
            .where('user_id', userId)
            .sum('amount as total_xp')
            .first();

        const actualTotalXP = parseInt(result?.total_xp || 0) || 0;
        const levels = await this.getXPLevels();
        const correctLevel = this.calculateLevel(actualTotalXP, levels);
        const xpToNextLevel = await this.getXPToNextLevel(actualTotalXP);

        // Update the user_xp record with correct values
        await knex('user_xp')
            .where('user_id', userId)
            .update({
                total_xp: actualTotalXP,
                current_level: correctLevel,
                xp_to_next_level: xpToNextLevel,
                updated_at: new Date()
            });

        // Also update the users table
        await knex('users')
            .where('id', userId)
            .update({
                total_xp: actualTotalXP,
                current_level: correctLevel
            });

        return {
            user_id: userId,
            total_xp: actualTotalXP,
            current_level: correctLevel,
            xp_to_next_level: xpToNextLevel
        };
    }

    /**
     * Get user's XP stats
     */
    static async getUserXP(userId) {
        let userXP = await this.getOrCreateUserXP(userId);

        // Recalculate level if there are no transactions but level suggests there should be
        // This handles cases where transactions were deleted but user_xp wasn't updated
        const transactionCount = await knex('xp_transactions')
            .where('user_id', userId)
            .count('* as count')
            .first();

        if (parseInt(transactionCount.count) === 0 && userXP.total_xp > 0) {
            // No transactions but positive total XP - this is inconsistent, recalculate
            logger.info(`User ${userId} has no transactions but ${userXP.total_xp} total XP - recalculating`);
            userXP = await this.recalculateUserLevel(userId);
        } else if (parseInt(transactionCount.count) > 0) {
            // Verify the level calculation is correct
            const actualTotalXP = userXP.total_xp;
            const levels = await this.getXPLevels();
            const correctLevel = this.calculateLevel(actualTotalXP, levels);
            const correctXPToNext = await this.getXPToNextLevel(actualTotalXP);

            if (userXP.current_level !== correctLevel || userXP.xp_to_next_level !== correctXPToNext) {
                logger.info(`User ${userId} level calculation was incorrect - correcting from level ${userXP.current_level} to ${correctLevel}`);
                await knex('user_xp')
                    .where('user_id', userId)
                    .update({
                        current_level: correctLevel,
                        xp_to_next_level: correctXPToNext,
                        updated_at: new Date()
                    });
                userXP.current_level = correctLevel;
                userXP.xp_to_next_level = correctXPToNext;
            }
        }

        return {
            user_id: userXP.user_id,
            total_xp: userXP.total_xp,
            current_level: userXP.current_level,
            xp_to_next_level: userXP.xp_to_next_level
        };
    }

    /**
     * Add XP to user and create transaction
     * @param {UUID} userId - User ID
     * @param {number} amount - XP amount (can 
Transaction committed successfully
=== handleCompletionSideEffects START ===
userId: 71ff2a07-30ca-499b-b326-77b27fda44fe moduleId: 514341ee-851d-49bc-9905-5b8f98df8128 lessonId: c1bd9a6e-87d4-4edb-971a-b100eb9ea3b2 courseId: 9dcf815d-60eb-42e9-bb00-683d2b778f36       
Updating lesson progress...
Lesson progress updated
Awarding video completion XP...
[2025-12-30 22:07:56] info: [WARN] Video completion XP activity not found or inactive {"service":"open-lms-api"}
Checking for certificate generation...
=== checkAndGenerateCertificate START ===
userId: 71ff2a07-30ca-499b-b326-77b27fda44fe courseId: 9dcf815d-60eb-42e9-bb00-683d2b778f36
Certificate already exists: false
Total published modules in course: 3
Completed modules: 1 / 3
Course not yet 100% complete, certificate not generated
=== checkAndGenerateCertificate END ===
Certificate check complete
=== handleCompletionSideEffects SUCCESS ===
completion, null
=== ProgressService.completeModule SUCCESS ===
be negative)
     * @param {string} activityType - Type of activity
     * @param {UUID} referenceId - Reference ID (module_id, quiz_id, etc.)
     * @param {string} referenceType - Reference type ('module', 'quiz', etc.)
     * @param {string} description - Transaction description
     * @param {object} metadata - Additional metadata
     */
    static async addXP(userId, amount, activityType, referenceId = null, referenceType = null, description = null, metadata = null) {
        const trx = await knex.transaction();

        try {
            // Get or create user XP record
            let userXP = await trx('user_xp')
                .where('user_id', userId)
                .first();
            
            if (!userXP) {
                // Get the first level from database
                const firstLevel = await knex('xp_levels')
                    .where('is_active', true)
                    .orderBy('level_number', 'asc')
                    .first();
                
                const initialLevel = firstLevel?.level_number || 1;
                const xpToNextLevelValue = firstLevel ? (firstLevel.max_xp - 0) : 100;
                
                const [created] = await trx('user_xp')
                    .insert({
                        user_id: userId,
                        total_xp: 0,
                        current_level: initialLevel,
                        xp_to_next_level: xpToNextLevelValue
                    })
                    .returning('*');
                userXP = created;
            }
            
            // Calculate new total XP (ensure it doesn't go below 0)
            const newTotalXP = Math.max(0, userXP.total_xp + amount);
            
            // Get levels for calculation
            const levels = await knex('xp_levels')
                .where('is_active', true)
                .orderBy('min_xp', 'asc');
            
            const newLevel = this.calculateLevel(newTotalXP, levels);
            
            // Find next level object to calculate xp_to_next_level
            const nextLevelObj = levels.find(l => l.level_number === newLevel + 1);
            const xpToNextLevel = nextLevelObj 
                ? Math.max(0, nextLevelObj.min_xp - newTotalXP)
                : 0;

            // Update user XP
            await trx('user_xp')
                .where('user_id', userId)
                .update({
                    total_xp: newTotalXP,
                    current_level: newLevel,
                    xp_to_next_level: xpToNextLevel,
                    updated_at: new Date()
                });

            // Also update users table for quick access
            await trx('users')
                .where('id', userId)
                .update({
                    total_xp: newTotalXP,
                    current_level: newLevel
                });

            // Create transaction record
            const [transaction] = await trx('xp_transactions')
                .insert({
                    user_id: userId,
                    amount,
                    activity_type: activityType,
                    reference_id: referenceId,
                    reference_type: referenceType,
                    description: description || `${activityType}: ${amount > 0 ? '+' : ''}${amount} XP`,
                    metadata: metadata ? JSON.stringify(metadata) : null
                })
                .returning('*');

            await trx.commit();

            logger.info(`XP transaction: User ${userId} ${amount > 0 ? 'earned' : 'lost'} ${Math.abs(amount)} XP for ${activityType}`);

            return {
                transaction,
                userXP: {
                    total_xp: newTotalXP,
                    current_level: newLevel,
                    xp_to_next_level: xpToNextLevel,
                    previous_level: userXP.current_level,
                    level_up: newLevel > userXP.current_level
                }
            };
        } catch (error) {
            await trx.rollback();
            logger.error('Error adding XP:', error);
            throw error;
        }
    }
    /**
     * Get XP transaction history for a user
     */
    static async getTransactionHistory(userId, limit = 50, offset = 0) {
        const transactions = await knex('xp_transactions')
            .where('user_id', userId)
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);

        const total = await knex('xp_transactions')
            .where('user_id', userId)
            .count('* as count')
            .first();

        return {
            transactions,
            pagination: {
                limit,
                offset,
                total: parseInt(total.count)
            }
        };
    }

    /**
 * Get user's current XP streak
 * Normal streak logic (today OR yesterday anchored)
 */
    static async getUserStreak(userId) {
        // 1. Fetch unique XP days (earned XP only)
        const rows = await knex('xp_transactions')
            .where('user_id', userId)
            .andWhere('amount', '>', 0)
            .select(knex.raw('DATE(created_at) as xp_date'))
            .groupByRaw('DATE(created_at)')
            .orderBy('xp_date', 'desc');
        if (!rows.length) {
            return { streak: 0}
        };


        // 2. Convert XP dates to local midnight timestamps
        const xpDates = rows.map(r => {
            const d = new Date(r.xp_date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (!xpDates.includes(yesterday.getTime())) {
            return { streak: 0}
        }

        let streak = 1;
        let currentDate = yesterday.getTime();

        // 4. Count backward until a day is missing
        while (xpDates.includes(currentDate - 1000 * 60 * 60 * 24)) {
            streak++;
            currentDate -= 1000 * 60 * 60 * 24;
        }

        return {
            streak: streak ?? 0
        };
    }

    /**
     * Get XP leaderboard filtered by user's current level
     */
    static async getLeaderboard(userId, limit = 10, offset = 0) {
        // Get the authenticated user's current level
        const userXP = await knex('user_xp')
            .where('user_id', userId)
            .select('current_level')
            .first();

        const userLevel = userXP?.current_level || 1;

        // Get leaderboard for users at the same level
        const leaderboard = await knex('user_xp')
            .join('users', 'user_xp.user_id', 'users.id')
            .join('roles', 'users.role_id', 'roles.id')
            .leftJoin('user_personalisations', 'users.id', 'user_personalisations.user_id')
            .select(
                'users.id',
                'users.username',
                'users.first_name',
                'users.last_name',
                'users.avatar_url',
                knex.raw("user_personalisations.data->>'avatar_character' as character_avatar"),
                'user_xp.total_xp',
                'user_xp.current_level',
                'roles.name as role'
            )
            .where('user_xp.current_level', '=', userLevel)
            .where('user_xp.total_xp', '>', 0)
            .whereNotIn('roles.name', ['super_admin', 'admin', 'instructor', 'staff'])
            .orderBy('user_xp.total_xp', 'desc')
            .limit(limit)
            .offset(offset);

        // Calculate user's rank within their level
        const rank = await knex('user_xp')
            .where('current_level', '=', userLevel)
            .where('total_xp', '>', knex.select('total_xp').from('user_xp').where('user_id', userId))
            .count('* as count')
            .first();

        return {
            leaderboard,
            userLevel,
            userRank: parseInt(rank?.count || 0) + 1
        };
    }

    /**
     * Check if user has already earned XP for a specific reference
     * Prevents duplicate XP awards
     */
    static async hasEarnedXPFor(userId, activityType, referenceId) {
        const existing = await knex('xp_transactions')
            .where({
                user_id: userId,
                activity_type: activityType,
                reference_id: referenceId
            })
            .first();

        return !!existing;
    }
}

module.exports = UserXP;
