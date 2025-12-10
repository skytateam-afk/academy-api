/**
 * Progress Controller
 * Handles module and lesson progress tracking
 */

const knex = require('../../../config/knex');
const Certificate = require('../../../models/Certificate');
const logger = require('../../../config/winston');

/**
 * Mark a module as complete
 */
exports.completeModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { completionData = {} } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const ProgressService = require('../services/progressService');
    const result = await ProgressService.completeModule(userId, moduleId, completionData);

    res.json({
      success: true,
      message: 'Module marked as complete',
      data: result.data
    });
  } catch (error) {
    if (error.message === 'Module not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error('Error completing module:', error);
    next(error);
  }
};

/**
 * Update video progress
 */
exports.updateVideoProgress = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { video_progress_seconds, videoProgressSeconds, videoDurationSeconds, timeSpent } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Handle both snake_case and camelCase parameter names
    const progressSeconds = video_progress_seconds || videoProgressSeconds || 0;
    const durationSeconds = videoDurationSeconds || 0;

    // Calculate if complete
    const completionPercentage = durationSeconds > 0
      ? Math.min(100, Math.round((progressSeconds / durationSeconds) * 100))
      : 0;

    const isCompleted = completionPercentage >= 90; // Threshold for video completion (e.g., 90%)

    if (isCompleted) {
      // If complete, use the full service to trigger side effects
      const ProgressService = require('../services/progressService');
      const data = {
        videoProgress: progressSeconds,
        videoDuration: durationSeconds,
        timeSpent
      };

      const result = await ProgressService.completeModule(userId, moduleId, data);

      return res.json({
        success: true,
        message: 'Video progress updated (completed)',
        data: result.data
      });
    }

    // Otherwise just update progress locally (lightweight)
    const knex = require('../../../config/knex');
    const module = await knex('lesson_modules').where('id', moduleId).first();
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });

    const lesson = await knex('lessons').where('id', module.lesson_id).first();

    // Upsert partial progress
    const now = new Date();
    await knex.raw(`
      INSERT INTO module_progress (
        user_id, module_id, course_id, is_completed, completion_percentage, 
        last_accessed_at, time_spent_seconds, 
        video_progress_seconds, video_duration_seconds, 
        updated_at
      )
      VALUES (?, ?, ?, false, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id, module_id) 
      DO UPDATE SET
        completion_percentage = EXCLUDED.completion_percentage,
        last_accessed_at = EXCLUDED.last_accessed_at,
        time_spent_seconds = EXCLUDED.time_spent_seconds,
        video_progress_seconds = EXCLUDED.video_progress_seconds,
        video_duration_seconds = EXCLUDED.video_duration_seconds,
        updated_at = EXCLUDED.updated_at
    `, [
      userId, 
      moduleId, 
      lesson.course_id, 
      completionPercentage,
      now, 
      timeSpent || 0,
      progressSeconds, 
      durationSeconds || 0,
      now
    ]);

    res.json({
      success: true,
      message: 'Video progress updated',
      data: {
        moduleId,
        completionPercentage
      }
    });

  } catch (error) {
    console.error('Error updating video progress:', error);
    next(error);
  }
};

/**
 * Get course progress for a user
 */
exports.getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get all lessons for this course
    const lessons = await knex('lessons')
      .where('course_id', courseId)
      .where('is_published', true)
      .orderBy('display_order', 'asc');

    // Get lesson progress
    const lessonProgress = await knex('lesson_progress')
      .where({ user_id: userId, course_id: courseId });

    // Get all module progress
    const moduleProgress = await knex('module_progress')
      .where({ user_id: userId, course_id: courseId });

    // Build response with lock status
    const lessonsWithProgress = [];

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const progress = lessonProgress.find(p => p.lesson_id === lesson.id);

      // Check if lesson is unlocked
      let isUnlocked = false;
      if (i === 0) {
        // First lesson is always unlocked
        isUnlocked = true;
      } else {
        // Check if previous lesson is complete
        const previousLesson = lessons[i - 1];
        const previousProgress = lessonProgress.find(p => p.lesson_id === previousLesson.id);
        isUnlocked = previousProgress?.is_completed || false;
      }

      lessonsWithProgress.push({
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        is_unlocked: isUnlocked,
        is_completed: progress?.is_completed || false,
        completion_percentage: progress?.completion_percentage || 0,
        completed_modules_count: progress?.completed_modules_count || 0,
        total_modules_count: progress?.total_modules_count || 0,
        last_accessed_at: progress?.last_accessed_at,
        completed_at: progress?.completed_at
      });
    }

    // Calculate overall course progress
    const totalLessons = lessons.length;
    const completedLessons = lessonProgress.filter(p => p.is_completed).length;
    const courseCompletionPercentage = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        overall_progress: {
          percentage: courseCompletionPercentage,
          completed_modules: moduleProgress.filter(mp => mp.is_completed).length,
          total_modules: moduleProgress.length,
          completed_lessons: completedLessons,
          total_lessons: totalLessons
        },
        course_id: courseId,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        lessons: lessonsWithProgress,
        module_progress: moduleProgress
      }
    });
  } catch (error) {
    console.error('Error getting course progress:', error);
    next(error);
  }
};

/**
 * Helper: Update lesson progress based on module completions
 */
async function updateLessonProgress(userId, lessonId, courseId) {
  // Get all modules for this lesson
  const modules = await knex('lesson_modules')
    .where('lesson_id', lessonId)
    .where('is_published', true);

  const totalModules = modules.length;

  if (totalModules === 0) return;

  // Get completed modules
  const completedModules = await knex('module_progress')
    .where({ user_id: userId, course_id: courseId })
    .whereIn('module_id', modules.map(m => m.id))
    .where('is_completed', true);

  const completedCount = completedModules.length;
  const completionPercentage = Math.round((completedCount / totalModules) * 100);
  const isCompleted = completedCount === totalModules;

  // Get enrollment to satisfy foreign key requirement
  const enrollment = await knex('enrollments')
    .where({ user_id: userId, course_id: courseId })
    .first();

  if (!enrollment) {
    console.error('No enrollment found for user', userId, 'and course', courseId);
    return;
  }

  // Upsert lesson progress
  const existingProgress = await knex('lesson_progress')
    .where({ user_id: userId, lesson_id: lessonId })
    .first();

  const progressData = {
    user_id: userId,
    lesson_id: lessonId,
    enrollment_id: enrollment.id,
    course_id: courseId,
    is_completed: isCompleted,
    completion_percentage: completionPercentage,
    completed_modules_count: completedCount,
    total_modules_count: totalModules
  };

  if (isCompleted && !existingProgress?.is_completed) {
    progressData.completed_at = new Date();

    // Award XP for lesson completion
    try {
      logger.info(`Awarding XP for lesson completion - User: ${userId}, Lesson: ${lessonId}`);
      const XPService = require('../../xp_system/services/xpService');
      const xpResult = await XPService.awardLessonCompletionXP(userId, lessonId);
      logger.info(`Lesson completion XP awarded - User: ${userId}, Lesson: ${lessonId}, XP Result:`, xpResult);

      if (xpResult && xpResult.userXP.level_up) {
        logger.info(`User ${userId} leveled up to level ${xpResult.userXP.current_level}!`);
      }
    } catch (xpError) {
      logger.error('Error awarding lesson completion XP:', xpError);
    }
  }

  if (existingProgress) {
    await knex('lesson_progress')
      .where('id', existingProgress.id)
      .update(progressData);
  } else {
    await knex('lesson_progress').insert(progressData);
  }
}

/**
 * Get module progress for a specific module
 */
exports.getModuleProgress = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const progress = await knex('module_progress')
      .where({ user_id: userId, module_id: moduleId })
      .first();

    res.json({
      success: true,
      data: progress || {
        is_completed: false,
        completion_percentage: 0,
        video_progress_seconds: 0
      }
    });
  } catch (error) {
    console.error('Error getting module progress:', error);
    next(error);
  }
}

/**
 * Helper: Check if course is 100% complete and award completion XP
 */
async function checkAndAwardCourseCompletionXP(userId, courseId) {
  try {
    // First check if course completion XP was already awarded
    const XPService = require('../../xp_system/services/xpService');
    const existingXP = await knex('xp_transactions')
      .where({ user_id: userId, activity_type: 'course_complete', reference_id: courseId })
      .first();

    if (existingXP) {
      logger.info(`Course completion XP already awarded for course ${courseId} to user ${userId}`);
      return; // XP already awarded
    }

    // Get all modules for this course
    const modules = await knex('lesson_modules as lm')
      .join('lessons as l', 'lm.lesson_id', 'l.id')
      .where('l.course_id', courseId)
      .where('lm.is_published', true)
      .where('l.is_published', true)
      .select('lm.id');

    if (modules.length === 0) {
      return; // No modules to complete
    }

    // Get completed modules
    const moduleIds = modules.map(m => m.id);
    const completedModules = await knex('module_progress')
      .whereIn('module_id', moduleIds)
      .where({ user_id: userId, is_completed: true })
      .count('* as count');

    const completionPercentage = (parseInt(completedModules[0].count) / modules.length) * 100;

    // If course is 100% complete, award XP for course completion
    if (completionPercentage >= 100) {
      logger.info(`Course ${courseId} is 100% complete for user ${userId}, awarding course completion XP`);
      const xpResult = await XPService.awardCourseCompletionXP(userId, courseId);
      if (xpResult) {
        logger.info(`Course completion XP awarded - User: ${userId}, Course: ${courseId}, XP Result:`, xpResult);

        if (xpResult.userXP.level_up) {
          logger.info(`User ${userId} leveled up to level ${xpResult.userXP.current_level}!`);
        }
      }
    }
  } catch (error) {
    // Log error but don't fail the request
    logger.error('Error checking/awarding course completion XP:', error);
  }
}

/**
 * Helper: Check if course is 100% complete and generate certificate
 */
async function checkAndGenerateCertificate(userId, courseId) {
  try {
    // Check if certificate already exists
    const existingCertificate = await Certificate.findByUserAndCourse(userId, courseId);
    if (existingCertificate) {
      return; // Certificate already issued
    }

    // Get all modules for this course
    const modules = await knex('lesson_modules as lm')
      .join('lessons as l', 'lm.lesson_id', 'l.id')
      .where('l.course_id', courseId)
      .where('lm.is_published', true)
      .where('l.is_published', true)
      .select('lm.id');

    if (modules.length === 0) {
      return; // No modules to complete
    }

    // Get completed modules
    const moduleIds = modules.map(m => m.id);
    const completedModules = await knex('module_progress')
      .whereIn('module_id', moduleIds)
      .where({ user_id: userId, is_completed: true })
      .count('* as count');

    const completionPercentage = (parseInt(completedModules[0].count) / modules.length) * 100;

    // If course is 100% complete, generate certificate and ensure XP is awarded
    if (completionPercentage >= 100) {
      // Update enrollment status to 'completed'
      await knex('enrollments')
        .where({ user_id: userId, course_id: courseId })
        .update({
          status: 'completed',
          completed_at: new Date(),
          updated_at: new Date()
        });

      logger.info(`Enrollment marked as completed for user ${userId} on course ${courseId}`);

      // First ensure course completion XP is awarded (independent of certificate)
      await checkAndAwardCourseCompletionXP(userId, courseId);

      // Get course and user details
      const course = await knex('courses').where({ id: courseId }).first();
      const user = await knex('users').where({ id: userId }).first();

      // Create certificate data
      const certificateData = {
        course_title: course.title,
        course_description: course.description,
        student_name: `${user.first_name} ${user.last_name}`,
        student_email: user.email,
        completion_date: new Date().toISOString(),
        total_modules: modules.length,
        institution_name: 'Your Institution Name' // TODO: Get from settings
      };

      // Generate certificate
      await Certificate.create(userId, courseId, certificateData);

      logger.info(`Certificate automatically generated for user ${userId} on course ${courseId}`);
    }
  } catch (error) {
    // Log error but don't fail the request
    logger.error('Error checking/generating certificate:', error);
  }
}

module.exports = exports;
