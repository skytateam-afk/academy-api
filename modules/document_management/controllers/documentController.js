const documentService = require('../services/documentService');
const shareRepository = require('../repositories/shareRepository');
const logger = require('../../../config/winston');

class DocumentController {
  /**
   * Upload document
   * POST /api/documents/upload
   */
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const metadata = {
        title: req.body.title,
        description: req.body.description,
        folderId: req.body.folder_id,
        tags: req.body.tags ? JSON.parse(req.body.tags) : null
      };

      const document = await documentService.uploadDocument(
        req.file,
        metadata,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        document
      });
    } catch (error) {
      logger.error('Error in uploadDocument:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get user's documents
   * GET /api/documents
   */
  async getDocuments(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        folderId: req.query.folder_id,
        fileType: req.query.file_type,
        search: req.query.search,
        sortBy: req.query.sort_by || 'created_at',
        sortOrder: req.query.sort_order || 'desc'
      };

      const result = await documentService.getUserDocuments(req.user.userId, options);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Error in getDocuments:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get document by ID
   * GET /api/documents/:id
   */
  async getDocument(req, res) {
    try {
      const document = await documentService.getDocument(req.params.id, req.user.userId);

      // Increment view count
      const documentRepository = require('../repositories/documentRepository');
      await documentRepository.incrementViewCount(req.params.id);

      res.json({
        success: true,
        document
      });
    } catch (error) {
      logger.error('Error in getDocument:', error);
      const status = error.message === 'Document not found' ? 404 : 403;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Search documents
   * GET /api/documents/search
   */
  async searchDocuments(req, res) {
    try {
      const searchOptions = {
        query: req.query.q,
        fileType: req.query.file_type,
        tags: req.query.tags ? req.query.tags.split(',') : null,
        folderId: req.query.folder_id,
        dateFrom: req.query.date_from,
        dateTo: req.query.date_to,
        minSize: req.query.min_size,
        maxSize: req.query.max_size,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sort_by || 'created_at',
        sortOrder: req.query.sort_order || 'desc'
      };

      const result = await documentService.searchDocuments(req.user.userId, searchOptions);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Error in searchDocuments:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Update document
   * PATCH /api/documents/:id
   */
  async updateDocument(req, res) {
    try {
      const updates = {
        title: req.body.title,
        description: req.body.description,
        folder_id: req.body.folder_id,
        tags: req.body.tags
      };

      // Remove undefined fields
      Object.keys(updates).forEach(key =>
        updates[key] === undefined && delete updates[key]
      );

      const document = await documentService.updateDocument(
        req.params.id,
        updates,
        req.user.userId
      );

      res.json({
        success: true,
        document
      });
    } catch (error) {
      logger.error('Error in updateDocument:', error);
      const status = error.message === 'Document not found' ? 404 : 403;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Delete document (move to trash)
   * DELETE /api/documents/:id
   */
  async deleteDocument(req, res) {
    try {
      await documentService.deleteDocument(req.params.id, req.user.userId);

      res.json({
        success: true,
        message: 'Document moved to trash successfully'
      });
    } catch (error) {
      logger.error('Error in deleteDocument:', error);
      const status = error.message === 'Document not found' ? 404 : 403;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Bulk delete documents (move to trash)
   * POST /api/documents/bulk-delete
   */
  async bulkDeleteDocuments(req, res) {
    try {
      const { documentIds } = req.body;

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Document IDs array is required'
        });
      }

      await documentService.bulkDeleteDocuments(documentIds, req.user.userId);

      res.json({
        success: true,
        message: `${documentIds.length} document(s) moved to trash successfully`
      });
    } catch (error) {
      logger.error('Error in bulkDeleteDocuments:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get trash documents
   * GET /api/documents/trash
   */
  async getTrash(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sort_by || 'deleted_at',
        sortOrder: req.query.sort_order || 'desc'
      };

      const result = await documentService.getTrash(req.user.userId, options);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Error in getTrash:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Restore document from trash
   * POST /api/documents/:id/restore
   */
  async restoreDocument(req, res) {
    try {
      await documentService.restoreDocument(req.params.id, req.user.userId);

      res.json({
        success: true,
        message: 'Document restored successfully'
      });
    } catch (error) {
      logger.error('Error in restoreDocument:', error);
      const status = error.message === 'Document not found' ? 404 : 403;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Bulk restore documents from trash
   * POST /api/documents/bulk-restore
   */
  async bulkRestoreDocuments(req, res) {
    try {
      const { documentIds } = req.body;

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Document IDs array is required'
        });
      }

      await documentService.bulkRestoreDocuments(documentIds, req.user.userId);

      res.json({
        success: true,
        message: `${documentIds.length} document(s) restored successfully`
      });
    } catch (error) {
      logger.error('Error in bulkRestoreDocuments:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Permanently delete document
   * DELETE /api/documents/:id/permanent
   */
  async permanentDeleteDocument(req, res) {
    try {
      await documentService.permanentDeleteDocument(req.params.id, req.user.userId);

      res.json({
        success: true,
        message: 'Document permanently deleted'
      });
    } catch (error) {
      logger.error('Error in permanentDeleteDocument:', error);
      const status = error.message === 'Document not found' ? 404 : 403;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Bulk permanently delete documents
   * POST /api/documents/bulk-permanent-delete
   */
  async bulkPermanentDeleteDocuments(req, res) {
    try {
      const { documentIds } = req.body;

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Document IDs array is required'
        });
      }

      await documentService.bulkPermanentDeleteDocuments(documentIds, req.user.userId);

      res.json({
        success: true,
        message: `${documentIds.length} document(s) permanently deleted`
      });
    } catch (error) {
      logger.error('Error in bulkPermanentDeleteDocuments:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Empty trash (permanently delete all trash items)
   * DELETE /api/documents/trash/empty
   */
  async emptyTrash(req, res) {
    try {
      const count = await documentService.emptyTrash(req.user.userId);

      res.json({
        success: true,
        message: `${count} document(s) permanently deleted from trash`
      });
    } catch (error) {
      logger.error('Error in emptyTrash:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Download document
   * GET /api/documents/:id/download
   * Supports both header and query param authentication
   */
  async downloadDocument(req, res) {
    try {
      // Get userId from req.user (set by authenticateToken middleware)
      // If not present, try to verify token from query param
      let userId = req.user?.userId;

      if (!userId && req.query.token) {
        // Manually verify token from query parameter
        const jwt = require('jsonwebtoken');
        try {
          const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
          userId = decoded.userId;
        } catch (err) {
          return res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
          });
        }
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const document = await documentService.getDocument(req.params.id, userId);

      // Increment download count
      const documentRepository = require('../repositories/documentRepository');
      await documentRepository.incrementDownloadCount(req.params.id);

      // Redirect to file URL or stream file
      res.redirect(document.file_url);
    } catch (error) {
      logger.error('Error in downloadDocument:', error);
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Create share link
   * POST /api/documents/:id/share
   */
  async createShare(req, res) {
    try {
      const shareData = {
        shareType: req.body.share_type || 'link',
        sharedWithUserId: req.body.shared_with_user_id,
        recipientEmail: req.body.recipient_email,
        permissionLevel: req.body.permission_level || 'view',
        password: req.body.password,
        expiresAt: req.body.expires_at,
        maxDownloads: req.body.max_downloads
      };

      console.log('Creating share with data:', shareData);

      const share = await documentService.createShare(
        req.params.documentId,
        shareData,
        req.user.userId
      );

      console.log('Share created:', share);

      // Build share URL
      const shareUrl = `${req.protocol}://${req.get('host')}/shared/${share.access_token}`;

      console.log('Share URL:', shareUrl);

      const response = {
        success: true,
        share: {
          ...share,
          share_url: shareUrl
        }
      };

      console.log('Sending response:', JSON.stringify(response, null, 2));

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error in createShare:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get document shares
   * GET /api/documents/:id/shares
   */
  async getDocumentShares(req, res) {
      try {
        const { documentId } = req.params;
        const userId = req.user.userId;

        // Verify ownership
        const documentRepository = require('../repositories/documentRepository'); // Assuming this is needed for ownership check
        const document = await documentRepository.findById(documentId);
        if (!document || document.user_id !== userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const shareRepository = require('../repositories/shareRepository'); // Assuming this is needed
        const shares = await shareRepository.findByDocumentId(documentId);
        res.json({ shares });
      } catch (error) {
        console.error('Error fetching document shares:', error);
        res.status(500).json({ message: error.message });
      }
    }

  /**
   * Delete share
   * DELETE /api/documents/shares/:shareId
   */
  async deleteShare(req, res) {
      try {
        const { shareId } = req.params;
        const userId = req.user.userId;

        const shareRepository = require('../repositories/shareRepository'); // Assuming this is needed
        const share = await shareRepository.findById(shareId);
        if (!share) {
          return res.status(404).json({ message: 'Share not found' });
        }

        if (share.shared_by !== userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        await shareRepository.delete(shareId);

        res.json({ message: 'Share deleted successfully' });
      } catch (error) {
        console.error('Error deleting share:', error);
        res.status(500).json({ message: error.message });
      }
    }

  /**
   * Get shares created by the current user
   * GET /api/documents/shares/created
   */
  async getCreatedShares(req, res) {
      try {
        const userId = req.user.userId;
        const shareRepository = require('../repositories/shareRepository'); // Assuming this is needed
        const shares = await shareRepository.getSharedByUser(userId);
        res.json({ shares });
      } catch (error) {
        console.error('Error fetching created shares:', error);
        res.status(500).json({ message: error.message });
      }
    }

  /**
   * Get documents shared with user
   * GET /api/documents/shared-with-me
   */
  async getSharedWithMe(req, res) {
      try {
        const shareRepository = require('../repositories/shareRepository'); // Assuming this is needed
        const documents = await shareRepository.getSharedWithUser(req.user.userId);

        res.json({
          success: true,
          documents
        });
      } catch (error) {
        logger.error('Error in getSharedWithMe:', error);
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }

  /**
   * Get storage statistics
   * GET /api/documents/storage
   */
  async getStorageStats(req, res) {
      try {
        const stats = await documentService.getStorageStats(req.user.userId);

        res.json({
          success: true,
          storage: stats
        });
      } catch (error) {
        logger.error('Error in getStorageStats:', error);
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }

  /**
   * Create folder
   * POST /api/documents/folders
   */
  async createFolder(req, res) {
      try {
        const folderData = {
          name: req.body.name,
          description: req.body.description,
          parentFolderId: req.body.parent_folder_id
        };

        const folder = await documentService.createFolder(folderData, req.user.userId);

        res.status(201).json({
          success: true,
          folder
        });
      } catch (error) {
        logger.error('Error in createFolder:', error);
        res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

  /**
   * Get folder tree
   * GET /api/documents/folders
   */
  async getFolderTree(req, res) {
      try {
        const folders = await documentService.getFolderTree(req.user.userId);

        res.json({
          success: true,
          folders
        });
      } catch (error) {
        logger.error('Error in getFolderTree:', error);
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }

  /**
   * Get folder path (breadcrumb)
   * GET /api/documents/folders/:id/path
   */
  async getFolderPath(req, res) {
      try {
        const folderRepository = require('../repositories/folderRepository');
        const path = await folderRepository.getFolderPath(req.params.id);

        res.json({
          success: true,
          path
        });
      } catch (error) {
        logger.error('Error in getFolderPath:', error);
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }

  /**
   * Get folder contents (both folders and documents combined with pagination)
   * GET /api/documents/contents
   */
  async getFolderContents(req, res) {
      try {
        // Parse folder_id properly - convert empty string or 'null' to actual null
        let folderId = req.query.folder_id;
        if (!folderId || folderId === 'null' || folderId === 'undefined') {
          folderId = null;
        }

        const options = {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 100,
          folderId: folderId,
          sortBy: req.query.sort_by || 'name',
          sortOrder: req.query.sort_order || 'asc'
        };

        const result = await documentService.getFolderContents(req.user.userId, options);

        res.json({
          success: true,
          ...result
        });
      } catch (error) {
        logger.error('Error in getFolderContents:', error);
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }

  /**
   * Delete folder
   * DELETE /api/documents/folders/:id
   */
  async deleteFolder(req, res) {
      try {
        await documentService.deleteFolder(req.params.id, req.user.userId);

        res.json({
          success: true,
          message: 'Folder deleted successfully'
        });
      } catch (error) {
        logger.error('Error in deleteFolder:', error);
        res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
  /**
   * Update user quota (Admin only)
   * POST /api/documents/quota
   */
  async updateUserQuota(req, res) {
      try {
        const { userId, quotaBytes } = req.body;

        if (!userId || quotaBytes === undefined) {
          return res.status(400).json({
            success: false,
            message: 'User ID and quota bytes are required'
          });
        }

        // Import storage repository directly since this is an admin function
        const storageRepository = require('../repositories/storageRepository');

        const storage = await storageRepository.updateQuota(userId, quotaBytes);

        res.json({
          success: true,
          message: 'User quota updated successfully',
          storage
        });
      } catch (error) {
        logger.error('Error in updateUserQuota:', error);
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }

  /**
   * Get shared document (public, no auth required)
   * GET /api/documents/shared/:token
   */
  async getSharedDocument(req, res) {
      try {
        const { token } = req.params;
        const { password, email } = req.query;

        const { document, share } = await documentService.getSharedDocument(token, password, email);

        // Increment view count
        const documentRepository = require('../repositories/documentRepository');
        await documentRepository.incrementViewCount(document.id);

        res.json({
          success: true,
          document,
          share: {
            id: share.id,
            permission_level: share.permission_level,
            expires_at: share.expires_at,
            max_downloads: share.max_downloads,
            download_count: share.download_count,
            requires_password: !!share.password_hash
          }
        });
      } catch (error) {
        logger.error('Error in getSharedDocument:', error);

        // Return appropriate status codes
        if (error.message === 'Share not found') {
          return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === 'Share link expired') {
          return res.status(410).json({ success: false, message: error.message });
        }
        if (error.message === 'Password required' || error.message === 'Invalid password') {
          return res.status(401).json({ success: false, message: error.message });
        }
        if (error.message === 'Download limit reached') {
          return res.status(403).json({ success: false, message: error.message });
        }

        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }

  /**
   * Download shared document (public, no auth required)
   * GET /api/documents/shared/:token/download
   */
  async downloadSharedDocument(req, res) {
      try {
        const { token } = req.params;
        const { password, email } = req.query;

        const { document, share } = await documentService.getSharedDocument(token, password, email);

        // Increment download count
        const documentRepository = require('../repositories/documentRepository');
        await documentRepository.incrementDownloadCount(document.id);

        // Increment share download count
        await shareRepository.incrementDownloadCount(share.id);

        // Redirect to file URL or stream file
        res.redirect(document.file_url);
      } catch (error) {
        logger.error('Error in downloadSharedDocument:', error);

        // Return appropriate status codes
        if (error.message === 'Share not found') {
          return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message === 'Share link expired') {
          return res.status(410).json({ success: false, message: error.message });
        }
        if (error.message === 'Password required' || error.message === 'Invalid password' || error.message === 'Email verification required' || error.message === 'Invalid email address') {
          return res.status(401).json({ success: false, message: error.message });
        }
        if (error.message === 'Download limit reached') {
          return res.status(403).json({ success: false, message: error.message });
        }

        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  }

module.exports = new DocumentController();
