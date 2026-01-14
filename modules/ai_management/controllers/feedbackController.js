/**
 * Feedback Controller
 * Handles HTTP requests for feedback management
 */

const feedbackRepository = require('../repositories/feedbackRepository');

class FeedbackController {
  /**
   * Get all feedback with pagination and filters
   */
  async list(req, res) {
    try {
      const { page, limit, feedbackType, rating, startDate, endDate, search } = req.query;
      
      const result = await feedbackRepository.findAll({
        page,
        limit,
        feedbackType,
        rating,
        startDate,
        endDate,
        search
      });

      res.json({
        success: true,
        data: result.feedbacks,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error listing feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        error: error.message
      });
    }
  }

  /**
   * Get a single feedback by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const feedback = await feedbackRepository.findById(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback',
        error: error.message
      });
    }
  }

  /**
   * Delete feedback by ID
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await feedbackRepository.deleteById(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      res.json({
        success: true,
        message: 'Feedback deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete feedback',
        error: error.message
      });
    }
  }

  /**
   * Get feedback analytics
   */
  async getAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const analytics = await feedbackRepository.getAnalytics({
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching feedback analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback analytics',
        error: error.message
      });
    }
  }
}

module.exports = new FeedbackController();
