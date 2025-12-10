const knex = require('../../../config/knex');

class StorageRepository {
  /**
   * Get or create user storage record
   */
  async getOrCreate(userId) {
    let storage = await knex('user_storage')
      .where({ user_id: userId })
      .first();

    if (!storage) {
      [storage] = await knex('user_storage')
        .insert({
          user_id: userId,
          used_bytes: 0,
          quota_bytes: 52428800 // 50MB default
        })
        .returning('*');
    }

    return storage;
  }

  /**
   * Get user storage info
   */
  async findByUserId(userId) {
    const storage = await knex('user_storage')
      .where({ user_id: userId })
      .first();
    return storage;
  }

  /**
   * Update used storage
   */
  async updateUsedStorage(userId, usedBytes) {
    const [storage] = await knex('user_storage')
      .where({ user_id: userId })
      .update({
        used_bytes: usedBytes,
        updated_at: knex.fn.now()
      })
      .returning('*');
    return storage;
  }

  /**
   * Increment used storage
   */
  async incrementUsedStorage(userId, bytes) {
    await knex('user_storage')
      .where({ user_id: userId })
      .increment('used_bytes', bytes)
      .update({ updated_at: knex.fn.now() });
  }

  /**
   * Decrement used storage
   */
  async decrementUsedStorage(userId, bytes) {
    await knex('user_storage')
      .where({ user_id: userId })
      .decrement('used_bytes', bytes)
      .update({ updated_at: knex.fn.now() });
  }

  /**
   * Update quota
   */
  async updateQuota(userId, quotaBytes) {
    // Ensure record exists
    await this.getOrCreate(userId);

    const [storage] = await knex('user_storage')
      .where({ user_id: userId })
      .update({
        quota_bytes: quotaBytes,
        updated_at: knex.fn.now()
      })
      .returning('*');
    return storage;
  }

  /**
   * Check if user has enough storage
   */
  async hasEnoughStorage(userId, requiredBytes) {
    const storage = await this.getOrCreate(userId);

    // Check for unlimited quota (-1)
    if (storage.quota_bytes === -1) {
      return true;
    }

    const availableBytes = storage.quota_bytes - storage.used_bytes;
    return availableBytes >= requiredBytes;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(userId) {
    const storage = await this.getOrCreate(userId);

    // Convert string values to numbers (PostgreSQL returns bigint as strings)
    const usedBytes = parseInt(storage.used_bytes) || 0;
    const quotaBytes = parseInt(storage.quota_bytes) || 0;

    // Self-healing: If used is 0, check if we actually have documents
    // This fixes issues where storage wasn't incremented correctly (e.g. due to previous bugs)
    if (usedBytes == 0) {
      const hasDocs = await knex('documents').where({ user_id: userId }).whereNull('deleted_at').first();
      if (hasDocs) {
        // We have docs but 0 usage? Recalculate!
        const correctedUsage = await this.recalculateUsedStorage(userId);
        return {
          used: correctedUsage,
          quota: quotaBytes,
          available: quotaBytes - correctedUsage,
          usagePercent: (correctedUsage / quotaBytes) * 100
        };
      }
    }

    // Handle unlimited quota
    if (quotaBytes === -1) {
      return {
        used: usedBytes,
        quota: -1,
        available: -1, // Indicates unlimited
        usagePercent: 0 // Or maybe a small number to show some bar? 0 is safer for now
      };
    }

    return {
      used: usedBytes,
      quota: quotaBytes,
      available: quotaBytes - usedBytes,
      usagePercent: (usedBytes / quotaBytes) * 100
    };
  }

  /**
   * Recalculate used storage from documents
   */
  async recalculateUsedStorage(userId) {
    const result = await knex('documents')
      .where({ user_id: userId })
      .whereNull('deleted_at') // Exclude soft-deleted documents
      .sum('file_size as total')
      .first();

    const totalUsed = parseInt(result.total) || 0;

    await this.updateUsedStorage(userId, totalUsed);

    return totalUsed;
  }

  /**
   * Get all users with storage usage
   */
  async getAllUsersStorage(options = {}) {
    const { page = 1, limit = 20, sortBy = 'used_bytes', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    let query = knex('user_storage')
      .select(
        'user_storage.*',
        'users.username',
        'users.email',
        'users.first_name',
        'users.last_name'
      )
      .join('users', 'user_storage.user_id', 'users.id');

    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count);

    // Apply sorting and pagination
    query = query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    const storages = await query;

    return {
      storages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get users approaching quota
   */
  async getUsersApproachingQuota(threshold = 0.9) {
    const users = await knex('user_storage')
      .select(
        'user_storage.*',
        'users.username',
        'users.email',
        'users.first_name',
        'users.last_name'
      )
      .join('users', 'user_storage.user_id', 'users.id')
      .whereRaw('used_bytes >= quota_bytes * ?', [threshold])
      .orderBy('used_bytes', 'desc');

    return users;
  }

  /**
   * Get users over quota
   */
  async getUsersOverQuota() {
    const users = await knex('user_storage')
      .select(
        'user_storage.*',
        'users.username',
        'users.email',
        'users.first_name',
        'users.last_name'
      )
      .join('users', 'user_storage.user_id', 'users.id')
      .whereRaw('used_bytes > quota_bytes')
      .orderBy('used_bytes', 'desc');

    return users;
  }
}

module.exports = new StorageRepository();
