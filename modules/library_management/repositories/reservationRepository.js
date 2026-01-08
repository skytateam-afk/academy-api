/**
 * Library Reservation Repository
 * Handles all database operations for library reservations using Knex
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class LibraryReservationRepository {
  /**
   * Get all reservations with pagination and filters
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        user_id,
        item_id,
        status
      } = options;

      const offset = (page - 1) * limit;

      let query = knex('library_reservations')
        .select(
          'library_reservations.*',
          'library_items.title as item_title',
          'library_items.author as item_author',
          'library_items.cover_image_url as item_cover',
          'users.username',
          'users.first_name as user_first_name',
          'users.last_name as user_last_name',
          'users.email as user_email'
        )
        .leftJoin('library_items', 'library_reservations.item_id', 'library_items.id')
        .leftJoin('users', 'library_reservations.user_id', 'users.id');

      // Apply filters
      if (user_id) {
        query = query.where('library_reservations.user_id', user_id);
      }

      if (item_id) {
        query = query.where('library_reservations.item_id', item_id);
      }

      if (status) {
        query = query.where('library_reservations.status', status);
      }

      // Get total count separately without JOINs to avoid GROUP BY issues
      let countQuery = knex('library_reservations');
      
      if (user_id) {
        countQuery = countQuery.where('user_id', user_id);
      }
      if (item_id) {
        countQuery = countQuery.where('item_id', item_id);
      }
      if (status) {
        countQuery = countQuery.where('status', status);
      }
      
      const total = await countQuery.count('id as count').first();

      // Get paginated results with JOINs
      const reservations = await query
        .limit(limit)
        .offset(offset)
        .orderBy('library_reservations.reserved_at', 'desc');

      return {
        reservations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(parseInt(total.count) / limit)
        }
      };
    } catch (error) {
      logger.error('Error in findAll:', error);
      throw error;
    }
  }

  /**
   * Find reservation by ID
   */
  async findById(id) {
    try {
      return await knex('library_reservations')
        .select(
          'library_reservations.*',
          'library_items.title as item_title',
          'library_items.author as item_author',
          'library_items.cover_image_url as item_cover',
          'users.username',
          'users.first_name as user_first_name',
          'users.last_name as user_last_name',
          'users.email as user_email'
        )
        .leftJoin('library_items', 'library_reservations.item_id', 'library_items.id')
        .leftJoin('users', 'library_reservations.user_id', 'users.id')
        .where('library_reservations.id', id)
        .first();
    } catch (error) {
      logger.error(`Error finding reservation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new reservation
   */
  async create(reservationData) {
    try {
      const {
        item_id,
        user_id,
        expires_at,
        notes
      } = reservationData;

      // Get current queue position for this item
      const queueCount = await knex('library_reservations')
        .where({ item_id, status: 'active' })
        .count('* as count')
        .first();

      const [reservation] = await knex('library_reservations')
        .insert({
          item_id,
          user_id,
          reserved_at: new Date(),
          expires_at,
          status: 'active',
          queue_position: parseInt(queueCount.count) + 1,
          notes,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return reservation;
    } catch (error) {
      logger.error('Error creating reservation:', error);
      throw error;
    }
  }

  /**
   * Update reservation
   */
  async update(id, reservationData) {
    try {
      const [reservation] = await knex('library_reservations')
        .where({ id })
        .update({
          ...reservationData,
          updated_at: new Date()
        })
        .returning('*');

      return reservation;
    } catch (error) {
      logger.error(`Error updating reservation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark reservation as fulfilled
   */
  async markFulfilled(id) {
    try {
      const [reservation] = await knex('library_reservations')
        .where({ id })
        .update({
          status: 'fulfilled',
          updated_at: new Date()
        })
        .returning('*');

      // Update queue positions for remaining active reservations
      if (reservation) {
        await this.updateQueuePositions(reservation.item_id);
      }

      return reservation;
    } catch (error) {
      logger.error(`Error marking reservation ${id} as fulfilled:`, error);
      throw error;
    }
  }

  /**
   * Cancel reservation
   */
  async cancel(id) {
    try {
      const [reservation] = await knex('library_reservations')
        .where({ id })
        .update({
          status: 'cancelled',
          updated_at: new Date()
        })
        .returning('*');

      // Update queue positions for remaining active reservations
      if (reservation) {
        await this.updateQueuePositions(reservation.item_id);
      }

      return reservation;
    } catch (error) {
      logger.error(`Error cancelling reservation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark reservation as notified
   */
  async markNotified(id) {
    try {
      const [reservation] = await knex('library_reservations')
        .where({ id })
        .update({
          notified_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return reservation;
    } catch (error) {
      logger.error(`Error marking reservation ${id} as notified:`, error);
      throw error;
    }
  }

  /**
   * Delete reservation
   */
  async delete(id) {
    try {
      const reservation = await this.findById(id);
      const count = await knex('library_reservations')
        .where({ id })
        .delete();

      // Update queue positions for remaining active reservations
      if (reservation) {
        await this.updateQueuePositions(reservation.item_id);
      }

      return count > 0;
    } catch (error) {
      logger.error(`Error deleting reservation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find active reservation for user and item
   */
  async findActiveByUserAndItem(userId, itemId) {
    try {
      return await knex('library_reservations')
        .where({
          user_id: userId,
          item_id: itemId,
          status: 'active'
        })
        .first();
    } catch (error) {
      logger.error(`Error finding active reservation for user ${userId} and item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's reservations
   */
  async findByUser(userId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const offset = (page - 1) * limit;

      let query = knex('library_reservations')
        .select(
          'library_reservations.*',
          'library_items.title as item_title',
          'library_items.author as item_author',
          'library_items.cover_image_url as item_cover'
        )
        .leftJoin('library_items', 'library_reservations.item_id', 'library_items.id')
        .where('library_reservations.user_id', userId);

      if (status) {
        query = query.where('library_reservations.status', status);
      }

      const total = await query.clone().count('library_reservations.id as count').first();

      const reservations = await query
        .limit(limit)
        .offset(offset)
        .orderBy('library_reservations.reserved_at', 'desc');

      return {
        reservations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(parseInt(total.count) / limit)
        }
      };
    } catch (error) {
      logger.error(`Error finding reservations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get reservations for an item (ordered by queue position)
   */
  async findByItem(itemId, options = {}) {
    try {
      const { status = 'active' } = options;

      return await knex('library_reservations')
        .select(
          'library_reservations.*',
          'users.username',
          'users.first_name as user_first_name',
          'users.last_name as user_last_name',
          'users.email as user_email'
        )
        .leftJoin('users', 'library_reservations.user_id', 'users.id')
        .where('library_reservations.item_id', itemId)
        .where('library_reservations.status', status)
        .orderBy('library_reservations.queue_position', 'asc');
    } catch (error) {
      logger.error(`Error finding reservations for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get next reservation in queue for an item
   */
  async getNextInQueue(itemId) {
    try {
      return await knex('library_reservations')
        .select(
          'library_reservations.*',
          'users.username',
          'users.email as user_email'
        )
        .leftJoin('users', 'library_reservations.user_id', 'users.id')
        .where({
          item_id: itemId,
          status: 'active'
        })
        .orderBy('queue_position', 'asc')
        .first();
    } catch (error) {
      logger.error(`Error getting next reservation for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get expired reservations
   */
  async findExpired() {
    try {
      return await knex('library_reservations')
        .select(
          'library_reservations.*',
          'library_items.title as item_title',
          'users.username',
          'users.email as user_email'
        )
        .leftJoin('library_items', 'library_reservations.item_id', 'library_items.id')
        .leftJoin('users', 'library_reservations.user_id', 'users.id')
        .where('library_reservations.status', 'active')
        .where('library_reservations.expires_at', '<', new Date())
    } catch (error) {
      logger.error('Error finding expired reservations:', error);
      throw error;
    }
  }

  /**
   * Update queue positions for an item
   */
  async updateQueuePositions(itemId) {
    try {
      const activeReservations = await knex('library_reservations')
        .where({ item_id: itemId, status: 'active' })
        .orderBy('reserved_at', 'asc')
        .select('id');

      for (let i = 0; i < activeReservations.length; i++) {
        await knex('library_reservations')
          .where({ id: activeReservations[i].id })
          .update({
            queue_position: i + 1,
            updated_at: new Date()
          });
      }
    } catch (error) {
      logger.error(`Error updating queue positions for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Mark expired reservations
   */
  async markExpiredReservations() {
    try {
      const expiredReservations = await knex('library_reservations')
        .where('status', 'active')
        .where('expires_at', '<', new Date())
        .select('id', 'item_id');

      for (const reservation of expiredReservations) {
        await knex('library_reservations')
          .where({ id: reservation.id })
          .update({
            status: 'expired',
            updated_at: new Date()
          });

        // Update queue positions
        await this.updateQueuePositions(reservation.item_id);
      }

      return expiredReservations.length;
    } catch (error) {
      logger.error('Error marking expired reservations:', error);
      throw error;
    }
  }

  /**
   * Get reservation statistics
   */
  async getStatistics(options = {}) {
    try {
      const { userId } = options;

      let baseQuery = knex('library_reservations');
      
      if (userId) {
        baseQuery = baseQuery.where('user_id', userId);
      }

      const totalReservations = await baseQuery.clone()
        .count('* as count')
        .first();

      const activeReservations = await baseQuery.clone()
        .where('status', 'active')
        .count('* as count')
        .first();

      const fulfilledReservations = await baseQuery.clone()
        .where('status', 'fulfilled')
        .count('* as count')
        .first();

      const cancelledReservations = await baseQuery.clone()
        .where('status', 'cancelled')
        .count('* as count')
        .first();

      return {
        total_reservations: parseInt(totalReservations.count),
        active_reservations: parseInt(activeReservations.count),
        fulfilled_reservations: parseInt(fulfilledReservations.count),
        cancelled_reservations: parseInt(cancelledReservations.count)
      };
    } catch (error) {
      logger.error('Error getting reservation statistics:', error);
      throw error;
    }
  }
}

module.exports = new LibraryReservationRepository();
