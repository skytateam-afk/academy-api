/**
 * Module Controller
 * Handles HTTP requests for lesson modules
 */

const moduleRepository = require('../repositories/moduleRepository');
const moduleAttachmentRepository = require('../repositories/moduleAttachmentRepository');
const lessonRepository = require('../repositories/lessonRepository');
const notificationService = require('../../notifications/services/notificationService');

/**
 * Get all lessons with modules for a course
 */
exports.getModulesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;
    const knex = require('../../../config/knex');
    
    // Check if user is admin or super admin
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

    // Get all published lessons for this course
    const lessons = await knex('lessons')
      .where('course_id', courseId)
      .where('is_published', true)
      .orderBy('display_order', 'asc');

    // Get user's progress for all lessons if user is authenticated
    let lessonProgressMap = new Map();
    let moduleProgressMap = new Map();

    if (userId) {
      try {
        // Get lesson progress
        const lessonProgress = await knex('lesson_progress')
          .where('user_id', userId)
          .whereIn('lesson_id', lessons.map(l => l.id));

        lessonProgress.forEach(lp => {
          lessonProgressMap.set(lp.lesson_id, lp);
        });

        // Get module progress for all modules in all lessons (BATCH QUERY)
        const allModules = await knex('lesson_modules')
          .whereIn('lesson_id', lessons.map(l => l.id));

        const moduleProgress = await knex('module_progress')
          .where('user_id', userId)
          .whereIn('module_id', allModules.map(m => m.id));

        moduleProgress.forEach(mp => {
          moduleProgressMap.set(mp.module_id, mp);
        });
      } catch (error) {
        console.error('[Progress Error] Failed to fetch progress data:', error);
      }
    }

    // Check if user is enrolled (SINGLE QUERY)
    let isEnrolled = false;
    if (userId) {
      const enrollment = await knex('enrollments')
        .where({
          course_id: courseId,
          user_id: userId,
          status: 'active'
        })
        .orWhere({
          course_id: courseId,
          user_id: userId,
          status: 'completed'
        })
        .first();

      isEnrolled = !!enrollment;
    }

    // Check if user has active subscription that gives access to this course (SINGLE QUERY)
    let hasSubscriptionAccess = false;
    let courseSubscriptionTierId = null;
    if (userId) {
      const course = await knex('courses').where('id', courseId).select('subscription_tier_id').first();
      courseSubscriptionTierId = course?.subscription_tier_id;

      if (courseSubscriptionTierId) {
        const UserSubscription = require('../../../models/UserSubscription');
        const activeSubscription = await UserSubscription.getUserActiveSubscription(userId);
        if (activeSubscription && activeSubscription.tierId === courseSubscriptionTierId) {
          hasSubscriptionAccess = true;
        }
      }
    }

    // For each lesson, get its modules with attachments and progress
    const lessonsWithModules = [];

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const modules = await moduleRepository.findWithAttachments(lesson.id);

      // Determine if this lesson is locked
      // First lesson is always unlocked, subsequent lessons require previous lesson to be complete
      let isLocked = false;
      if (userId && i > 0) {
        const previousLesson = lessons[i - 1];
        const previousLessonProgress = lessonProgressMap.get(previousLesson.id);

        // Check if previous lesson is complete
        if (!previousLessonProgress || !previousLessonProgress.is_completed) {
          isLocked = true;
        }
      }

      // Get lesson progress
      const lessonProgress = lessonProgressMap.get(lesson.id);

      // Calculate completed modules count dynamically from module_progress
      const completedModulesInLesson = modules.filter(module => {
        const moduleProgress = moduleProgressMap.get(module.id);
        return moduleProgress?.is_completed === true;
      }).length;

      const totalModulesInLesson = modules.length;
      const calculatedPercentage = totalModulesInLesson > 0
        ? Math.round((completedModulesInLesson / totalModulesInLesson) * 100)
        : 0;

      lessonsWithModules.push({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        order_index: lesson.order_index,
        duration: lesson.duration,
        is_free: lesson.is_free || false,
        is_locked: isLocked,
        progress: {
          is_completed: completedModulesInLesson === totalModulesInLesson && totalModulesInLesson > 0,
          completed_modules_count: completedModulesInLesson, // Use dynamically calculated count
          total_modules_count: totalModulesInLesson,
          progress_percentage: calculatedPercentage,
          last_accessed_at: lessonProgress?.last_accessed_at || null
        },
        modules: modules.map(module => {
          // Include video_url for users with proper access
          // Logic:
          // 1. If user is admin/super admin -> Allow full access (preview mode)
          // 2. If module is preview -> Allow
          // 3. If user has subscription access to course -> Allow full access
          // 4. If user is enrolled -> Allow full access (subject to lock status)
          // 5. Otherwise -> Deny

          const isPreviewContent = module.is_preview || false;
          const hasFullAccess = isAdmin || hasSubscriptionAccess || isEnrolled;
          const canViewContent = isAdmin || isPreviewContent || (hasFullAccess && !isLocked);

          // Get module progress
          const moduleProgress = moduleProgressMap.get(module.id);

          // Sanitize interactive content to remove correct answers for quizzes
          let sanitizedInteractiveContent = null;
          if (canViewContent && module.interactive_content) {
            sanitizedInteractiveContent = { ...module.interactive_content };

            // Remove correct answers from quiz questions
            if (sanitizedInteractiveContent.module_type === 'quiz' && sanitizedInteractiveContent.quiz_questions) {
              sanitizedInteractiveContent.quiz_questions = sanitizedInteractiveContent.quiz_questions.map(q => {
                const sanitizedQuestion = { ...q };
                delete sanitizedQuestion.correct_answer;

                // Remove isCorrect flags from options
                if (sanitizedQuestion.options) {
                  sanitizedQuestion.options = sanitizedQuestion.options.map(opt => {
                    if (typeof opt === 'object' && 'isCorrect' in opt) {
                      const { isCorrect, ...rest } = opt;
                      return rest;
                    }
                    return opt;
                  });
                }

                return sanitizedQuestion;
              });
            }
          }

          return {
            id: module.id,
            title: module.title,
            description: module.description,
            order_index: module.order_index,
            content_type: module.content_type,
            duration_minutes: module.duration_minutes,
            is_preview: module.is_preview || false,
            video_url: canViewContent ? module.video_url : undefined,
            text_content: module.content_type === 'text' && canViewContent ? module.text_content : undefined,
            interactive_content: sanitizedInteractiveContent,
            is_completed: moduleProgress?.is_completed || false,
            progress: moduleProgress ? {
              is_completed: moduleProgress.is_completed,
              video_progress_seconds: moduleProgress.video_progress_seconds,
              quiz_score: moduleProgress.quiz_score,
              quiz_passed: moduleProgress.quiz_passed,
              completed_at: moduleProgress.completed_at,
              last_accessed_at: moduleProgress.last_accessed_at,
              completion_data: moduleProgress.completion_data // Include saved quiz results
            } : null,
            attachments: (module.attachments || []).map(att => ({
              id: att.id,
              title: att.title,
              file_type: att.file_type,
              file_size: att.file_size,
              description: att.description,
              is_downloadable: att.is_downloadable,
              file_url: canViewContent ? att.file_url : undefined
            }))
          };
        })
      });
    }

    res.json({
      success: true,
      data: lessonsWithModules
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all modules for a lesson
 */
exports.getModulesByLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { page, limit, isPublished } = req.query;

    const result = await moduleRepository.findByLesson(lessonId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      isPublished: isPublished !== undefined ? isPublished === 'true' : undefined
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single module by ID
 */
exports.getModuleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const module = await moduleRepository.findById(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Get attachments
    module.attachments = await moduleAttachmentRepository.findByModule(id);

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    next(error);
  }
};

exports.createModule = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const moduleData = req.body;

    // Import storage service
    const storageService = require('../../../services/storageService');

    // Handle file uploads from upload.fields() middleware
    if (req.files) {
      if (req.files.video && req.files.video[0]) {
        const videoFile = req.files.video[0];
        const uploadResult = await storageService.uploadFile(
          videoFile.buffer,
          videoFile.originalname,
          videoFile.mimetype,
          'lesson-videos',
          { lessonId, uploadedBy: req.user?.userId }
        );
        moduleData.video_url = uploadResult.fileUrl;
      }
      if (req.files.attachment && req.files.attachment[0]) {
        const attachmentFile = req.files.attachment[0];
        const uploadResult = await storageService.uploadFile(
          attachmentFile.buffer,
          attachmentFile.originalname,
          attachmentFile.mimetype,
          'lesson-attachments',
          { lessonId, uploadedBy: req.user?.userId }
        );
        moduleData.attachment_url = uploadResult.fileUrl;
      }
    }

    // Verify lesson exists
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Map frontend types to database content_type
    // Frontend: video, audio, text, quiz, assignment, attachment
    // Database: video, audio, text, document, interactive, mixed
    const typeMapping = {
      'video': 'video',
      'audio': 'audio',
      'text': 'text',
      'quiz': 'interactive',
      'assignment': 'document',
      'attachment': 'document'
    };

    const contentType = typeMapping[moduleData.type] || 'mixed';

    // Map frontend field names to database column names
    const dbModuleData = {
      lesson_id: lessonId,
      title: moduleData.title,
      slug: moduleData.slug || moduleData.title.toLowerCase().replace(/\s+/g, '-'),
      description: moduleData.content || moduleData.description,
      content_type: contentType,
      video_url: moduleData.video_url || (moduleData.type === 'attachment' ? moduleData.attachment_url : null),
      text_content: moduleData.type === 'text' ? moduleData.content : null,
      duration_minutes: moduleData.duration,
      is_published: moduleData.is_published !== undefined ? moduleData.is_published : false,
      is_preview: moduleData.is_free !== undefined ? moduleData.is_free : false,
      order_index: moduleData.order_index,
      // Store quiz/assignment/attachment specific data in interactive_content JSONB field
      interactive_content: ['quiz', 'assignment', 'attachment'].includes(moduleData.type) ? {
        module_type: moduleData.type, // Store original type
        quiz_passing_score: moduleData.quiz_passing_score,
        quiz_time_limit: moduleData.quiz_time_limit,
        quiz_max_attempts: moduleData.quiz_max_attempts,
        quiz_questions: moduleData.quiz_questions,
        assignment_due_date: moduleData.assignment_due_date,
        assignment_max_score: moduleData.assignment_max_score,
        assignment_submission_type: moduleData.assignment_submission_type,
        assignment_instructions: moduleData.assignment_instructions,
        attachment_url: moduleData.attachment_url,
        attachment_type: moduleData.attachment_type,
        attachment_is_downloadable: moduleData.attachment_is_downloadable
      } : null
    };

    // Check for duplicate slug
    if (dbModuleData.slug) {
      const exists = await moduleRepository.slugExists(lessonId, dbModuleData.slug);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'A module with this slug already exists in this lesson'
        });
      }
    }

    // Get next order index if not provided
    if (dbModuleData.order_index === undefined) {
      dbModuleData.order_index = await moduleRepository.getNextOrderIndex(lessonId);
    }

    const module = await moduleRepository.create(dbModuleData);

    // Send notification to instructor
    if (req.user && req.user.userId && lesson) {
      notificationService.sendModuleAddedNotification(
        req.user.userId,
        module.title,
        lesson.title
      ).catch(err => logger.error('Failed to send module added notification', { error: err.message }));
    }

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: module
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a module
 */
exports.updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Import storage service
    const storageService = require('../../../services/storageService');

    // Handle file uploads from upload.fields() middleware
    if (req.files) {
      if (req.files.video && req.files.video[0]) {
        const videoFile = req.files.video[0];
        const uploadResult = await storageService.uploadFile(
          videoFile.buffer,
          videoFile.originalname,
          videoFile.mimetype,
          'lesson-videos',
          { moduleId: id, uploadedBy: req.user?.userId }
        );
        updates.video_url = uploadResult.fileUrl;
      }
      if (req.files.attachment && req.files.attachment[0]) {
        const attachmentFile = req.files.attachment[0];
        const uploadResult = await storageService.uploadFile(
          attachmentFile.buffer,
          attachmentFile.originalname,
          attachmentFile.mimetype,
          'lesson-attachments',
          { moduleId: id, uploadedBy: req.user?.userId }
        );
        updates.attachment_url = uploadResult.fileUrl;
      }
    }

    const module = await moduleRepository.findById(id);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Map frontend types to database content_type
    const typeMapping = {
      'video': 'video',
      'audio': 'audio',
      'text': 'text',
      'quiz': 'interactive',
      'assignment': 'document',
      'attachment': 'document'
    };

    // Map frontend field names to database column names
    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.description = updates.content;
    if (updates.type !== undefined) {
      dbUpdates.content_type = typeMapping[updates.type] || 'mixed';
    }
    if (updates.video_url !== undefined) dbUpdates.video_url = updates.video_url;
    if (updates.duration !== undefined) dbUpdates.duration_minutes = updates.duration;
    if (updates.is_published !== undefined) dbUpdates.is_published = updates.is_published;
    if (updates.is_free !== undefined) dbUpdates.is_preview = updates.is_free;
    if (updates.type === 'text' && updates.content !== undefined) {
      dbUpdates.text_content = updates.content;
    }

    // Handle quiz/assignment/attachment specific data
    if (updates.type && ['quiz', 'assignment', 'attachment'].includes(updates.type)) {
      dbUpdates.interactive_content = {
        module_type: updates.type,
        quiz_passing_score: updates.quiz_passing_score,
        quiz_time_limit: updates.quiz_time_limit,
        quiz_max_attempts: updates.quiz_max_attempts,
        quiz_questions: updates.quiz_questions,
        assignment_due_date: updates.assignment_due_date,
        assignment_max_score: updates.assignment_max_score,
        assignment_submission_type: updates.assignment_submission_type,
        assignment_instructions: updates.assignment_instructions,
        attachment_url: updates.attachment_url,
        attachment_type: updates.attachment_type,
        attachment_is_downloadable: updates.attachment_is_downloadable
      };
    }

    // Handle attachment URL for video_url field if type is attachment
    if (updates.type === 'attachment' && updates.attachment_url) {
      dbUpdates.video_url = updates.attachment_url;
    }

    // Check slug uniqueness if being updated
    if (updates.slug && updates.slug !== module.slug) {
      const exists = await moduleRepository.slugExists(module.lesson_id, updates.slug, id);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'A module with this slug already exists in this lesson'
        });
      }
      dbUpdates.slug = updates.slug;
    }

    const updatedModule = await moduleRepository.update(id, dbUpdates);

    res.json({
      success: true,
      message: 'Module updated successfully',
      data: updatedModule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a module
 */
exports.deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const module = await moduleRepository.findById(id);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    await moduleRepository.delete(id);

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle module publish status
 */
exports.togglePublishStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    const module = await moduleRepository.findById(id);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const updatedModule = await moduleRepository.togglePublish(id, is_published);

    res.json({
      success: true,
      message: `Module ${is_published ? 'published' : 'unpublished'} successfully`,
      data: updatedModule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder modules within a lesson
 */
exports.reorderModules = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { modules } = req.body;

    if (!Array.isArray(modules)) {
      return res.status(400).json({
        success: false,
        message: 'Modules must be an array'
      });
    }

    await moduleRepository.reorder(lessonId, modules);

    res.json({
      success: true,
      message: 'Modules reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate a module
 */
exports.duplicateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const module = await moduleRepository.findById(id);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const duplicatedModule = await moduleRepository.duplicate(id, title);

    res.status(201).json({
      success: true,
      message: 'Module duplicated successfully',
      data: duplicatedModule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get module statistics for a lesson
 */
exports.getModuleStatistics = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const stats = await moduleRepository.getStatistics(lessonId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search modules within a lesson
 */
exports.searchModules = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { q, page, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const result = await moduleRepository.search(lessonId, q, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get modules with attachments
 */
exports.getModulesWithAttachments = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const modules = await moduleRepository.findWithAttachments(lessonId);

    res.json({
      success: true,
      data: modules
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get module version history
 */
exports.getModuleVersions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const module = await moduleRepository.findById(id);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const versions = await moduleRepository.findVersionHistory(id);

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create modules
 */
exports.bulkCreateModules = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { modules } = req.body;

    if (!Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Modules array is required and must not be empty'
      });
    }

    const createdModules = await moduleRepository.bulkCreate(lessonId, modules);

    res.status(201).json({
      success: true,
      message: `${createdModules.length} modules created successfully`,
      data: createdModules
    });
  } catch (error) {
    next(error);
  }
};
