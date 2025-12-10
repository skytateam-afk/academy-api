/**
 * Library Controller
 * Handles HTTP requests for library management
 */

const libraryService = require('../services/libraryService');
const logger = require('../../../config/winston');

class LibraryController {
  // ==================== CATEGORY ENDPOINTS ====================

  /**
   * Get all categories
   * GET /api/library/categories
   */
  async getAllCategories(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const categories = await libraryService.getAllCategories();

      // Calculate pagination
      const total = categories.length;
      const pages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCategories = categories.slice(startIndex, endIndex);

      res.json({
        success: true,
        categories: paginatedCategories,
        total: total,
        page: page,
        pages: pages
      });
    } catch (error) {
      logger.error('Error in getAllCategories:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get category by ID
   * GET /api/library/categories/:id
   */
  async getCategoryById(req, res) {
    try {
      const category = await libraryService.getCategoryById(req.params.id);
      res.json({
        success: true,
        category: category
      });
    } catch (error) {
      logger.error('Error in getCategoryById:', error);
      const status = error.message === 'Category not found' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Create category
   * POST /api/library/categories
   */
  async createCategory(req, res) {
    try {
      const category = await libraryService.createCategory(req.body);
      res.status(201).json({
        success: true,
        category: category
      });
    } catch (error) {
      logger.error('Error in createCategory:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update category
   * PUT /api/library/categories/:id
   */
  async updateCategory(req, res) {
    try {
      const category = await libraryService.updateCategory(req.params.id, req.body);
      res.json({
        success: true,
        category: category
      });
    } catch (error) {
      logger.error('Error in updateCategory:', error);
      const status = error.message === 'Category not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Delete category
   * DELETE /api/library/categories/:id
   */
  async deleteCategory(req, res) {
    try {
      await libraryService.deleteCategory(req.params.id);
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteCategory:', error);
      const status = error.message === 'Category not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  // ==================== ITEM ENDPOINTS ====================

  /**
   * Get all items
   * GET /api/library/items
   */
  async getAllItems(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        category_id: req.query.category_id,
        item_type: req.query.item_type,
        format: req.query.format,
        status: req.query.status,
        language: req.query.language,
        author: req.query.author
      };

      // Only include is_featured filter if explicitly requested
      if (req.query.is_featured !== undefined) {
        options.is_featured = req.query.is_featured === 'true';
      }

      const result = await libraryService.getAllItems(options);

      // Flatten pagination to root level for frontend compatibility
      res.json({
        success: true,
        items: result.items,
        total: result.pagination.total,
        page: result.pagination.page,
        pages: result.pagination.pages
      });
    } catch (error) {
      logger.error('Error in getAllItems:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get item by ID
   * GET /api/library/items/:id
   */
  async getItemById(req, res) {
    try {
      const includeDetails = req.query.details === 'true';
      const item = await libraryService.getItemById(req.params.id, includeDetails);

      // Record view
      await libraryService.recordView(req.params.id);

      res.json(item);
    } catch (error) {
      logger.error('Error in getItemById:', error);
      const status = error.message === 'Item not found' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Create item
   * POST /api/library/items
   * Supports both JSON and multipart/form-data (for file uploads)
   */
  async createItem(req, res) {
    try {
      // Extract files if present
      const files = req.files || {};
      const file = files.file ? files.file[0] : null;
      const thumbnail = files.thumbnail ? files.thumbnail[0] : null;

      // Create the item
      const item = await libraryService.createItem(req.body, req.user.userId);

      // Upload files if provided
      if (file && thumbnail) {
        await libraryService.uploadDigitalFile(item.id, file, thumbnail);
        // Fetch updated item with file URLs
        const updatedItem = await libraryService.getItemById(item.id);
        return res.status(201).json({ success: true, item: updatedItem });
      } else if (thumbnail) {
        await libraryService.uploadThumbnail(item.id, thumbnail);
        const updatedItem = await libraryService.getItemById(item.id);
        return res.status(201).json({ success: true, item: updatedItem });
      }

      res.status(201).json({ success: true, item });
    } catch (error) {
      logger.error('Error in createItem:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update item
   * PUT /api/library/items/:id
   * Supports both JSON and multipart/form-data (for file uploads)
   */
  async updateItem(req, res) {
    try {
      // Extract files if present
      const files = req.files || {};
      const file = files.file ? files.file[0] : null;
      const thumbnail = files.thumbnail ? files.thumbnail[0] : null;

      // Update the item
      const item = await libraryService.updateItem(req.params.id, req.body);

      // Upload files if provided
      if (file && thumbnail) {
        await libraryService.uploadDigitalFile(req.params.id, file, thumbnail);
        // Fetch updated item with file URLs
        const updatedItem = await libraryService.getItemById(req.params.id);
        return res.json({ success: true, item: updatedItem });
      } else if (thumbnail) {
        await libraryService.uploadThumbnail(req.params.id, thumbnail);
        const updatedItem = await libraryService.getItemById(req.params.id);
        return res.json({ success: true, item: updatedItem });
      } else if (file) {
        // Just file without thumbnail (shouldn't happen based on UI requirements, but handle it)
        await libraryService.uploadFile(req.params.id, file);
        const updatedItem = await libraryService.getItemById(req.params.id);
        return res.json({ success: true, item: updatedItem });
      }

      res.json({ success: true, item });
    } catch (error) {
      logger.error('Error in updateItem:', error);
      const status = error.message === 'Item not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Delete item
   * DELETE /api/library/items/:id
   */
  async deleteItem(req, res) {
    try {
      await libraryService.deleteItem(req.params.id);
      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteItem:', error);
      const status = error.message === 'Item not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Upload cover image
   * POST /api/library/items/:id/cover
   */
  async uploadCoverImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const item = await libraryService.uploadCoverImage(req.params.id, req.file);
      res.json(item);
    } catch (error) {
      logger.error('Error in uploadCoverImage:', error);
      const status = error.message === 'Item not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Upload digital file with thumbnail
   * POST /api/library/items/:id/file
   * Expects: file (PDF/MP3) and thumbnail (image)
   */
  async uploadDigitalFile(req, res) {
    try {
      if (!req.files || !req.files.file || !req.files.thumbnail) {
        return res.status(400).json({
          error: 'Both file and thumbnail are required',
          received: {
            file: !!req.files?.file,
            thumbnail: !!req.files?.thumbnail
          }
        });
      }

      const file = req.files.file[0];
      const thumbnail = req.files.thumbnail[0];

      const item = await libraryService.uploadDigitalFile(
        req.params.id,
        file,
        thumbnail
      );
      res.json(item);
    } catch (error) {
      logger.error('Error in uploadDigitalFile:', error);
      const status = error.message === 'Item not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Upload thumbnail only
   * POST /api/library/items/:id/thumbnail
   * Expects: thumbnail (image)
   */
  async uploadThumbnail(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No thumbnail uploaded' });
      }

      const item = await libraryService.uploadThumbnail(req.params.id, req.file);
      res.json(item);
    } catch (error) {
      logger.error('Error in uploadThumbnail:', error);
      const status = error.message === 'Item not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Download digital file
   * GET /api/library/items/:id/download
   */
  async downloadFile(req, res) {
    try {
      const item = await libraryService.getItemById(req.params.id);

      if (!item.file_url) {
        return res.status(404).json({ error: 'No file available for download' });
      }

      // Record unique download for authenticated user
      if (req.user && req.user.userId) {
        await libraryService.recordDownload(req.params.id, req.user.userId);
      }

      // Redirect to file URL or stream file
      res.redirect(item.file_url);
    } catch (error) {
      logger.error('Error in downloadFile:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Track download (for front-end download tracking)
   * POST /api/library/items/:id/download
   */
  async trackDownload(req, res) {
    try {
      const item = await libraryService.getItemById(req.params.id);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Record download (simpler increment for authenticated users)
      await libraryService.recordDownload(req.params.id);

      res.json({
        success: true,
        message: 'Download recorded'
      });
    } catch (error) {
      logger.error('Error in trackDownload:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search items
   * GET /api/library/items/search
   */
  async searchItems(req, res) {
    try {
      const searchOptions = {
        query: req.query.q,
        category_id: req.query.category_id,
        item_type: req.query.item_type,
        format: req.query.format,
        language: req.query.language,
        author: req.query.author,
        publisher: req.query.publisher,
        minPages: req.query.min_pages ? parseInt(req.query.min_pages) : undefined,
        maxPages: req.query.max_pages ? parseInt(req.query.max_pages) : undefined,
        status: req.query.status || 'available',
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sort_by || 'created_at',
        sortOrder: req.query.sort_order || 'desc'
      };

      const result = await libraryService.searchItems(searchOptions);
      res.json(result);
    } catch (error) {
      logger.error('Error in searchItems:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get featured items
   * GET /api/library/items/featured
   */
  async getFeaturedItems(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const items = await libraryService.getFeaturedItems(limit);
      res.json(items);
    } catch (error) {
      logger.error('Error in getFeaturedItems:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get popular items
   * GET /api/library/items/popular
   */
  async getPopularItems(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const items = await libraryService.getPopularItems(limit);
      res.json(items);
    } catch (error) {
      logger.error('Error in getPopularItems:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get recent items
   * GET /api/library/items/recent
   */
  async getRecentItems(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const items = await libraryService.getRecentItems(limit);
      res.json(items);
    } catch (error) {
      logger.error('Error in getRecentItems:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== BORROWING ENDPOINTS ====================

  /**
   * Borrow an item
   * POST /api/library/borrowings
   */
  async borrowItem(req, res) {
    try {
      const { item_id, user_id, due_date, notes } = req.body;

      if (!item_id || !user_id || !due_date) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const borrowing = await libraryService.borrowItem(
        item_id,
        user_id,
        due_date,
        req.user.userId,
        notes
      );

      res.status(201).json(borrowing);
    } catch (error) {
      logger.error('Error in borrowItem:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Return an item
   * PUT /api/library/borrowings/:id/return
   */
  async returnItem(req, res) {
    try {
      const borrowing = await libraryService.returnItem(req.params.id, req.user.userId);
      res.json(borrowing);
    } catch (error) {
      logger.error('Error in returnItem:', error);
      const status = error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Get all borrowings
   * GET /api/library/borrowings
   */
  async getAllBorrowings(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        user_id: req.query.user_id,
        item_id: req.query.item_id,
        status: req.query.status,
        overdue: req.query.overdue === 'true'
      };

      const result = await libraryService.getAllBorrowings(options);

      // Flatten pagination to root level for frontend compatibility
      res.json({
        success: true,
        borrowings: result.borrowings,
        total: result.pagination.total,
        page: result.pagination.page,
        pages: result.pagination.pages
      });
    } catch (error) {
      logger.error('Error in getAllBorrowings:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user's borrowings
   * GET /api/library/borrowings/my
   */
  async getMyBorrowings(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status
      };

      const result = await libraryService.getUserBorrowings(req.user.userId, options);
      res.json(result);
    } catch (error) {
      logger.error('Error in getMyBorrowings:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get overdue borrowings
   * GET /api/library/borrowings/overdue
   */
  async getOverdueBorrowings(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await libraryService.getOverdueBorrowings(options);
      res.json(result);
    } catch (error) {
      logger.error('Error in getOverdueBorrowings:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== RESERVATION ENDPOINTS ====================

  /**
   * Reserve an item
   * POST /api/library/reservations
   */
  async reserveItem(req, res) {
    try {
      const { item_id, notes } = req.body;

      if (!item_id) {
        return res.status(400).json({ error: 'item_id is required' });
      }

      const reservation = await libraryService.reserveItem(item_id, req.user.userId, notes);
      res.status(201).json(reservation);
    } catch (error) {
      logger.error('Error in reserveItem:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Cancel reservation
   * DELETE /api/library/reservations/:id
   */
  async cancelReservation(req, res) {
    try {
      await libraryService.cancelReservation(req.params.id, req.user.userId);
      res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
      logger.error('Error in cancelReservation:', error);
      const status = error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * Get all reservations
   * GET /api/library/reservations
   */
  async getAllReservations(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        user_id: req.query.user_id,
        item_id: req.query.item_id,
        status: req.query.status
      };

      const result = await libraryService.getAllReservations(options);

      // Flatten pagination to root level for frontend compatibility
      res.json({
        success: true,
        reservations: result.reservations,
        total: result.pagination.total,
        page: result.pagination.page,
        pages: result.pagination.pages
      });
    } catch (error) {
      logger.error('Error in getAllReservations:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user's reservations
   * GET /api/library/reservations/my
   */
  async getMyReservations(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status
      };

      const result = await libraryService.getUserReservations(req.user.userId, options);
      res.json(result);
    } catch (error) {
      logger.error('Error in getMyReservations:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== STATISTICS ENDPOINTS ====================

  /**
   * Get library statistics
   * GET /api/library/statistics
   */
  async getLibraryStatistics(req, res) {
    try {
      const stats = await libraryService.getLibraryStatistics();
      res.json(stats);
    } catch (error) {
      logger.error('Error in getLibraryStatistics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user library statistics
   * GET /api/library/statistics/my
   */
  async getMyLibraryStatistics(req, res) {
    try {
      const stats = await libraryService.getUserLibraryStatistics(req.user.userId);
      res.json(stats);
    } catch (error) {
      logger.error('Error in getMyLibraryStatistics:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new LibraryController();
