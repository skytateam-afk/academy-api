const knex = require('../../../config/knex');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

class ShareRepository {
  /**
   * Create a new share
   */
  async create(shareData) {
    const [share] = await knex('document_shares')
      .insert(shareData)
      .returning('*');
    return share;
  }

  /**
   * Get share by ID
   */
  async findById(shareId) {
    const share = await knex('document_shares')
      .where({ id: shareId })
      .first();
    return share;
  }

  /**
   * Get share by access token
   */
  async findByToken(accessToken) {
    const share = await knex('document_shares')
      .where({ access_token: accessToken })
      .first();
    return share;
  }

  /**
   * Get all shares for a document
   */
  async findByDocumentId(documentId) {
    const shares = await knex('document_shares')
      .select(
        'document_shares.*',
        'users.username as shared_with_username',
        'users.first_name as shared_with_first_name',
        'users.last_name as shared_with_last_name'
      )
      .leftJoin('users', 'document_shares.shared_with_user_id', 'users.id')
      .where('document_shares.document_id', documentId)
      .orderBy('document_shares.created_at', 'desc');

    // Add computed fields for is_active and is_expired
    return shares.map(share => {
      const isExpired = share.expires_at ? new Date(share.expires_at) < new Date() : false;
      const hasReachedLimit = share.max_downloads ? share.download_count >= share.max_downloads : false;

      return {
        ...share,
        is_expired: isExpired,
        is_active: !isExpired && !hasReachedLimit
      };
    });
  }

  /**
   * Get documents shared with a user
   */
  async getSharedWithUser(userId) {
    const documents = await knex('document_shares')
      .select(
        'documents.*',
        'document_shares.permission_level',
        'document_shares.created_at as shared_at',
        'users.username as owner_username',
        'users.first_name as owner_first_name',
        'users.last_name as owner_last_name'
      )
      .join('documents', 'document_shares.document_id', 'documents.id')
      .join('users', 'documents.user_id', 'users.id')
      .where('document_shares.shared_with_user_id', userId)
      .orderBy('document_shares.created_at', 'desc');
    return documents;
  }

  /**
   * Get documents shared by a user
   */
  async getSharedByUser(userId) {
    const shares = await knex('document_shares')
      .select(
        'document_shares.*',
        'documents.title as document_title',
        'documents.file_name',
        'documents.file_type',
        'users.username as shared_with_username',
        'users.first_name as shared_with_first_name',
        'users.last_name as shared_with_last_name'
      )
      .join('documents', 'document_shares.document_id', 'documents.id')
      .leftJoin('users', 'document_shares.shared_with_user_id', 'users.id')
      .where('document_shares.shared_by', userId)
      .orderBy('document_shares.created_at', 'desc');

    // Add computed fields
    return shares.map(share => {
      const isExpired = share.expires_at ? new Date(share.expires_at) < new Date() : false;
      const hasReachedLimit = share.max_downloads ? share.download_count >= share.max_downloads : false;

      return {
        ...share,
        is_expired: isExpired,
        is_active: !isExpired && !hasReachedLimit
      };
    });
  }

  /**
   * Delete share
   */
  async delete(shareId) {
    await knex('document_shares')
      .where({ id: shareId })
      .del();
  }

  /**
   * Delete all shares for a document
   */
  async deleteByDocumentId(documentId) {
    await knex('document_shares')
      .where({ document_id: documentId })
      .del();
  }

  /**
   * Increment download count for share
   */
  async incrementDownloadCount(shareId) {
    await knex('document_shares')
      .where({ id: shareId })
      .increment('download_count', 1);
  }

  /**
   * Check if share is expired
   */
  isExpired(share) {
    if (!share.expires_at) return false;
    return new Date(share.expires_at) < new Date();
  }

  /**
   * Check if share has reached download limit
   */
  hasReachedDownloadLimit(share) {
    if (!share.max_downloads) return false;
    return share.download_count >= share.max_downloads;
  }

  /**
   * Verify password for password-protected share
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate unique access token
   */
  generateAccessToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash password for share
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Check if user has access to document
   */
  async checkUserAccess(documentId, userId) {
    const share = await knex('document_shares')
      .where({
        document_id: documentId,
        shared_with_user_id: userId
      })
      .first();
    return share;
  }

  /**
   * Update share
   */
  async update(shareId, updates) {
    const [share] = await knex('document_shares')
      .where({ id: shareId })
      .update(updates)
      .returning('*');
    return share;
  }
}

module.exports = new ShareRepository();
