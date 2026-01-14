/**
 * Knowledge Base Repository
 * Handles database operations for knowledge base entries
 */

const knex = require('../../../config/knex');

class KnowledgeBaseRepository {
  /**
   * Get all knowledge base entries with pagination and filters
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, collectionName, search, category } = options;
    const offset = (page - 1) * limit;

    // Build base query for filtering (without select)
    let baseQuery = knex('knowledge_base_entries');

    if (collectionName) {
      baseQuery = baseQuery.where('collection_name', collectionName);
    }

    if (category) {
      baseQuery = baseQuery.where('category', category);
    }

    if (search) {
      baseQuery = baseQuery.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('text', 'ilike', `%${search}%`)
          .orWhere('tags', 'ilike', `%${search}%`);
      });
    }

    // Get total count
    const totalResult = await baseQuery.clone().count('* as count').first();
    const total = parseInt(totalResult.count) || 0;

    // Get paginated entries
    const entries = await baseQuery
      .clone()
      .select('id', 'source_id', 'collection_name', 'title', 'text', 'category', 'status', 'comment', 'tags', 'source', 'last_updated', 'entry_metadata', 'timestamp')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find entry by ID
   */
  async findById(id) {
    return await knex('knowledge_base_entries')
      .select('id', 'source_id', 'collection_name', 'title', 'text', 'category', 'status', 'comment', 'tags', 'source', 'last_updated', 'entry_metadata', 'timestamp')
      .where('id', id)
      .first();
  }

  /**
   * Get all collections with entry counts
   */
  async getCollections() {
    const collections = await knex('knowledge_base_entries')
      .select('collection_name')
      .count('* as entry_count')
      .groupBy('collection_name')
      .orderBy('collection_name');

    return collections;
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    const [totalEntries, collections, categories] = await Promise.all([
      knex('knowledge_base_entries').count('* as count').first(),
      knex('knowledge_base_entries').countDistinct('collection_name as count').first(),
      knex('knowledge_base_entries')
        .select('category')
        .count('* as count')
        .whereNotNull('category')
        .groupBy('category')
        .orderBy('count', 'desc')
        .limit(10)
    ]);

    return {
      total_entries: parseInt(totalEntries.count) || 0,
      total_collections: parseInt(collections.count) || 0,
      top_categories: categories
    };
  }

  /**
   * Delete entry by ID
   */
  async deleteById(id) {
    return await knex('knowledge_base_entries')
      .where('id', id)
      .del();
  }

  /**
   * Delete all entries in a collection
   */
  async deleteByCollection(collectionName) {
    return await knex('knowledge_base_entries')
      .where('collection_name', collectionName)
      .del();
  }

  /**
   * Get entry count for a collection
   */
  async getCollectionCount(collectionName) {
    const result = await knex('knowledge_base_entries')
      .where('collection_name', collectionName)
      .count('* as count')
      .first();
    
    return parseInt(result.count) || 0;
  }
}

module.exports = new KnowledgeBaseRepository();
