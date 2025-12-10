/**
 * Contact Management Controller
 * Handles HTTP requests for contact submissions
 */

const contactService = require('./contact.service');
const logger = require('../../config/winston');

class ContactController {
  /**
   * Submit contact form (PUBLIC)
   * POST /api/contact/submit
   */
  async submitContact(req, res) {
    try {
      const { name, email, phone, subject, message } = req.body;

      // Get metadata
      const metadata = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      const submission = await contactService.submitContact(
        { name, email, phone, subject, message },
        metadata
      );

      logger.info(`Contact form submitted: ${email}`, {
        submissionId: submission.id,
        email: submission.email,
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon.',
        data: {
          id: submission.id,
          created_at: submission.created_at,
        },
      });
    } catch (error) {
      logger.error('Error submitting contact form:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit contact form',
      });
    }
  }

  /**
   * List all submissions (ADMIN)
   * GET /api/contact/submissions
   */
  async listSubmissions(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        query,
        sortBy = 'created_at',
        sortOrder = 'DESC',
      } = req.query;

      const result = await contactService.listSubmissions({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        query,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error listing contact submissions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch contact submissions',
      });
    }
  }

  /**
   * Get single submission (ADMIN)
   * GET /api/contact/submissions/:id
   */
  async getSubmission(req, res) {
    try {
      const { id } = req.params;

      const submission = await contactService.getSubmissionById(parseInt(id));

      res.json({
        success: true,
        data: submission,
      });
    } catch (error) {
      logger.error('Error fetching contact submission:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch contact submission',
      });
    }
  }

  /**
   * Update submission (ADMIN)
   * PUT /api/contact/submissions/:id
   */
  async updateSubmission(req, res) {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;
      const userId = req.user.id;

      const submission = await contactService.updateSubmission(
        parseInt(id),
        { status, admin_notes },
        userId
      );

      logger.info(`Contact submission updated: ${id}`, {
        submissionId: id,
        status,
        updatedBy: userId,
      });

      res.json({
        success: true,
        message: 'Contact submission updated successfully',
        data: submission,
      });
    } catch (error) {
      logger.error('Error updating contact submission:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to update contact submission',
      });
    }
  }

  /**
   * Mark as read (ADMIN)
   * PATCH /api/contact/submissions/:id/read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;

      const submission = await contactService.markAsRead(parseInt(id));

      res.json({
        success: true,
        message: 'Marked as read',
        data: submission,
      });
    } catch (error) {
      logger.error('Error marking submission as read:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to mark as read',
      });
    }
  }

  /**
   * Mark as unread (ADMIN)
   * PATCH /api/contact/submissions/:id/unread
   */
  async markAsUnread(req, res) {
    try {
      const { id } = req.params;

      const submission = await contactService.markAsUnread(parseInt(id));

      res.json({
        success: true,
        message: 'Marked as unread',
        data: submission,
      });
    } catch (error) {
      logger.error('Error marking submission as unread:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to mark as unread',
      });
    }
  }

  /**
   * Delete submission (ADMIN)
   * DELETE /api/contact/submissions/:id
   */
  async deleteSubmission(req, res) {
    try {
      const { id } = req.params;

      await contactService.deleteSubmission(parseInt(id));

      logger.info(`Contact submission deleted: ${id}`, {
        submissionId: id,
        deletedBy: req.user.id,
      });

      res.json({
        success: true,
        message: 'Contact submission deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting contact submission:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to delete contact submission',
      });
    }
  }

  /**
   * Get statistics (ADMIN)
   * GET /api/contact/statistics
   */
  async getStatistics(req, res) {
    try {
      const stats = await contactService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching contact statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch statistics',
      });
    }
  }
}

module.exports = new ContactController();
