/**
 * Widget Config Repository
 * Handles database operations for widget configurations
 */

const knex = require('../../../config/knex');

class WidgetConfigRepository {
  /**
   * Get active widget configuration
   */
  async getActive() {
    return await knex('ai_widget_configs')
      .where('is_active', true)
      .first();
  }

  /**
   * Get all widget configurations
   */
  async findAll() {
    return await knex('ai_widget_configs')
      .orderBy('created_at', 'desc');
  }

  /**
   * Find widget config by ID
   */
  async findById(id) {
    return await knex('ai_widget_configs')
      .where('id', id)
      .first();
  }

  /**
   * Find widget config by name
   */
  async findByName(name) {
    return await knex('ai_widget_configs')
      .where('name', name)
      .first();
  }

  /**
   * Create new widget configuration
   */
  async create(configData) {
    const { name, config, description, is_active } = configData;

    // If setting as active, deactivate all others first
    if (is_active) {
      await knex('ai_widget_configs')
        .update({ is_active: false });
    }

    const [created] = await knex('ai_widget_configs')
      .insert({
        name,
        config: JSON.stringify(config),
        description,
        is_active: is_active || false,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('*');

    return created;
  }

  /**
   * Update widget configuration
   */
  async update(id, configData) {
    const { name, config, description, is_active } = configData;
    const updateData = {
      updated_at: knex.fn.now()
    };

    if (name !== undefined) updateData.name = name;
    if (config !== undefined) updateData.config = JSON.stringify(config);
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) {
      updateData.is_active = is_active;
      // If setting as active, deactivate all others first
      if (is_active) {
        await knex('ai_widget_configs')
          .where('id', '!=', id)
          .update({ is_active: false });
      }
    }

    await knex('ai_widget_configs')
      .where('id', id)
      .update(updateData);

    return await this.findById(id);
  }

  /**
   * Activate a widget configuration
   */
  async activate(id) {
    // Deactivate all others
    await knex('ai_widget_configs')
      .update({ is_active: false });

    // Activate this one
    await knex('ai_widget_configs')
      .where('id', id)
      .update({ is_active: true, updated_at: knex.fn.now() });

    return await this.findById(id);
  }

  /**
   * Delete widget configuration
   */
  async delete(id) {
    return await knex('ai_widget_configs')
      .where('id', id)
      .del();
  }
}

module.exports = new WidgetConfigRepository();
