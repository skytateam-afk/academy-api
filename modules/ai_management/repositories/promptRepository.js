/**
 * Prompt Repository
 * Handles database operations for AI prompts
 */

const knex = require('../../../config/knex');

class PromptRepository {
  /**
   * Get all prompts grouped by version
   */
  async findAllGroupedByVersion() {
    const prompts = await knex('ai_prompts')
      .orderBy(['version', 'name']);

    // Group by version
    const grouped = {};
    for (const prompt of prompts) {
      if (!grouped[prompt.version]) {
        grouped[prompt.version] = {
          version: prompt.version,
          prompts: [],
          is_active: prompt.is_active
        };
      }
      grouped[prompt.version].prompts.push({
        id: prompt.id,
        name: prompt.name,
        content: prompt.content,
        description: prompt.description,
        is_active: prompt.is_active,
        metadata: prompt.metadata,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at
      });
    }

    return Object.values(grouped);
  }

  /**
   * Get all prompts with pagination
   */
  async findAll(options = {}) {
    const { version, page = 1, limit = 20, search } = options;
    const offset = (page - 1) * limit;

    // Build base query for filtering
    let baseQuery = knex('ai_prompts');

    if (version) {
      baseQuery = baseQuery.where('version', version);
    }

    if (search) {
      baseQuery = baseQuery.where(function() {
        this.where('name', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`)
          .orWhere('version', 'ilike', `%${search}%`);
      });
    }

    // Get total count
    const totalResult = await baseQuery.clone().count('* as count').first();
    const total = parseInt(totalResult.count) || 0;

    // Get paginated prompts
    const prompts = await baseQuery
      .clone()
      .select('*')
      .orderBy(['version', 'name'])
      .limit(limit)
      .offset(offset);

    return {
      prompts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get active prompts by version
   */
  async getActiveByVersion(version) {
    return await knex('ai_prompts')
      .where({ version, is_active: true })
      .orderBy('name');
  }

  /**
   * Find prompt by ID
   */
  async findById(id) {
    return await knex('ai_prompts')
      .where('id', id)
      .first();
  }

  /**
   * Find prompt by version and name
   */
  async findByVersionAndName(version, name) {
    return await knex('ai_prompts')
      .where({ version, name })
      .first();
  }

  /**
   * Get all versions
   */
  async getVersions() {
    const versions = await knex('ai_prompts')
      .select('version')
      .count('* as prompt_count')
      .select(knex.raw('bool_or(is_active) as has_active'))
      .groupBy('version')
      .orderBy('version', 'desc');

    return versions;
  }

  /**
   * Create new prompt
   */
  async create(promptData) {
    const { version, name, content, description, metadata, is_active } = promptData;

    const [result] = await knex('ai_prompts')
      .insert({
        version,
        name,
        content,
        description,
        metadata: metadata ? JSON.stringify(metadata) : '{}',
        is_active: is_active || false,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
      .returning('id');

    // Handle both object and direct id return
    const id = typeof result === 'object' && result !== null ? result.id : result;
    return await this.findById(id);
  }

  /**
   * Update prompt
   */
  async update(id, promptData) {
    const { version, name, content, description, metadata, is_active } = promptData;
    const updateData = {
      updated_at: knex.fn.now()
    };

    if (version !== undefined) updateData.version = version;
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (description !== undefined) updateData.description = description;
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);
    if (is_active !== undefined) updateData.is_active = is_active;

    await knex('ai_prompts')
      .where('id', id)
      .update(updateData);

    return await this.findById(id);
  }

  /**
   * Activate all prompts in a version
   */
  async activateVersion(version) {
    // Deactivate all other versions
    await knex('ai_prompts')
      .update({ is_active: false });

    // Activate this version
    await knex('ai_prompts')
      .where('version', version)
      .update({ is_active: true, updated_at: knex.fn.now() });

    return await this.getActiveByVersion(version);
  }

  /**
   * Delete prompt
   */
  async delete(id) {
    return await knex('ai_prompts')
      .where('id', id)
      .del();
  }
}

module.exports = new PromptRepository();
