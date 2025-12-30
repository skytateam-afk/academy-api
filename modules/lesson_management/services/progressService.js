/**
 * Progress Service
 * Handles module progress tracking, XP awarding, and certificate generation
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');
const Certificate = require('../../../models/Certificate');
const XPService = require('../../xp_system/services/xpService');

class ProgressService {
    /**
     * Mark a module as complete
     * @param {string} userId - User ID
     * @param {string} moduleId - Module ID
     * @param {Object} data - Completion data (time spent, quiz scores, etc)
     */
    async completeModule(userId, moduleId, data = {}) {
        console.log('=== ProgressService.completeModule START ===');
        console.log('userId:', userId, 'moduleId:', moduleId, 'data:', JSON.stringify(data));
        
        const trx = await knex.transaction();

        try {
            // 1. Get module details
            const module = await trx('lesson_modules')
                .where('id', moduleId)
                .first();

            console.log('Module found:', module ? `ID: ${module.id}, lesson_id: ${module.lesson_id}` : 'NULL');

            if (!module) {
                throw new Error('Module not found');
            }

            // 2. Get lesson to find course_id
            const lesson = await trx('lessons')
                .where('id', module.lesson_id)
                .first();

            console.log('Lesson found:', lesson ? `ID: ${lesson.id}, course_id: ${lesson.course_id}` : 'NULL');

            if (!lesson) {
                throw new Error('Lesson not found');
            }

            // 3. Prepare progress data
            const progressData = {
                user_id: userId,
                module_id: moduleId,
                course_id: lesson.course_id,
                is_completed: true,
                completion_percentage: 100,
                completed_at: new Date(),
                last_accessed_at: new Date(),
                time_spent_seconds: data.timeSpent || 0,
                updated_at: new Date()
            };

            // Add specific fields based on input
            if (data.videoProgress) {
                progressData.video_progress_seconds = data.videoProgress;
                progressData.video_duration_seconds = data.videoDuration;
            }

            if (data.quizData) {
                progressData.completion_data = data.quizData;
                progressData.quiz_score = data.quizData.score;
                progressData.quiz_passed = data.quizData.passed;
            }

            // 4. Upsert progress using ON CONFLICT since we ensured the unique constraint exists
            console.log('Upserting module_progress with data:', {
                user_id: progressData.user_id,
                module_id: progressData.module_id,
                course_id: progressData.course_id,
                is_completed: progressData.is_completed,
                completion_percentage: progressData.completion_percentage,
                quiz_score: progressData.quiz_score,
                quiz_passed: progressData.quiz_passed
            });

            const upsertResult = await trx.raw(`
        INSERT INTO module_progress (
          user_id, module_id, course_id, is_completed, completion_percentage, 
          completed_at, last_accessed_at, time_spent_seconds, 
          video_progress_seconds, video_duration_seconds, 
          completion_data, quiz_score, quiz_passed, 
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON CONFLICT (user_id, module_id) 
        DO UPDATE SET
          is_completed = EXCLUDED.is_completed,
          completion_percentage = EXCLUDED.completion_percentage,
          completed_at = COALESCE(module_progress.completed_at, EXCLUDED.completed_at),
          last_accessed_at = EXCLUDED.last_accessed_at,
          time_spent_seconds = EXCLUDED.time_spent_seconds,
          video_progress_seconds = EXCLUDED.video_progress_seconds,
          video_duration_seconds = EXCLUDED.video_duration_seconds,
          completion_data = EXCLUDED.completion_data,
          quiz_score = EXCLUDED.quiz_score,
          quiz_passed = EXCLUDED.quiz_passed,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `, [
                progressData.user_id,
                progressData.module_id,
                progressData.course_id,
                progressData.is_completed,
                progressData.completion_percentage,
                progressData.completed_at,
                progressData.last_accessed_at,
                progressData.time_spent_seconds,
                progressData.video_progress_seconds || null,
                progressData.video_duration_seconds || null,
                progressData.completion_data ? JSON.stringify(progressData.completion_data) : null,
                progressData.quiz_score || null,
                progressData.quiz_passed || null
            ]);

            console.log('Upsert result:', upsertResult.rows ? upsertResult.rows[0] : 'No rows returned');

            

            await trx.commit();
            console.log('Transaction committed successfully');

           const completionSideEffect=await this.handleCompletionSideEffects(userId, moduleId, lesson, data).catch(err => {
                logger.error(`Error processing side effects for module ${moduleId}:`, err);
                console.error(`Error processing side effects for module ${moduleId}:`, err);
            });
            console.log("completion,",completionSideEffect)
            console.log('=== ProgressService.completeModule SUCCESS ===');
            return {
                success: true,
                data: {...progressData,...completionSideEffect}
            };
            
        } catch (error) {
            console.error('=== ProgressService.completeModule ERROR ===', error);
            await trx.rollback();
            console.log('Transaction rolled back');
            throw error;
        }
    }

    /**
     * Handle post-completion logic (XP, Lesson, Certificate)
     */
    async handleCompletionSideEffects(userId, moduleId, lesson, data) {
        console.log('=== handleCompletionSideEffects START ===');
        console.log('userId:', userId, 'moduleId:', moduleId, 'lessonId:', lesson.id, 'courseId:', lesson.course_id);
        
        try {
            // 1. Update lesson progress
            console.log('Updating lesson progress...');
            await this.updateLessonProgress(userId, lesson.id, lesson.course_id);
            console.log('Lesson progress updated');

            // 2. Award XP (if not quiz - quiz XP is handled separately in quizController currently)
            // Refactor Note: Ideally quiz XP should be here too, but to minimize risk we keep current behavior
            let xpResult = null;
            if (!data.quizData) {
                try {
                    console.log('Awarding video completion XP...');
                    xpResult = await XPService.awardVideoCompletionXP(userId, moduleId);
                } catch (e) {
                    logger.error('Error awarding module XP:', e);
                }
            } else {
                console.log('Skipping XP award (quiz data present - handled by quizController)');
            }

            // 3. Check for course completion & generate certificate
            console.log('Checking for certificate generation...');
            await this.checkAndGenerateCertificate(userId, lesson.course_id);
            console.log('Certificate check complete');

            console.log('=== handleCompletionSideEffects SUCCESS ===');
            return xpResult;
        } catch (error) {
            console.error('=== handleCompletionSideEffects ERROR ===', error);
            throw error;
        }
    }

    /**
     * Update lesson progress
     */
    async updateLessonProgress(userId, lessonId, courseId) {
        const modules = await knex('lesson_modules')
            .where('lesson_id', lessonId)
            .where('is_published', true);

        if (modules.length === 0) return;

        const moduleIds = modules.map(m => m.id);
        const completedModules = await knex('module_progress')
            .where({ user_id: userId })
            .whereIn('module_id', moduleIds)
            .where('is_completed', true);

        const isCompleted = completedModules.length === modules.length;
        const progressPercent = Math.round((completedModules.length / modules.length) * 100);

        const enrollment = await knex('enrollments')
            .where({ user_id: userId, course_id: courseId })
            .first();

        if (!enrollment) return; // Should not happen

        const progressData = {
            user_id: userId,
            lesson_id: lessonId,
            enrollment_id: enrollment.id,
            course_id: courseId,
            is_completed: isCompleted,
            completion_percentage: progressPercent,
            completed_modules_count: completedModules.length,
            total_modules_count: modules.length,
            updated_at: new Date()
        };

        const existing = await knex('lesson_progress')
            .where({ user_id: userId, lesson_id: lessonId })
            .first();

        if (existing) {
            await knex('lesson_progress')
                .where('id', existing.id)
                .update(progressData);
        } else {
            progressData.created_at = new Date();
            await knex('lesson_progress').insert(progressData);
        }

        // Award lesson XP if complete
        if (isCompleted && !existing?.is_completed) {
            try {
                await XPService.awardLessonCompletionXP(userId, lessonId);
            } catch (e) {
                logger.error('Error awarding lesson XP:', e);
            }
        }
    }

    /**
     * Check if course is complete and generate certificate
     */
    async checkAndGenerateCertificate(userId, courseId) {
        console.log('=== checkAndGenerateCertificate START ===');
        console.log('userId:', userId, 'courseId:', courseId);
        
        try {
            // Double check certificate doesn't exist
            const exists = await Certificate.exists(userId, courseId);
            console.log('Certificate already exists:', exists);
            if (exists) return;

            // Get all visible modules
            const modules = await knex('lesson_modules as lm')
                .join('lessons as l', 'lm.lesson_id', 'l.id')
                .where('l.course_id', courseId)
                .where('l.is_published', true)
                .where('lm.is_published', true)
                .select('lm.id');

            console.log('Total published modules in course:', modules.length);
            if (modules.length === 0) {
                console.log('No modules in course, skipping certificate check');
                return;
            }

            // Count completed
            const completedCountResult = await knex('module_progress')
                .where({ user_id: userId, is_completed: true })
                .whereIn('module_id', modules.map(m => m.id))
                .count('* as count');

            const completedCount = parseInt(completedCountResult[0].count);
            console.log(`Completed modules: ${completedCount} / ${modules.length}`);

            if (completedCount >= modules.length) {
                console.log('Course is 100% complete! Generating certificate...');

                // 1. Update Enrollment
                await knex('enrollments')
                    .where({ user_id: userId, course_id: courseId })
                    .update({
                        status: 'completed',
                        completed_at: new Date(),
                        progress_percent: 100,
                        updated_at: new Date()
                    });
                console.log('Enrollment marked as completed');

                // 2. Award Course XP
                try {
                    await XPService.awardCourseCompletionXP(userId, courseId);
                    console.log('Course completion XP awarded');
                } catch (e) {
                    logger.error('Error awarding course completion XP:', e);
                    console.error('Error awarding course completion XP:', e);
                }

                // 3. Generate Certificate
                const user = await knex('users').where('id', userId).first();
                const course = await knex('courses').where('id', courseId).first();

                const certData = {
                    course_title: course.title,
                    student_name: `${user.first_name} ${user.last_name}`,
                    completion_date: new Date().toISOString()
                };

                await Certificate.create(userId, courseId, certData);
                logger.info(`Generated certificate for user ${userId} course ${courseId}`);
                console.log('Certificate generated successfully!');
            } else {
                console.log('Course not yet 100% complete, certificate not generated');
            }

            console.log('=== checkAndGenerateCertificate END ===');
        } catch (error) {
            logger.error('Error generating certificate:', error);
            console.error('=== checkAndGenerateCertificate ERROR ===', error);
        }
    }
}

module.exports = new ProgressService();
