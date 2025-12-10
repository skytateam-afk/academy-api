const knex = require('../../../config/knex');

class DocumentRepository {
  /**
   * Create a new document
   */
  async create(documentData) {
    const [document] = await knex('documents')
      .insert(documentData)
      .returning('*');
    return document;
  }

  /**
   * Get document by ID
   */
  async findById(documentId) {
    const document = await knex('documents')
      .where({ id: documentId })
      .first();
    return document;
  }

  /**
   * Get document with owner info
   */
  async findByIdWithOwner(documentId) {
    const document = await knex('documents')
      .select(
        'documents.*',
        'users.username as owner_username',
        'users.first_name as owner_first_name',
        'users.last_name as owner_last_name',
        'users.avatar_url as owner_avatar'
      )
      .leftJoin('users', 'documents.user_id', 'users.id')
      .where('documents.id', documentId)
      .first();
    return document;
  }

  /**
   * Get all documents for a user
   */
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 20, folderId, fileType, search, sortBy = 'created_at', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    let query = knex('documents')
      .where({ user_id: userId })
      .whereNull('deleted_at'); // Only non-deleted documents

    // Filter by folder
    if (folderId !== undefined) {
      if (folderId === null) {
        query = query.whereNull('folder_id');
      } else {
        query = query.where({ folder_id: folderId });
      }
    }

    // Filter by file type
    if (fileType) {
      query = query.where('file_type', 'like', `%${fileType}%`);
    }

    // Search
    if (search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`)
          .orWhere('file_name', 'ilike', `%${search}%`);
      });
    }

    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count);

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Pagination
    query = query.limit(limit).offset(offset);

    const documents = await query;

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Search documents globally (with advanced filters)
   */
  async search(userId, searchOptions = {}) {
    const {
      query: searchQuery,
      fileType,
      tags,
      folderId,
      dateFrom,
      dateTo,
      minSize,
      maxSize,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = searchOptions;

    const offset = (page - 1) * limit;

    let query = knex('documents')
      .where({ user_id: userId });

    // Search query
    if (searchQuery) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${searchQuery}%`)
          .orWhere('description', 'ilike', `%${searchQuery}%`)
          .orWhere('file_name', 'ilike', `%${searchQuery}%`);
      });
    }

    // File type filter
    if (fileType) {
      query = query.where('file_type', 'like', `%${fileType}%`);
    }

    // Tags filter
    if (tags && tags.length > 0) {
      query = query.whereRaw('tags && ?', [tags]);
    }

    // Folder filter
    if (folderId) {
      query = query.where({ folder_id: folderId });
    }

    // Date range
    if (dateFrom) {
      query = query.where('created_at', '>=', dateFrom);
    }
    if (dateTo) {
      query = query.where('created_at', '<=', dateTo);
    }

    // File size range
    if (minSize) {
      query = query.where('file_size', '>=', minSize);
    }
    if (maxSize) {
      query = query.where('file_size', '<=', maxSize);
    }

    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count);

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Pagination
    query = query.limit(limit).offset(offset);

    const documents = await query;

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update document
   */
  async update(documentId, updates) {
    const [document] = await knex('documents')
      .where({ id: documentId })
      .update({
        ...updates,
        updated_at: knex.fn.now()
      })
      .returning('*');
    return document;
  }

  /**
   * Delete document (hard delete)
   */
  async delete(documentId) {
    await knex('documents')
      .where({ id: documentId })
      .del();
  }

  /**
   * Soft delete document (move to trash)
   */
  async softDelete(documentId) {
    const [document] = await knex('documents')
      .where({ id: documentId })
      .update({
        deleted_at: knex.fn.now()
      })
      .returning('*');
    return document;
  }

  /**
   * Bulk soft delete documents
   */
  async bulkSoftDelete(documentIds) {
    const documents = await knex('documents')
      .whereIn('id', documentIds)
      .update({
        deleted_at: knex.fn.now()
      })
      .returning('*');
    return documents;
  }

  /**
   * Get trash documents for user
   */
  async getTrash(userId, options = {}) {
    const { page = 1, limit = 20, sortBy = 'deleted_at', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    let query = knex('documents')
      .where({ user_id: userId })
      .whereNotNull('deleted_at');

    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count);

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Pagination
    query = query.limit(limit).offset(offset);

    const documents = await query;

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Restore document from trash
   */
  async restore(documentId) {
    const [document] = await knex('documents')
      .where({ id: documentId })
      .update({
        deleted_at: null
      })
      .returning('*');
    return document;
  }

  /**
   * Bulk restore documents from trash
   */
  async bulkRestore(documentIds) {
    const documents = await knex('documents')
      .whereIn('id', documentIds)
      .update({
        deleted_at: null
      })
      .returning('*');
    return documents;
  }

  /**
   * Permanently delete document (hard delete)
   */
  async permanentDelete(documentId) {
    await knex('documents')
      .where({ id: documentId })
      .del();
  }

  /**
   * Bulk permanently delete documents
   */
  async bulkPermanentDelete(documentIds) {
    await knex('documents')
      .whereIn('id', documentIds)
      .del();
  }

  /**
   * Auto-purge old deleted documents (older than specified days)
   */
  async autoPurgeOldDeleted(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deletedDocuments = await knex('documents')
      .whereNotNull('deleted_at')
      .where('deleted_at', '<', cutoffDate)
      .select('*');

    await knex('documents')
      .whereNotNull('deleted_at')
      .where('deleted_at', '<', cutoffDate)
      .del();

    return deletedDocuments;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(documentId) {
    await knex('documents')
      .where({ id: documentId })
      .increment('view_count', 1);
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(documentId) {
    await knex('documents')
      .where({ id: documentId })
      .increment('download_count', 1);
  }

  /**
   * Get recent documents for user
   */
  async getRecentDocuments(userId, limit = 10) {
    const documents = await knex('documents')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit);
    return documents;
  }

  /**
   * Get popular documents for user
   */
  async getPopularDocuments(userId, limit = 10) {
    const documents = await knex('documents')
      .where({ user_id: userId })
      .orderBy('view_count', 'desc')
      .limit(limit);
    return documents;
  }

  /**
   * Get documents by folder path
   */
  async getDocumentsByFolderPath(userId, folderPath) {
    // This would require a recursive query or multiple queries
    // For now, return documents in a specific folder
    const documents = await knex('documents')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    return documents;
  }

  /**
   * Get total file size for user (excluding deleted)
   */
  async getTotalFileSize(userId) {
    const result = await knex('documents')
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .sum('file_size as total')
      .first();
    return parseInt(result.total) || 0;
  }

  /**
   * Get document count for user (excluding deleted)
   */
  async getDocumentCount(userId) {
    const result = await knex('documents')
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .count('* as count')
      .first();
    return parseInt(result.count);
  }

  /**
   * Get file type statistics
   */
  async getFileTypeStats(userId) {
    const stats = await knex('documents')
      .select('file_type')
      .count('* as count')
      .sum('file_size as total_size')
      .where({ user_id: userId })
      .groupBy('file_type')
      .orderBy('count', 'desc');
    return stats;
  }
}

module.exports = new DocumentRepository();
