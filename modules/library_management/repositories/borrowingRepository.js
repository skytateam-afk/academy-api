/**
 * Library Borrowing Repository
 * Handles all database operations for library borrowing using Knex
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class LibraryBorrowingRepository {
  /**
   * Get all borrowings with pagination and filters
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        user_id,
        item_id,
        status,
        overdue
      } = options;

      const offset = (page - 1) * limit;

      let query = knex('library_borrowing')
        .select(
          'library_borrowing.*',
          'library_items.title as item_title',
          'library_items.author as item_author',
          'library_items.isbn as item_isbn',
          'library_items.cover_image_url as item_cover',
          'users.username',
          'users.first_name as user_first_name',
          'users.last_name as user_last_name',
          'users.email as user_email',
          'issued_users.username as issued_by_username',
          'received_users.username as received_by_username'
        )
        .leftJoin('library_items', 'library_borrowing.item_id', 'library_items.id')
        .leftJoin('users', 'library_borrowing.user_id', 'users.id')
        .leftJoin('users as issued_users', 'library_borrowing.issued_by', 'issued_users.id')
        .leftJoin('users as received_users', 'library_borrowing.received_by', 'received_users.id');

      // Apply filters
      if (user_id) {
        query = query.where('library_borrowing.user_id', user_id);
      }

      if (item_id) {
        query = query.where('library_borrowing.item_id', item_id);
      }

      if (status) {
        query = query.where('library_borrowing.status', status);
      }

      if (overdue) {
        query = query
          .where('library_borrowing.status', 'borrowed')
          .where('library_borrowing.due_date', '<', new Date())
      }

      // Get total count - use a simpler query without joins for counting
      let countQuery = knex('library_borrowing');
      
      // Apply same filters to count query
      if (user_id) {
        countQuery = countQuery.where('user_id', user_id);
      }

      if (item_id) {
        countQuery = countQuery.where('item_id', item_id);
      }

      if (status) {
        countQuery = countQuery.where('status', status);
      }

      if (overdue) {
        countQuery = countQuery
          .where('status', 'borrowed')
          .where('due_date', '<', new Date())
      }

      const total = await countQuery.count('* as count').first();

      // Get paginated results
      const borrowings = await query
        .limit(limit)
        .offset(offset)
        .orderBy('library_borrowing.borrowed_at', 'desc');

      return {
        borrowings,
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
   * Find borrowing by ID
   */
  async findById(id) {
    try {
      return await knex('library_borrowing')
        .select(
          'library_borrowing.*',
          'library_items.title as item_title',
          'library_items.author as item_author',
          'library_items.isbn as item_isbn',
          'library_items.cover_image_url as item_cover',
          'users.username',
          'users.first_name as user_first_name',
          'users.last_name as user_last_name',
          'users.email as user_email',
          'issued_users.username as issued_by_username',
          'received_users.username as received_by_username'
        )
        .leftJoin('library_items', 'library_borrowing.item_id', 'library_items.id')
        .leftJoin('users', 'library_borrowing.user_id', 'users.id')
        .leftJoin('users as issued_users', 'library_borrowing.issued_by', 'issued_users.id')
        .leftJoin('users as received_users', 'library_borrowing.received_by', 'received_users.id')
        .where('library_borrowing.id', id)
        .first();
    } catch (error) {
      logger.error(`Error finding borrowing ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new borrowing
   */
  async create(borrowingData) {
    try {
      const {
        item_id,
        user_id,
        due_date,
        notes,
        issued_by
      } = borrowingData;

      const [borrowing] = await knex('library_borrowing')
        .insert({
          item_id,
          user_id,
          borrowed_at: new Date(),
          due_date,
          status: 'borrowed',
          notes,
          fine_amount: 0,
          fine_paid: false,
          issued_by,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return borrowing;
    } catch (error) {
      logger.error('Error creating borrowing:', error);
      throw error;
    }
  }

  /**
   * Update borrowing
   */
  async update(id, borrowingData) {
    try {
      const [borrowing] = await knex('library_borrowing')
        .where({ id })
        .update({
          ...borrowingData,
          updated_at: new Date()
        })
        .returning('*');

      return borrowing;
    } catch (error) {
      logger.error(`Error updating borrowing ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark item as returned
   */
  async markReturned(id, receivedBy) {
    try {
      const [borrowing] = await knex('library_borrowing')
        .where({ id })
        .update({
          status: 'returned',
          returned_at: new Date(),
          received_by: receivedBy,
          updated_at: new Date()
        })
        .returning('*');

      return borrowing;
    } catch (error) {
      logger.error(`Error marking borrowing ${id} as returned:`, error);
      throw error;
    }
  }

  /**
   * Mark item as lost
   */
  async markLost(id, fine_amount = 0) {
    try {
      const [borrowing] = await knex('library_borrowing')
        .where({ id })
        .update({
          status: 'lost',
          fine_amount,
          updated_at: new Date()
        })
        .returning('*');

      return borrowing;
    } catch (error) {
      logger.error(`Error marking borrowing ${id} as lost:`, error);
      throw error;
    }
  }

  /**
   * Update fine amount
   */
  async updateFine(id, fine_amount) {
    try {
      const [borrowing] = await knex('library_borrowing')
        .where({ id })
        .update({
          fine_amount,
          updated_at: new Date()
        })
        .returning('*');

      return borrowing;
    } catch (error) {
      logger.error(`Error updating fine for borrowing ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark fine as paid
   */
  async markFinePaid(id) {
    try {
      const [borrowing] = await knex('library_borrowing')
        .where({ id })
        .update({
          fine_paid: true,
          updated_at: new Date()
        })
        .returning('*');

      return borrowing;
    } catch (error) {
      logger.error(`Error marking fine as paid for borrowing ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete borrowing
   */
  async delete(id) {
    try {
      const count = await knex('library_borrowing')
        .where({ id })
        .delete();

      return count > 0;
    } catch (error) {
      logger.error(`Error deleting borrowing ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get active borrowing for user and item
   */
  async findActiveByUserAndItem(userId, itemId) {
    try {
      return await knex('library_borrowing')
        .where({
          user_id: userId,
          item_id: itemId,
          status: 'borrowed'
        })
        .first();
    } catch (error) {
      logger.error(`Error finding active borrowing for user ${userId} and item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's borrowing history
   */
  async findByUser(userId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const offset = (page - 1) * limit;

      let query = knex('library_borrowing')
        .select(
          'library_borrowing.*',
          'library_items.title as item_title',
          'library_items.author as item_author',
          'library_items.cover_image_url as item_cover'
        )
        .leftJoin('library_items', 'library_borrowing.item_id', 'library_items.id')
        .where('library_borrowing.user_id', userId);

      if (status) {
        query = query.where('library_borrowing.status', status);
      }

      const total = await query.clone().count('library_borrowing.id as count').first();

      const borrowings = await query
        .limit(limit)
        .offset(offset)
        .orderBy('library_borrowing.borrowed_at', 'desc');

      return {
        borrowings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(parseInt(total.count) / limit)
        }
      };
    } catch (error) {
      logger.error(`Error finding borrowings for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get overdue borrowings
   */
  async findOverdue(options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      const query = knex('library_borrowing')
        .select(
          'library_borrowing.*',
          'library_items.title as item_title',
          'library_items.author as item_author',
          'users.username',
          'users.first_name as user_first_name',
          'users.last_name as user_last_name',
          'users.email as user_email'
        )
        .leftJoin('library_items', 'library_borrowing.item_id', 'library_items.id')
        .leftJoin('users', 'library_borrowing.user_id', 'users.id')
        .where('library_borrowing.status', 'borrowed')
        .where('library_borrowing.due_date', '<', new Date())

      const total = await query.clone().count('library_borrowing.id as count').first();

      const borrowings = await query
        .limit(limit)
        .offset(offset)
        .orderBy('library_borrowing.due_date', 'asc');

      return {
        borrowings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(parseInt(total.count) / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding overdue borrowings:', error);
      throw error;
    }
  }

  /**
   * Get borrowings due soon (within specified days)
   */
  async findDueSoon(days = 3) {
    try {
      return await knex('library_borrowing')
        .select(
          'library_borrowing.*',
          'library_items.title as item_title',
          'users.username',
          'users.email as user_email'
        )
        .leftJoin('library_items', 'library_borrowing.item_id', 'library_items.id')
        .leftJoin('users', 'library_borrowing.user_id', 'users.id')
        .where('library_borrowing.status', 'borrowed')
        .whereBetween('library_borrowing.due_date', [
          new Date(),
          knex.raw(`NOW() + INTERVAL '${days} days'`)
        ])
        .orderBy('library_borrowing.due_date', 'asc');
    } catch (error) {
      logger.error('Error finding borrowings due soon:', error);
      throw error;
    }
  }

  /**
   * Get borrowing statistics
   */
  async getStatistics(options = {}) {
    try {
      const { userId } = options;

      let baseQuery = knex('library_borrowing');
      
      if (userId) {
        baseQuery = baseQuery.where('user_id', userId);
      }

      const totalBorrowings = await baseQuery.clone()
        .count('* as count')
        .first();

      const activeBorrowings = await baseQuery.clone()
        .where('status', 'borrowed')
        .count('* as count')
        .first();

      const overdueBorrowings = await baseQuery.clone()
        .where('status', 'borrowed')
        .where('due_date', '<', new Date())
        .count('* as count')
        .first();

      const totalFines = await baseQuery.clone()
        .sum('fine_amount as total')
        .first();

      const unpaidFines = await baseQuery.clone()
        .where('fine_paid', false)
        .sum('fine_amount as total')
        .first();

      return {
        total_borrowings: parseInt(totalBorrowings.count),
        active_borrowings: parseInt(activeBorrowings.count),
        overdue_borrowings: parseInt(overdueBorrowings.count),
        total_fines: parseFloat(totalFines.total) || 0,
        unpaid_fines: parseFloat(unpaidFines.total) || 0
      };
    } catch (error) {
      logger.error('Error getting borrowing statistics:', error);
      throw error;
    }
  }

  /**
   * Update overdue items status and calculate fines
   */
  async updateOverdueItems(finePerDay = 1.0) {
    try {
      const overdueItems = await knex('library_borrowing')
        .where('status', 'borrowed')
        .where('due_date', '<', new Date())
        .select('id', 'due_date');

      for (const item of overdueItems) {
        const daysOverdue = Math.floor(
          (Date.now() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        const fineAmount = daysOverdue * finePerDay;

        await knex('library_borrowing')
          .where({ id: item.id })
          .update({
            status: 'overdue',
            fine_amount: fineAmount,
            updated_at: new Date()
          });
      }

      return overdueItems.length;
    } catch (error) {
      logger.error('Error updating overdue items:', error);
      throw error;
    }
  }
}

module.exports = new LibraryBorrowingRepository();
