/**
 * Quiz Controller
 * Handles quiz submission and validation
 */

const moduleRepository = require('../repositories/moduleRepository');
const progressController = require('./progressController');
const knex = require('../../../config/knex');

/**
 * Submit quiz answers for validation
 */
exports.submitQuiz = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { answers } = req.body;
    const userId = req.user?.userId;

    // Validate request
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Answers object is required'
      });
    }

    // Get the module with quiz data
    const module = await moduleRepository.findById(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Verify this is a quiz module
    if (!module.interactive_content?.module_type === 'quiz' || !module.interactive_content?.quiz_questions) {
      return res.status(400).json({
        success: false,
        message: 'This module is not a quiz'
      });
    }

    const quizQuestions = module.interactive_content.quiz_questions;
    const passingScore = module.interactive_content.quiz_passing_score || 70;
    const timeLimit = module.interactive_content.quiz_time_limit;

    // Calculate score
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const results = [];

    quizQuestions.forEach((question) => {
      const userAnswer = answers[question.id];
      const points = question.points || 1;
      totalPoints += points;

      let isCorrect = false;
      let correctAnswer = null;

      // Check answer based on question type
      if (question.type === 'multiple_choice') {
        // Find the correct answer index from options
        const correctIndex = question.options?.findIndex((opt) => {
          if (typeof opt === 'object' && 'isCorrect' in opt) {
            return opt.isCorrect === true;
          }
          return false;
        });

        isCorrect = userAnswer === correctIndex;
        correctAnswer = correctIndex;
      } else if (question.type === 'true_false') {
        correctAnswer = question.correct_answer;
        isCorrect = userAnswer === correctAnswer;
      } else if (question.type === 'short_answer') {
        correctAnswer = question.correct_answer;
        // Case-insensitive comparison for short answer
        isCorrect = userAnswer?.toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
      }

      if (isCorrect) {
        correctCount++;
        earnedPoints += points;
      }

      // Store result for this question
      results.push({
        questionId: question.id,
        isCorrect,
        correctAnswer,
        userAnswer,
        points,
        earnedPoints: isCorrect ? points : 0
      });
    });

    // Calculate percentage score
    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = scorePercentage >= passingScore;

    // Calculate wrong answers count for XP deduction
    const wrongAnswersCount = quizQuestions.length - correctCount;

    // Award or deduct XP based on quiz result
    let xpResult = null;
    if (userId) {
      try {
        const XPService = require('../../xp_system/services/xpService');

        if (passed) {
          // Award XP for passing
          xpResult = await XPService.awardQuizPassXP(userId, moduleId, scorePercentage);
        } else if (wrongAnswersCount > 0) {
          // Deduct XP for wrong answers
          xpResult = await XPService.deductQuizFailXP(userId, moduleId, scorePercentage, wrongAnswersCount);
        }

        if (xpResult && xpResult.userXP.level_up) {
          logger.info(`User ${userId} leveled up to level ${xpResult.userXP.current_level}!`);
        }
      } catch (xpError) {
        // Log error but don't fail the request
        console.error('Error processing quiz XP:', xpError);
      }
    }

    // Store quiz attempt in database (optional - for tracking)
    // Note: Skipping quiz_attempts table for now as it uses quiz_id not module_id
    // TODO: Implement proper quiz tracking with quiz table structure

    // If quiz was passed, automatically mark module as complete and save quiz answers
    if (passed && userId) {
      try {
        console.log('=======================================================');
        console.log(`QUIZ PASSED! Marking module ${moduleId} as complete for user ${userId}`);
        console.log('=======================================================');

        // Save quiz answers in module_progress for future reference
        const quizData = {
          score: scorePercentage,
          passed,
          submittedAt: new Date().toISOString(),
          answers,
          results: results.map(r => ({
            questionId: r.questionId,
            isCorrect: r.isCorrect,
            userAnswer: r.userAnswer,
            correctAnswer: r.correctAnswer
          }))
        };

        console.log('Calling ProgressService.completeModule with quizData:', {
          userId,
          moduleId,
          quizData: {
            score: quizData.score,
            passed: quizData.passed,
            submittedAt: quizData.submittedAt
          }
        });

        const ProgressService = require('../services/progressService');
        const result = await ProgressService.completeModule(userId, moduleId, { quizData });

        console.log('ProgressService.completeModule returned:', result);
        console.log(`=======================================================`);
        console.log(`Module ${moduleId} marked as complete for user ${userId}`);
        console.log(`=======================================================`);
      } catch (error) {
        console.error('=======================================================');
        console.error('ERROR: Could not mark quiz module as complete:', error);
        console.error('Error stack:', error.stack);
        console.error('=======================================================');
        // Don't throw - we still want to return the quiz results
      }
    } else {
      console.log('Quiz completion NOT triggered - passed:', passed, 'userId:', userId);
    }

    // Return results with XP information
    const responseData = {
      score: scorePercentage,
      passed,
      correctCount,
      totalQuestions: quizQuestions.length,
      earnedPoints,
      totalPoints,
      passingScore,
      results
    };

    // Add XP information if available
    if (xpResult) {
      responseData.xp = {
        amount: xpResult.transaction.amount,
        total_xp: xpResult.userXP.total_xp,
        current_level: xpResult.userXP.current_level,
        level_up: xpResult.userXP.level_up
      };
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    next(error);
  }
};

/**
 * Get quiz attempts for a user and module
 */
exports.getQuizAttempts = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      const attempts = await knex('quiz_attempts')
        .where({
          user_id: userId,
          module_id: moduleId
        })
        .orderBy('submitted_at', 'desc')
        .select('id', 'score', 'passed', 'submitted_at');

      res.json({
        success: true,
        data: attempts
      });
    } catch (error) {
      // Table might not exist yet
      res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
