/**
 * Library Service
 * Business logic for library management
 */

const categoryRepository = require('../repositories/categoryRepository');
const itemRepository = require('../repositories/itemRepository');
const borrowingRepository = require('../repositories/borrowingRepository');
const reservationRepository = require('../repositories/reservationRepository');
const logger = require('../../../config/winston');
const storageService = require('../../../services/storageService');
const notificationService = require('../../notifications/services/notificationService');

class LibraryService {
  // ==================== CATEGORY OPERATIONS ====================

  /**
   * Get all categories
   */
  async getAllCategories(options = {}) {
    try {
      return await categoryRepository.findAllWithItemCounts();
    } catch (error) {
      logger.error('Error getting all categories:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id) {
    try {
      const category = await categoryRepository.findByIdWithItemCount(id);
      if (!category) {
        throw new Error('Category not found');
      }
      return category;
    } catch (error) {
      logger.error(`Error getting category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create category
   */
  async createCategory(categoryData) {
    try {
      // Check if category with this name already exists
      const existingByName = await categoryRepository.findByName(categoryData.name);
      if (existingByName) {
        throw new Error('Category with this name already exists');
      }

      // Auto-generate slug from name if not provided
      if (!categoryData.slug && categoryData.name) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      // Ensure slug is unique by appending number if needed
      let slug = categoryData.slug;
      let counter = 1;
      let existing = await categoryRepository.findBySlug(slug);
      
      while (existing) {
        slug = `${categoryData.slug}-${counter}`;
        existing = await categoryRepository.findBySlug(slug);
        counter++;
      }
      
      categoryData.slug = slug;

      return await categoryRepository.create(categoryData);
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(id, categoryData) {
    try {
      const category = await categoryRepository.findById(id);
      if (!category) {
        throw new Error('Category not found');
      }

      // Auto-generate slug from name if name changed but slug not provided
      if (categoryData.name && !categoryData.slug) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      // If updating slug, check it doesn't exist
      if (categoryData.slug && categoryData.slug !== category.slug) {
        // Ensure slug is unique by appending number if needed
        let slug = categoryData.slug;
        let counter = 1;
        let existing = await categoryRepository.findBySlug(slug);
        
        while (existing && existing.id !== id) {
          slug = `${categoryData.slug}-${counter}`;
          existing = await categoryRepository.findBySlug(slug);
          counter++;
        }
        
        categoryData.slug = slug;
      }

      return await categoryRepository.update(id, categoryData);
    } catch (error) {
      logger.error(`Error updating category ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(id) {
    try {
      const category = await categoryRepository.findByIdWithItemCount(id);
      if (!category) {
        throw new Error('Category not found');
      }

      if (category.item_count > 0) {
        throw new Error('Cannot delete category with items. Move or delete items first.');
      }

      return await categoryRepository.delete(id);
    } catch (error) {
      logger.error(`Error deleting category ${id}:`, error);
      throw error;
    }
  }

  // ==================== ITEM OPERATIONS ====================

  /**
   * Get all items with filters
   */
  async getAllItems(options = {}) {
    try {
      return await itemRepository.findAll(options);
    } catch (error) {
      logger.error('Error getting all items:', error);
      throw error;
    }
  }

  /**
   * Get item by ID
   */
  async getItemById(id, includeDetails = false) {
    try {
      const item = includeDetails 
        ? await itemRepository.findByIdWithDetails(id)
        : await itemRepository.findById(id);
      
      if (!item) {
        throw new Error('Item not found');
      }

      // Parse tags if they exist
      if (item.tags) {
        try {
          item.tags = JSON.parse(item.tags);
        } catch (e) {
          item.tags = [];
        }
      }

      return item;
    } catch (error) {
      logger.error(`Error getting item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create item
   */
  async createItem(itemData, addedBy) {
    try {
      // Clean ISBN - treat empty strings as NULL
      if (itemData.isbn) {
        itemData.isbn = itemData.isbn.trim();
        if (itemData.isbn === '') {
          itemData.isbn = null; // Treat empty strings as null
        } else {
          // Check if ISBN already exists
          const existing = await itemRepository.findByISBN(itemData.isbn);
          if (existing) {
            throw new Error('Item with this ISBN already exists');
          }
        }
      } else {
        itemData.isbn = null; // Ensure ISBN is null when not provided
      }

      // Validate and parse publication date if provided
      if (itemData.publication_date && itemData.publication_date.trim() !== '') {
        try {
          const date = new Date(itemData.publication_date);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid publication date format');
          }
          itemData.publication_date = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        } catch (error) {
          throw new Error(`Invalid publication date: ${itemData.publication_date}. Expected format: YYYY-MM-DD`);
        }
      } else {
        // Set to null if empty string or not provided
        itemData.publication_date = null;
      }

      itemData.added_by = addedBy;
      return await itemRepository.create(itemData);
    } catch (error) {
      logger.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * Update item
   */
  async updateItem(id, itemData) {
    try {
      const item = await itemRepository.findById(id);
      if (!item) {
        throw new Error('Item not found');
      }

      // If updating ISBN, check it doesn't exist
      if (itemData.isbn && itemData.isbn !== item.isbn) {
        const existing = await itemRepository.findByISBN(itemData.isbn);
        if (existing) {
          throw new Error('Item with this ISBN already exists');
        }
      }

      return await itemRepository.update(id, itemData);
    } catch (error) {
      logger.error(`Error updating item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete item
   */
  async deleteItem(id) {
    try {
      const item = await itemRepository.findById(id);
      if (!item) {
        throw new Error('Item not found');
      }

      // Check if item has active borrowings
      const activeBorrowings = await borrowingRepository.findAll({
        item_id: id,
        status: 'borrowed'
      });

      if (activeBorrowings.borrowings.length > 0) {
        throw new Error('Cannot delete item with active borrowings');
      }

      // Delete associated files from storage if they exist
      if (item.cover_image_url) {
        try {
          await storageService.deleteFile(item.cover_image_url);
        } catch (err) {
          logger.warn('Error deleting cover image:', err);
        }
      }

      if (item.file_url) {
        try {
          await storageService.deleteFile(item.file_url);
        } catch (err) {
          logger.warn('Error deleting file:', err);
        }
      }

      return await itemRepository.delete(id);
    } catch (error) {
      logger.error(`Error deleting item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Upload item cover image
   */
  async uploadCoverImage(itemId, file) {
    try {
      const item = await itemRepository.findById(itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      // Delete old cover if exists
      if (item.cover_image_url) {
        try {
          await storageService.deleteFile(item.cover_image_url);
        } catch (err) {
          logger.warn('Error deleting old cover:', err);
        }
      }

      // Upload new cover
      const filename = file.originalname || 'cover';
      const uploadResult = await storageService.uploadFile(
        file.buffer,
        filename,
        file.mimetype,
        `library/covers`
      );

      // Update item
      return await itemRepository.update(itemId, {
        cover_image_url: uploadResult.fileUrl
      });
    } catch (error) {
      logger.error(`Error uploading cover for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Upload digital file with thumbnail (for e-books, audiobooks, PDFs, etc.)
   * @param {string} itemId - Item ID
   * @param {Object} file - Main file (PDF, MP3, etc.)
   * @param {Object} thumbnail - Thumbnail image (required)
   */
  async uploadDigitalFile(itemId, file, thumbnail) {
    try {
      const item = await itemRepository.findById(itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      if (!thumbnail) {
        throw new Error('Thumbnail is required for digital items');
      }

      // Delete old files if exist
      if (item.file_url) {
        try {
          await storageService.deleteFile(item.file_url);
        } catch (err) {
          logger.warn('Error deleting old file:', err);
        }
      }

      if (item.thumbnail_url) {
        try {
          await storageService.deleteFile(item.thumbnail_url);
        } catch (err) {
          logger.warn('Error deleting old thumbnail:', err);
        }
      }

      // Upload thumbnail
      const thumbnailFilename = thumbnail.originalname || 'thumbnail';
      const thumbnailResult = await storageService.uploadFile(
        thumbnail.buffer,
        thumbnailFilename,
        thumbnail.mimetype,
        `library/thumbnails`
      );

      // Upload main file
      const filename = file.originalname || 'document';
      const uploadResult = await storageService.uploadFile(
        file.buffer,
        filename,
        file.mimetype,
        `library/files`
      );

      // Prepare update data
      const updateData = {
        file_url: uploadResult.fileUrl,
        file_size: file.size,
        file_mime_type: file.mimetype,
        cover_image_url: thumbnailResult.fileUrl  // Use cover_image_url for frontend consistency
      };

      // For audio files, we might want to extract duration later
      // For now, it can be null and updated later if needed
      if (file.mimetype.startsWith('audio/')) {
        updateData.duration = null; // Can be populated by client or audio processing
      }

      // Update item
      return await itemRepository.update(itemId, updateData);
    } catch (error) {
      logger.error(`Error uploading file for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Upload thumbnail only
   * @param {string} itemId - Item ID
   * @param {Object} thumbnail - Thumbnail image
   */
  async uploadThumbnail(itemId, thumbnail) {
    try {
      const item = await itemRepository.findById(itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      // Delete old thumbnail if exists
      if (item.thumbnail_url) {
        try {
          await storageService.deleteFile(item.thumbnail_url);
        } catch (err) {
          logger.warn('Error deleting old thumbnail:', err);
        }
      }

      // Upload new thumbnail
      const filename = thumbnail.originalname || 'thumbnail';
      const uploadResult = await storageService.uploadFile(
        thumbnail.buffer,
        filename,
        thumbnail.mimetype,
        `library/thumbnails`
      );

      // Update item
      return await itemRepository.update(itemId, {
        cover_image_url: uploadResult.fileUrl  // Use cover_image_url for frontend consistency
      });
    } catch (error) {
      logger.error(`Error uploading thumbnail for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Search items
   */
  async searchItems(searchOptions) {
    try {
      return await itemRepository.search(searchOptions);
    } catch (error) {
      logger.error('Error searching items:', error);
      throw error;
    }
  }

  /**
   * Get featured items
   */
  async getFeaturedItems(limit = 10) {
    try {
      return await itemRepository.findFeatured(limit);
    } catch (error) {
      logger.error('Error getting featured items:', error);
      throw error;
    }
  }

  /**
   * Get popular items
   */
  async getPopularItems(limit = 10) {
    try {
      return await itemRepository.findPopular(limit);
    } catch (error) {
      logger.error('Error getting popular items:', error);
      throw error;
    }
  }

  /**
   * Get recent items
   */
  async getRecentItems(limit = 10) {
    try {
      return await itemRepository.findRecent(limit);
    } catch (error) {
      logger.error('Error getting recent items:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async recordView(itemId) {
    try {
      await itemRepository.incrementViewCount(itemId);
    } catch (error) {
      logger.error(`Error recording view for item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Record download (authenticated users only)
   * Since downloads require authentication, each download legitimately counts as one download per authenticated user
   */
  async recordDownload(itemId) {
    try {
      await itemRepository.incrementDownloadCount(itemId);
    } catch (error) {
      logger.error(`Error recording download for item ${itemId}:`, error);
      throw error;
    }
  }



  // ==================== BORROWING OPERATIONS ====================

  /**
   * Borrow an item
   */
  async borrowItem(itemId, userId, dueDate, issuedBy, notes = null) {
    try {
      const item = await itemRepository.findById(itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      if (item.status !== 'available') {
        throw new Error('Item is not available for borrowing');
      }

      if (item.available_copies <= 0) {
        throw new Error('No copies available for borrowing');
      }

      // Check if user already has this item borrowed
      const activeBorrowing = await borrowingRepository.findActiveByUserAndItem(userId, itemId);
      if (activeBorrowing) {
        throw new Error('You already have this item borrowed');
      }

      // Create borrowing record
      const borrowing = await borrowingRepository.create({
        item_id: itemId,
        user_id: userId,
        due_date: dueDate,
        notes,
        issued_by: issuedBy
      });

      // Decrease available copies
      await itemRepository.updateAvailableCopies(itemId, -1);

      // Check if there's a reservation for this user and mark it as fulfilled
      const reservation = await reservationRepository.findActiveByUserAndItem(userId, itemId);
      if (reservation) {
        await reservationRepository.markFulfilled(reservation.id);
      }

      // Send book borrowed notification (don't block if it fails)
      notificationService.sendBookBorrowedNotification(userId, item.title, dueDate)
        .catch(err => logger.error('Failed to send book borrowed notification', { error: err.message }));

      return borrowing;
    } catch (error) {
      logger.error(`Error borrowing item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Return an item
   */
  async returnItem(borrowingId, receivedBy) {
    try {
      const borrowing = await borrowingRepository.findById(borrowingId);
      if (!borrowing) {
        throw new Error('Borrowing record not found');
      }

      if (borrowing.status === 'returned') {
        throw new Error('Item already returned');
      }

      // Mark as returned
      const updatedBorrowing = await borrowingRepository.markReturned(borrowingId, receivedBy);

      // Increase available copies
      await itemRepository.updateAvailableCopies(borrowing.item_id, 1);

      // Check if there are pending reservations and notify next in queue
      const nextReservation = await reservationRepository.getNextInQueue(borrowing.item_id);
      if (nextReservation && !nextReservation.notified_at) {
        await reservationRepository.markNotified(nextReservation.id);
        
        // Get item details for notification
        const item = await itemRepository.findById(borrowing.item_id);
        
        // Send book available notification to next person in queue (don't block if it fails)
        notificationService.sendBookAvailableNotification(nextReservation.user_id, item.title)
          .catch(err => logger.error('Failed to send book available notification', { error: err.message }));
      }

      // Send book returned notification to the borrower (don't block if it fails)
      const item = await itemRepository.findById(borrowing.item_id);
      notificationService.sendBookReturnedNotification(borrowing.user_id, item.title)
        .catch(err => logger.error('Failed to send book returned notification', { error: err.message }));

      return updatedBorrowing;
    } catch (error) {
      logger.error(`Error returning item for borrowing ${borrowingId}:`, error);
      throw error;
    }
  }

  /**
   * Get all borrowings
   */
  async getAllBorrowings(options = {}) {
    try {
      return await borrowingRepository.findAll(options);
    } catch (error) {
      logger.error('Error getting all borrowings:', error);
      throw error;
    }
  }

  /**
   * Get user's borrowings
   */
  async getUserBorrowings(userId, options = {}) {
    try {
      return await borrowingRepository.findByUser(userId, options);
    } catch (error) {
      logger.error(`Error getting borrowings for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get overdue borrowings
   */
  async getOverdueBorrowings(options = {}) {
    try {
      return await borrowingRepository.findOverdue(options);
    } catch (error) {
      logger.error('Error getting overdue borrowings:', error);
      throw error;
    }
  }

  // ==================== RESERVATION OPERATIONS ====================

  /**
   * Reserve an item
   */
  async reserveItem(itemId, userId, notes = null) {
    try {
      const item = await itemRepository.findById(itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      // Check if user already has an active reservation
      const existingReservation = await reservationRepository.findActiveByUserAndItem(userId, itemId);
      if (existingReservation) {
        throw new Error('You already have an active reservation for this item');
      }

      // Check if user currently has the item borrowed
      const activeBorrowing = await borrowingRepository.findActiveByUserAndItem(userId, itemId);
      if (activeBorrowing) {
        throw new Error('You currently have this item borrowed');
      }

      // Set expiration (e.g., 7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const reservation = await reservationRepository.create({
        item_id: itemId,
        user_id: userId,
        expires_at: expiresAt,
        notes
      });

      // Send book reservation notification (don't block if it fails)
      notificationService.sendBookReservationNotification(userId, item.title, expiresAt)
        .catch(err => logger.error('Failed to send book reservation notification', { error: err.message }));

      return reservation;
    } catch (error) {
      logger.error(`Error reserving item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(reservationId, userId) {
    try {
      const reservation = await reservationRepository.findById(reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.user_id !== userId) {
        throw new Error('You can only cancel your own reservations');
      }

      if (reservation.status !== 'active') {
        throw new Error('Only active reservations can be cancelled');
      }

      return await reservationRepository.cancel(reservationId);
    } catch (error) {
      logger.error(`Error cancelling reservation ${reservationId}:`, error);
      throw error;
    }
  }

  /**
   * Get all reservations
   */
  async getAllReservations(options = {}) {
    try {
      return await reservationRepository.findAll(options);
    } catch (error) {
      logger.error('Error getting all reservations:', error);
      throw error;
    }
  }

  /**
   * Get user's reservations
   */
  async getUserReservations(userId, options = {}) {
    try {
      return await reservationRepository.findByUser(userId, options);
    } catch (error) {
      logger.error(`Error getting reservations for user ${userId}:`, error);
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get library statistics
   */
  async getLibraryStatistics() {
    try {
      const itemStats = await itemRepository.getStatistics();
      const borrowingStats = await borrowingRepository.getStatistics();
      const reservationStats = await reservationRepository.getStatistics();

      return {
        items: itemStats,
        borrowing: borrowingStats,
        reservations: reservationStats
      };
    } catch (error) {
      logger.error('Error getting library statistics:', error);
      throw error;
    }
  }

  /**
   * Get user library statistics
   */
  async getUserLibraryStatistics(userId) {
    try {
      const borrowingStats = await borrowingRepository.getStatistics({ userId });
      const reservationStats = await reservationRepository.getStatistics({ userId });

      return {
        borrowing: borrowingStats,
        reservations: reservationStats
      };
    } catch (error) {
      logger.error(`Error getting library statistics for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new LibraryService();
