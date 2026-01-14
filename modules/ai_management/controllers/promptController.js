/**
 * Prompt Controller
 * Handles HTTP requests for prompt management
 */

const promptRepository = require('../repositories/promptRepository');

class PromptController {
  /**
   * Get all prompts grouped by version
   */
  async list(req, res) {
    try {
      const { grouped = 'false' } = req.query;
      
      if (grouped === 'true') {
        const groupedData = await promptRepository.findAllGroupedByVersion();
        res.json({
          success: true,
          data: groupedData
        });
      } else {
        // Return paginated list
        const { page, limit, version, search } = req.query;
        const result = await promptRepository.findAll({
          page,
          limit,
          version,
          search
        });

        res.json({
          success: true,
          data: result.prompts,
          pagination: result.pagination
        });
      }
    } catch (error) {
      console.error('Error listing prompts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prompts',
        error: error.message
      });
    }
  }

  /**
   * Get all versions
   */
  async getVersions(req, res) {
    try {
      const versions = await promptRepository.getVersions();

      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      console.error('Error fetching versions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prompt versions',
        error: error.message
      });
    }
  }

  /**
   * Get prompts by version
   */
  async getByVersion(req, res) {
    try {
      const { version } = req.params;
      const { active_only } = req.query;
      
      // If active_only is requested, use the specific method
      if (active_only === 'true') {
        const prompts = await promptRepository.getActiveByVersion(version);
        return res.json({
          success: true,
          data: prompts
        });
      }
      
      const result = await promptRepository.findAll({ version });
      
      // Return prompts array (not pagination object) for backward compatibility
      res.json({
        success: true,
        data: result.prompts || result
      });
    } catch (error) {
      console.error('Error fetching prompts by version:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prompts',
        error: error.message
      });
    }
  }

  /**
   * Get a specific prompt by version and name
   */
  async getByVersionAndName(req, res) {
    try {
      const { version, name } = req.params;
      
      const prompt = await promptRepository.findByVersionAndName(version, name);

      if (!prompt) {
        return res.status(404).json({
          success: false,
          message: 'Prompt not found'
        });
      }

      res.json({
        success: true,
        data: prompt
      });
    } catch (error) {
      console.error('Error fetching prompt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prompt',
        error: error.message
      });
    }
  }

  /**
   * Get a prompt by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const prompt = await promptRepository.findById(id);

      if (!prompt) {
        return res.status(404).json({
          success: false,
          message: 'Prompt not found'
        });
      }

      res.json({
        success: true,
        data: prompt
      });
    } catch (error) {
      console.error('Error fetching prompt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prompt',
        error: error.message
      });
    }
  }

  /**
   * Create new prompt
   */
  async create(req, res) {
    try {
      const { version, name, content, description, metadata, is_active } = req.body;

      if (!version || !name || !content) {
        return res.status(400).json({
          success: false,
          message: 'Version, name, and content are required'
        });
      }

      // Check if prompt with same version and name already exists
      const existing = await promptRepository.findByVersionAndName(version, name);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Prompt with this version and name already exists'
        });
      }

      const prompt = await promptRepository.create({
        version,
        name,
        content,
        description,
        metadata,
        is_active
      });

      res.status(201).json({
        success: true,
        data: prompt
      });
    } catch (error) {
      console.error('Error creating prompt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create prompt',
        error: error.message
      });
    }
  }

  /**
   * Update prompt
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { version, name, content, description, metadata, is_active } = req.body;

      const updated = await promptRepository.update(id, {
        version,
        name,
        content,
        description,
        metadata,
        is_active
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Prompt not found'
        });
      }

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      console.error('Error updating prompt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update prompt',
        error: error.message
      });
    }
  }

  /**
   * Activate a version (all prompts in that version)
   */
  async activateVersion(req, res) {
    try {
      const { version } = req.params;

      const prompts = await promptRepository.activateVersion(version);

      res.json({
        success: true,
        message: `Version ${version} activated successfully`,
        data: prompts
      });
    } catch (error) {
      console.error('Error activating version:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate version',
        error: error.message
      });
    }
  }

  /**
   * Delete prompt
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const deleted = await promptRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Prompt not found'
        });
      }

      res.json({
        success: true,
        message: 'Prompt deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting prompt:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete prompt',
        error: error.message
      });
    }
  }
}

module.exports = new PromptController();
