/**
 * Library Item Repository
 * Handles all database operations for library items using Knex
 */

const knex = require('../../../config/knex');
const logger = require('../../../config/winston');

class LibraryItemRepository {
  /**
   * Get all items with pagination and filters
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category_id,
        item_type,
        format,
        status,
        language,
        is_featured,
        author
      } = options;

      const offset = (page - 1) * limit;

      let query = knex('library_items')
        .select(
          'library_items.*',
          'library_categories.name as category_name',
          'library_categories.slug as category_slug',
          'users.username as added_by_username',
          'users.first_name as added_by_first_name',
          'users.last_name as added_by_last_name'
        )
        .leftJoin('library_categories', 'library_items.category_id', 'library_categories.id')
        .leftJoin('users', 'library_items.added_by', 'users.id');

      // Apply filters
      if (search) {
        query = query.where(function() {
          this.where('library_items.title', 'ilike', `%${search}%`)
            .orWhere('library_items.author', 'ilike', `%${search}%`)
            .orWhere('library_items.isbn', 'ilike', `%${search}%`)
            .orWhere('library_items.description', 'ilike', `%${search}%`);
        });
      }

      if (category_id) {
        query = query.where('library_items.category_id', category_id);
      }

      if (item_type) {
        query = query.where('library_items.item_type', item_type);
      }

      if (format) {
        query = query.where('library_items.format', format);
      }

      if (status) {
        query = query.where('library_items.status', status);
      }

      if (language) {
        query = query.where('library_items.language', language);
      }

      if (is_featured !== undefined) {
        query = query.where('library_items.is_featured', is_featured);
      }

      if (author) {
        query = query.where('library_items.author', 'ilike', `%${author}%`);
      }

      // Get total count - use a simpler query without joins for counting
      const countQuery = knex('library_items');
      
      // Apply same filters to count query
      if (search) {
        countQuery.where(function() {
          this.where('title', 'ilike', `%${search}%`)
            .orWhere('author', 'ilike', `%${search}%`)
            .orWhere('isbn', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`);
        });
      }
      if (category_id) countQuery.where('category_id', category_id);
      if (item_type) countQuery.where('item_type', item_type);
      if (format) countQuery.where('format', format);
      if (status) countQuery.where('status', status);
      if (language) countQuery.where('language', language);
      if (is_featured !== undefined) countQuery.where('is_featured', is_featured);
      if (author) countQuery.where('author', 'ilike', `%${author}%`);
      
      const total = await countQuery.count('* as count').first();

      // Get paginated results
      const items = await query
        .limit(limit)
        .offset(offset)
        .orderBy('library_items.created_at', 'desc');

      return {
        items,
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
   * Find item by ID
   */
  async findById(id) {
    try {
      return await knex('library_items')
        .select(
          'library_items.*',
          'library_categories.name as category_name',
          'library_categories.slug as category_slug',
          'users.username as added_by_username',
          'users.first_name as added_by_first_name',
          'users.last_name as added_by_last_name'
        )
        .leftJoin('library_categories', 'library_items.category_id', 'library_categories.id')
        .leftJoin('users', 'library_items.added_by', 'users.id')
        .where('library_items.id', id)
        .first();
    } catch (error) {
      logger.error(`Error finding item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find item by ISBN
   */
  async findByISBN(isbn) {
    try {
      return await knex('library_items')
        .where({ isbn })
        .first();
    } catch (error) {
      logger.error(`Error finding item by ISBN ${isbn}:`, error);
      throw error;
    }
  }

  /**
   * Find item by ID with full details including stats
   */
  async findByIdWithDetails(id) {
    try {
      const item = await this.findById(id);
      if (!item) return null;

      // Get borrowing stats
      const borrowingStats = await knex('library_borrowing')
        .where({ item_id: id })
        .count('* as total_borrows')
        .countDistinct('user_id as unique_borrowers')
        .avg('fine_amount as avg_fine')
        .first();

      // Get current borrowing status
      const currentBorrowing = await knex('library_borrowing')
        .where({ item_id: id, status: 'borrowed' })
        .count('* as count')
        .first();

      // Get active reservations
      const activeReservations = await knex('library_reservations')
        .where({ item_id: id, status: 'active' })
        .count('* as count')
        .first();

      // Get reviews summary
      const reviewsStats = await knex('library_reviews')
        .where({ item_id: id, is_approved: true })
        .count('* as total_reviews')
        .avg('rating as avg_rating')
        .first();

      item.stats = {
        total_borrows: parseInt(borrowingStats.total_borrows) || 0,
        unique_borrowers: parseInt(borrowingStats.unique_borrowers) || 0,
        avg_fine: parseFloat(borrowingStats.avg_fine) || 0,
        currently_borrowed: parseInt(currentBorrowing.count) || 0,
        active_reservations: parseInt(activeReservations.count) || 0,
        total_reviews: parseInt(reviewsStats.total_reviews) || 0,
        avg_rating: parseFloat(reviewsStats.avg_rating) || 0
      };

      return item;
    } catch (error) {
      logger.error(`Error finding item with details ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new item
   */
  async create(itemData) {
    try {
      const {
        title,
        isbn,
        author,
        publisher,
        publication_date,
        description,
        category_id,
        item_type,
        format,
        language,
        total_copies,
        available_copies,
        cover_image_url,
        file_url,
        file_size,
        location,
        tags,
        status,
        pages,
        edition,
        is_featured,
        added_by
      } = itemData;

      const [item] = await knex('library_items')
        .insert({
          title,
          isbn,
          author,
          publisher,
          publication_date,
          description,
          category_id,
          item_type: item_type || 'book',
          format: format || 'physical',
          language: language || 'en',
          total_copies: total_copies || 1,
          available_copies: available_copies !== undefined ? available_copies : (total_copies || 1),
          cover_image_url,
          file_url,
          file_size,
          location,
          tags: tags ? JSON.stringify(tags) : null,
          status: status || 'available',
          pages,
          edition,
          is_featured: is_featured || false,
          view_count: 0,
          download_count: 0,
          added_by,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      return item;
    } catch (error) {
      logger.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update item
   */
  async update(id, itemData) {
    try {
      // If tags is an array, convert to JSON string
      if (itemData.tags && Array.isArray(itemData.tags)) {
        itemData.tags = JSON.stringify(itemData.tags);
      }

      const [item] = await knex('library_items')
        .where({ id })
        .update({
          ...itemData,
          updated_at: new Date()
        })
        .returning('*');

      return item;
    } catch (error) {
      logger.error(`Error updating item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update item status
   */
  async updateStatus(id, status) {
    try {
      const [item] = await knex('library_items')
        .where({ id })
        .update({
          status,
          updated_at: new Date()
        })
        .returning('*');

      return item;
    } catch (error) {
      logger.error(`Error updating item status ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update available copies count
   */
  async updateAvailableCopies(id, change) {
    try {
      const [item] = await knex('library_items')
        .where({ id })
        .update({
          available_copies: knex.raw('available_copies + ?', [change]),
          updated_at: new Date()
        })
        .returning('*');

      return item;
    } catch (error) {
      logger.error(`Error updating available copies ${id}:`, error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id) {
    try {
      await knex('library_items')
        .where({ id })
        .increment('view_count', 1);
    } catch (error) {
      logger.error(`Error incrementing view count ${id}:`, error);
      throw error;
    }
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id) {
    try {
      await knex('library_items')
        .where({ id })
        .increment('download_count', 1);
    } catch (error) {
      logger.error(`Error incrementing download count ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete item
   */
  async delete(id) {
    try {
      const count = await knex('library_items')
        .where({ id })
        .delete();

      return count > 0;
    } catch (error) {
      logger.error(`Error deleting item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get featured items
   */
  async findFeatured(limit = 10) {
    try {
      return await knex('library_items')
        .select(
          'library_items.*',
          'library_categories.name as category_name',
          'library_categories.slug as category_slug'
        )
        .leftJoin('library_categories', 'library_items.category_id', 'library_categories.id')
        .where('library_items.is_featured', true)
        .where('library_items.status', 'available')
        .orderBy('library_items.created_at', 'desc')
        .limit(limit);
    } catch (error) {
      logger.error('Error finding featured items:', error);
      throw error;
    }
  }

  /**
   * Get popular items (most borrowed)
   */
  async findPopular(limit = 10) {
    try {
      return await knex('library_items')
        .select(
          'library_items.*',
          'library_categories.name as category_name',
          knex.raw('COUNT(library_borrowing.id) as borrow_count')
        )
        .leftJoin('library_categories', 'library_items.category_id', 'library_categories.id')
        .leftJoin('library_borrowing', 'library_items.id', 'library_borrowing.item_id')
        .where('library_items.status', 'available')
        .groupBy('library_items.id', 'library_categories.name')
        .orderBy('borrow_count', 'desc')
        .limit(limit);
    } catch (error) {
      logger.error('Error finding popular items:', error);
      throw error;
    }
  }

  /**
   * Get recently added items
   */
  async findRecent(limit = 10) {
    try {
      return await knex('library_items')
        .select(
          'library_items.*',
          'library_categories.name as category_name',
          'library_categories.slug as category_slug'
        )
        .leftJoin('library_categories', 'library_items.category_id', 'library_categories.id')
        .where('library_items.status', 'available')
        .orderBy('library_items.created_at', 'desc')
        .limit(limit);
    } catch (error) {
      logger.error('Error finding recent items:', error);
      throw error;
    }
  }

  /**
   * Get items by category
   */
  async findByCategory(categoryId, options = {}) {
    try {
      const { page = 1, limit = 20, status = 'available' } = options;
      const offset = (page - 1) * limit;

      let query = knex('library_items')
        .select('library_items.*')
        .where('category_id', categoryId);

      if (status) {
        query = query.where('status', status);
      }

      const total = await query.clone().count('* as count').first();

      const items = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(parseInt(total.count) / limit)
        }
      };
    } catch (error) {
      logger.error(`Error finding items by category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Search items with advanced filters
   */
  async search(searchOptions) {
    try {
      const {
        query,
        category_id,
        item_type,
        format,
        language,
        author,
        publisher,
        minPages,
        maxPages,
        status = 'available',
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = searchOptions;

      const offset = (page - 1) * limit;

      let queryBuilder = knex('library_items')
        .select(
          'library_items.*',
          'library_categories.name as category_name',
          'library_categories.slug as category_slug'
        )
        .leftJoin('library_categories', 'library_items.category_id', 'library_categories.id');

      // Text search
      if (query) {
        queryBuilder = queryBuilder.where(function() {
          this.where('library_items.title', 'ilike', `%${query}%`)
            .orWhere('library_items.author', 'ilike', `%${query}%`)
            .orWhere('library_items.description', 'ilike', `%${query}%`)
            .orWhere('library_items.isbn', 'ilike', `%${query}%`);
        });
      }

      // Apply filters
      if (category_id) queryBuilder = queryBuilder.where('library_items.category_id', category_id);
      if (item_type) queryBuilder = queryBuilder.where('library_items.item_type', item_type);
      if (format) queryBuilder = queryBuilder.where('library_items.format', format);
      if (language) queryBuilder = queryBuilder.where('library_items.language', language);
      if (author) queryBuilder = queryBuilder.where('library_items.author', 'ilike', `%${author}%`);
      if (publisher) queryBuilder = queryBuilder.where('library_items.publisher', 'ilike', `%${publisher}%`);
      if (minPages) queryBuilder = queryBuilder.where('library_items.pages', '>=', minPages);
      if (maxPages) queryBuilder = queryBuilder.where('library_items.pages', '<=', maxPages);
      if (status) queryBuilder = queryBuilder.where('library_items.status', status);

      // Get total count
      const total = await queryBuilder.clone().count('library_items.id as count').first();

      // Get results with sorting
      const items = await queryBuilder
        .orderBy(`library_items.${sortBy}`, sortOrder)
        .limit(limit)
        .offset(offset);

      return {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total.count),
          pages: Math.ceil(parseInt(total.count) / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching items:', error);
      throw error;
    }
  }

  /**
   * Get library statistics
   */
  async getStatistics() {
    try {
      const totalItems = await knex('library_items').count('* as count').first();
      const totalBorrowings = await knex('library_borrowing').count('* as count').first();
      const activeBorrowings = await knex('library_borrowing')
        .where({ status: 'borrowed' })
        .count('* as count')
        .first();
      const overdueItems = await knex('library_borrowing')
        .where('status', 'borrowed')
        .where('due_date', '<', new Date())
        .count('* as count')
        .first();

      const itemsByType = await knex('library_items')
        .select('item_type')
        .count('* as count')
        .groupBy('item_type');

      const itemsByCategory = await knex('library_items')
        .select('library_categories.name as category_name')
        .count('library_items.id as count')
        .leftJoin('library_categories', 'library_items.category_id', 'library_categories.id')
        .groupBy('library_categories.name')
        .orderBy('count', 'desc')
        .limit(10);

      return {
        total_items: parseInt(totalItems.count),
        total_borrowings: parseInt(totalBorrowings.count),
        active_borrowings: parseInt(activeBorrowings.count),
        overdue_items: parseInt(overdueItems.count),
        items_by_type: itemsByType,
        items_by_category: itemsByCategory
      };
    } catch (error) {
      logger.error('Error getting library statistics:', error);
      throw error;
    }
  }
}

module.exports = new LibraryItemRepository();
