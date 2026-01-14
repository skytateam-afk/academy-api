/**
 * Conversation Controller
 * Handles HTTP requests for conversation management
 */

const conversationRepository = require('../repositories/conversationRepository');

class ConversationController {
  /**
   * Get all conversations with pagination and filters
   */
  async list(req, res) {
    try {
      const { page, limit, userId, search, startDate, endDate } = req.query;
      
      const result = await conversationRepository.findAll({
        page,
        limit,
        userId,
        search,
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: result.sessions,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error listing conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: error.message
      });
    }
  }

  /**
   * Get a single conversation with all messages
   */
  async getById(req, res) {
    try {
      const { sessionId } = req.params;
      
      const conversation = await conversationRepository.getConversationWithMessages(sessionId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation',
        error: error.message
      });
    }
  }

  /**
   * Delete a conversation
   */
  async delete(req, res) {
    try {
      const { sessionId } = req.params;
      
      const deleted = await conversationRepository.deleteBySessionId(sessionId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete conversation',
        error: error.message
      });
    }
  }

  /**
   * Get conversation analytics
   */
  async getAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const analytics = await conversationRepository.getAnalytics({
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  }
}

module.exports = new ConversationController();
