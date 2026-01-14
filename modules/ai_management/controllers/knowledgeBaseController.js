/**
 * Knowledge Base Controller
 * Handles HTTP requests for knowledge base management
 */

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const knowledgeBaseRepository = require('../repositories/knowledgeBaseRepository');
const ingestionService = require('../services/ingestionService');
const progressTracker = require('../services/progressTracker');

class KnowledgeBaseController {
  /**
   * Get all knowledge base entries with pagination and filters
   */
  async list(req, res) {
    try {
      const { page, limit, collectionName, search, category } = req.query;
      
      const result = await knowledgeBaseRepository.findAll({
        page,
        limit,
        collectionName,
        search,
        category
      });

      res.json({
        success: true,
        data: result.entries,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error listing knowledge base entries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch knowledge base entries',
        error: error.message
      });
    }
  }

  /**
   * Get entry by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const entry = await knowledgeBaseRepository.findById(id);

      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Knowledge base entry not found'
        });
      }

      res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      console.error('Error fetching knowledge base entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch knowledge base entry',
        error: error.message
      });
    }
  }

  /**
   * Get all collections
   */
  async getCollections(req, res) {
    try {
      const collections = await knowledgeBaseRepository.getCollections();

      res.json({
        success: true,
        data: collections
      });
    } catch (error) {
      console.error('Error fetching collections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch collections',
        error: error.message
      });
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getStats(req, res) {
    try {
      const stats = await knowledgeBaseRepository.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching knowledge base stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  /**
   * Ingest CSV file into knowledge base
   */
  async ingest(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required'
        });
      }

      const { collectionName, fresh } = req.body;

      if (!collectionName) {
        return res.status(400).json({
          success: false,
          message: 'Collection name is required'
        });
      }

      // Generate job ID for progress tracking
      const jobId = uuidv4();

      // Start ingestion asynchronously
      ingestionService.ingestCsvFile(
        req.file.path,
        collectionName,
        fresh === 'true',
        jobId
      ).catch((error) => {
        console.error('Background ingestion error:', error);
        progressTracker.failProgress(jobId, error.message);
      });

      // Return job ID immediately
      res.json({
        success: true,
        message: 'Ingestion started',
        jobId: jobId,
      });

      // Note: File cleanup will happen in the background task
    } catch (error) {
      // Clean up uploaded file on error
      try {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }

      console.error('Error starting ingestion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start ingestion',
        error: error.message
      });
    }
  }

  /**
   * Get ingestion progress
   */
  async getProgress(req, res) {
    try {
      const { jobId } = req.params;

      const progress = progressTracker.getProgress(jobId);

      if (!progress) {
        return res.status(404).json({
          success: false,
          message: 'Job not found or expired'
        });
      }

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error getting progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get progress',
        error: error.message
      });
    }
  }

  /**
   * Delete knowledge base entry
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const deleted = await knowledgeBaseRepository.deleteById(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Knowledge base entry not found'
        });
      }

      res.json({
        success: true,
        message: 'Knowledge base entry deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting knowledge base entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete knowledge base entry',
        error: error.message
      });
    }
  }

  /**
   * Clear collection
   */
  async clearCollection(req, res) {
    try {
      const { collectionName } = req.params;

      const deleted = await knowledgeBaseRepository.deleteByCollection(collectionName);

      res.json({
        success: true,
        message: `Collection '${collectionName}' cleared successfully`,
        data: {
          entries_deleted: deleted
        }
      });
    } catch (error) {
      console.error('Error clearing collection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear collection',
        error: error.message
      });
    }
  }
}

module.exports = new KnowledgeBaseController();
