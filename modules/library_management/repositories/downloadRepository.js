/**
 * Library Download Repository
 * Handles unique download tracking per user-item pair
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class LibraryDownloadRepository {
  /**
   * Record a download for a user-item pair
   * Creates new record if first time, or increments count if existing
   */
  async recordDownload(userId, itemId) {
    try {
      // Check if user has already downloaded this item
      const existingDownload = await knex('library_downloads')
        .where({ user_id: userId, item_id: itemId })
        .first();

      if (existingDownload) {
        // User has downloaded this before - increment their personal count
        await knex('library_downloads')
          .where({ user_id: userId, item_id: itemId })
          .increment('download_count', 1)
          .update({ last_downloaded_at: knex.fn.now() });

        return await knex('library_downloads')
          .where({ user_id: userId, item_id: itemId })
          .first();
      } else {
        // First time download - create new record
        const [download] = await knex('library_downloads')
          .insert({
            user_id: userId,
            item_id: itemId,
            first_downloaded_at: knex.fn.now(),
            download_count: 1,
            last_downloaded_at: knex.fn.now()
          })
          .returning('*');

        return download;
      }
    } catch (error) {
      logger.error(`Error recording download for user ${userId}, item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get downloads by user
   */
  async findByUser(userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      const total = await knex('library_downloads')
        .where({ user_id: userId })
        .count('* as count')
        .first();

      const downloads = await knex('library_downloads')
        .select(
          'library_downloads.*',
          'library_items.title',
          'library_items.author',
          'library_items.item_type',
          'library_items.cover_image_url'
        )
        .leftJoin('library_items', 'library_downloads.item_id', 'library_items.id')
        .where('library_downloads.user_id', userId)
        .orderBy('library_downloads.last_downloaded_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        downloads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(parseInt(total.count) / limit)
        }
      };
    } catch (error) {
      logger.error(`Error finding downloads for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get download statistics for an item
   */
  async getItemStats(itemId) {
    try {
      const stats = await knex('library_downloads')
        .where({ item_id: itemId })
        .select([
          knex.raw('COUNT(*) as total_downloads'),
          knex.raw('COUNT(DISTINCT user_id) as unique_users'),
          knex.raw('SUM(download_count) as total_download_events'),
          knex.raw('AVG(download_count) as avg_downloads_per_user')
        ])
        .first();

      return {
        total_downloads: parseInt(stats.total_downloads) || 0,
        unique_users: parseInt(stats.unique_users) || 0,
        total_download_events: parseInt(stats.total_download_events) || 0,
        avg_downloads_per_user: parseFloat(stats.avg_downloads_per_user) || 0
      };
    } catch (error) {
      logger.error(`Error getting download stats for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get download statistics for all items (aggregated)
   */
  async getGlobalStats() {
    try {
      const totalDownloads = await knex('library_downloads')
        .count('* as count')
        .first();

      const uniqueUsers = await knex('library_downloads')
        .countDistinct('user_id as count')
        .first();

      const totalDownloadEvents = await knex('library_downloads')
        .sum('download_count as total')
        .first();

      const popularItems = await knex('library_downloads')
        .select('library_items.title', 'library_items.author')
        .count('* as download_count')
        .leftJoin('library_items', 'library_downloads.item_id', 'library_items.id')
        .groupBy('library_downloads.item_id', 'library_items.title', 'library_items.author')
        .orderBy('download_count', 'desc')
        .limit(10);

      return {
        total_download_records: parseInt(totalDownloads.count),
        unique_downloading_users: parseInt(uniqueUsers.count),
        total_download_events: parseInt(totalDownloadEvents.total) || 0,
        most_downloaded_items: popularItems
      };
    } catch (error) {
      logger.error('Error getting global download stats:', error);
      throw error;
    }
  }

  /**
   * Check if user has downloaded an item
   */
  async hasUserDownloaded(userId, itemId) {
    try {
      const download = await knex('library_downloads')
        .where({ user_id: userId, item_id: itemId })
        .first();

      return !!download;
    } catch (error) {
      logger.error(`Error checking download status for user ${userId}, item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's download count for an item
   */
  async getUserItemDownloadCount(userId, itemId) {
    try {
      const download = await knex('library_downloads')
        .where({ user_id: userId, item_id: itemId })
        .first();

      return download ? download.download_count : 0;
    } catch (error) {
      logger.error(`Error getting download count for user ${userId}, item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all downloads for an item (for cleanup)
   */
  async deleteByItem(itemId) {
    try {
      const count = await knex('library_downloads')
        .where({ item_id: itemId })
        .delete();

      return count;
    } catch (error) {
      logger.error(`Error deleting downloads for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all downloads for a user (for cleanup)
   */
  async deleteByUser(userId) {
    try {
      const count = await knex('library_downloads')
        .where({ user_id: userId })
        .delete();

      return count;
    } catch (error) {
      logger.error(`Error deleting downloads for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new LibraryDownloadRepository();
