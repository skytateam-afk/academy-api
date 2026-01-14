/**
 * Widget Config Controller
 * Handles HTTP requests for widget configuration management
 */

const widgetConfigRepository = require('../repositories/widgetConfigRepository');

class WidgetConfigController {
  /**
   * Get active widget configuration
   */
  async getActive(req, res) {
    try {
      const config = await widgetConfigRepository.getActive();

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'No active widget configuration found'
        });
      }

      // Parse JSON config if it's a string
      const configData = typeof config.config === 'string' 
        ? JSON.parse(config.config) 
        : config.config;

      res.json({
        success: true,
        data: {
          ...config,
          config: configData
        }
      });
    } catch (error) {
      console.error('Error fetching active widget config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch widget configuration',
        error: error.message
      });
    }
  }

  /**
   * Get all widget configurations
   */
  async list(req, res) {
    try {
      const configs = await widgetConfigRepository.findAll();

      // Parse JSON configs
      const configsWithParsed = configs.map(config => ({
        ...config,
        config: typeof config.config === 'string' 
          ? JSON.parse(config.config) 
          : config.config
      }));

      res.json({
        success: true,
        data: configsWithParsed
      });
    } catch (error) {
      console.error('Error listing widget configs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch widget configurations',
        error: error.message
      });
    }
  }

  /**
   * Get widget configuration by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const config = await widgetConfigRepository.findById(id);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Widget configuration not found'
        });
      }

      const configData = typeof config.config === 'string' 
        ? JSON.parse(config.config) 
        : config.config;

      res.json({
        success: true,
        data: {
          ...config,
          config: configData
        }
      });
    } catch (error) {
      console.error('Error fetching widget config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch widget configuration',
        error: error.message
      });
    }
  }

  /**
   * Create new widget configuration
   */
  async create(req, res) {
    try {
      const { name, config, description, is_active } = req.body;

      if (!name || !config) {
        return res.status(400).json({
          success: false,
          message: 'Name and config are required'
        });
      }

      const newConfig = await widgetConfigRepository.create({
        name,
        config,
        description,
        is_active
      });

      const configData = typeof newConfig.config === 'string' 
        ? JSON.parse(newConfig.config) 
        : newConfig.config;

      res.status(201).json({
        success: true,
        data: {
          ...newConfig,
          config: configData
        }
      });
    } catch (error) {
      console.error('Error creating widget config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create widget configuration',
        error: error.message
      });
    }
  }

  /**
   * Update widget configuration
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, config, description, is_active } = req.body;

      const updated = await widgetConfigRepository.update(id, {
        name,
        config,
        description,
        is_active
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Widget configuration not found'
        });
      }

      const configData = typeof updated.config === 'string' 
        ? JSON.parse(updated.config) 
        : updated.config;

      res.json({
        success: true,
        data: {
          ...updated,
          config: configData
        }
      });
    } catch (error) {
      console.error('Error updating widget config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update widget configuration',
        error: error.message
      });
    }
  }

  /**
   * Activate a widget configuration
   */
  async activate(req, res) {
    try {
      const { id } = req.params;

      const activated = await widgetConfigRepository.activate(id);

      if (!activated) {
        return res.status(404).json({
          success: false,
          message: 'Widget configuration not found'
        });
      }

      const configData = typeof activated.config === 'string' 
        ? JSON.parse(activated.config) 
        : activated.config;

      res.json({
        success: true,
        data: {
          ...activated,
          config: configData
        }
      });
    } catch (error) {
      console.error('Error activating widget config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate widget configuration',
        error: error.message
      });
    }
  }

  /**
   * Delete widget configuration
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const deleted = await widgetConfigRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Widget configuration not found'
        });
      }

      res.json({
        success: true,
        message: 'Widget configuration deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting widget config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete widget configuration',
        error: error.message
      });
    }
  }
}

module.exports = new WidgetConfigController();
