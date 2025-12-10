const documentRepository = require('../repositories/documentRepository');
const folderRepository = require('../repositories/folderRepository');
const shareRepository = require('../repositories/shareRepository');
const storageRepository = require('../repositories/storageRepository');
const storageService = require('../../../services/storageService');
const logger = require('../../../config/winston');
const path = require('path');

class DocumentService {
  /**
   * Upload a document
   */
  async uploadDocument(file, metadata, userId) {
    try {
      // Check storage quota
      const hasStorage = await storageRepository.hasEnoughStorage(userId, file.size);
      if (!hasStorage) {
        throw new Error('Storage quota exceeded');
      }

      // Upload file to storage (Cloudflare R2)
      const fileKey = `documents/${userId}/${Date.now()}-${file.originalname}`;
      const uploadResult = await storageService.uploadFile(file.buffer, fileKey, file.mimetype);

      // Extract URL from response (storageService returns an object)
      const fileUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult.fileUrl;

      // Create document record
      const documentData = {
        user_id: userId,
        folder_id: metadata.folderId || null,
        title: metadata.title || file.originalname,
        description: metadata.description || null,
        file_url: fileUrl,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        mime_type: file.mimetype,
        tags: metadata.tags || null
      };

      const document = await documentRepository.create(documentData);

      // Update storage usage
      await storageRepository.incrementUsedStorage(userId, file.size);

      logger.info(`Document uploaded: ${document.id} by user ${userId}`);
      return document;
    } catch (error) {
      logger.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Get document by ID with access control
   */
  async getDocument(documentId, userId) {
    const document = await documentRepository.findByIdWithOwner(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Check access: owner or shared with user
    if (document.user_id !== userId) {
      const share = await shareRepository.checkUserAccess(documentId, userId);
      if (!share) {
        throw new Error('Access denied');
      }
    }

    return document;
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(userId, options = {}) {
    return await documentRepository.findByUserId(userId, options);
  }

  /**
   * Search documents
   */
  async searchDocuments(userId, searchOptions) {
    return await documentRepository.search(userId, searchOptions);
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId, updates, userId) {
    const document = await documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.user_id !== userId) {
      throw new Error('Access denied');
    }

    return await documentRepository.update(documentId, updates);
  }

  /**
   * Delete document (soft delete - move to trash)
   */
  async deleteDocument(documentId, userId) {
    const document = await documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.user_id !== userId) {
      throw new Error('Access denied');
    }

    // Soft delete (move to trash)
    await documentRepository.softDelete(documentId);

    logger.info(`Document moved to trash: ${documentId} by user ${userId}`);
  }

  /**
   * Bulk delete documents (soft delete - move to trash)
   */
  async bulkDeleteDocuments(documentIds, userId) {
    // Verify all documents belong to user
    for (const docId of documentIds) {
      const document = await documentRepository.findById(docId);
      if (!document || document.user_id !== userId) {
        throw new Error(`Access denied for document ${docId}`);
      }
    }

    await documentRepository.bulkSoftDelete(documentIds);
    logger.info(`${documentIds.length} documents moved to trash by user ${userId}`);
  }

  /**
   * Get trash documents
   */
  async getTrash(userId, options = {}) {
    return await documentRepository.getTrash(userId, options);
  }

  /**
   * Restore document from trash
   */
  async restoreDocument(documentId, userId) {
    const document = await documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.user_id !== userId) {
      throw new Error('Access denied');
    }

    if (!document.deleted_at) {
      throw new Error('Document is not in trash');
    }

    await documentRepository.restore(documentId);
    logger.info(`Document restored from trash: ${documentId} by user ${userId}`);
  }

  /**
   * Bulk restore documents from trash
   */
  async bulkRestoreDocuments(documentIds, userId) {
    // Verify all documents belong to user and are in trash
    for (const docId of documentIds) {
      const document = await documentRepository.findById(docId);
      if (!document || document.user_id !== userId) {
        throw new Error(`Access denied for document ${docId}`);
      }
      if (!document.deleted_at) {
        throw new Error(`Document ${docId} is not in trash`);
      }
    }

    await documentRepository.bulkRestore(documentIds);
    logger.info(`${documentIds.length} documents restored from trash by user ${userId}`);
  }

  /**
   * Permanently delete document
   */
  async permanentDeleteDocument(documentId, userId) {
    const document = await documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.user_id !== userId) {
      throw new Error('Access denied');
    }

    // Delete file from storage
    try {
      await storageService.deleteFile(document.file_url);
    } catch (error) {
      logger.error('Error deleting file from storage:', error);
    }

    // Permanently delete document record
    await documentRepository.permanentDelete(documentId);

    // Update storage usage if document was in trash
    if (document.deleted_at) {
      await storageRepository.decrementUsedStorage(userId, document.file_size);
    }

    logger.info(`Document permanently deleted: ${documentId} by user ${userId}`);
  }

  /**
   * Bulk permanently delete documents
   */
  async bulkPermanentDeleteDocuments(documentIds, userId) {
    // Verify all documents belong to user
    const documents = [];
    for (const docId of documentIds) {
      const document = await documentRepository.findById(docId);
      if (!document || document.user_id !== userId) {
        throw new Error(`Access denied for document ${docId}`);
      }
      documents.push(document);
    }

    // Delete files from storage
    for (const document of documents) {
      try {
        await storageService.deleteFile(document.file_url);
      } catch (error) {
        logger.error(`Error deleting file from storage: ${document.id}`, error);
      }
    }

    // Permanently delete document records
    await documentRepository.bulkPermanentDelete(documentIds);

    // Update storage usage for documents that were in trash
    for (const document of documents) {
      if (document.deleted_at) {
        await storageRepository.decrementUsedStorage(userId, document.file_size);
      }
    }

    logger.info(`${documentIds.length} documents permanently deleted by user ${userId}`);
  }

  /**
   * Empty trash (permanently delete all trash items)
   */
  async emptyTrash(userId) {
    // Get all trash documents
    const { documents } = await documentRepository.getTrash(userId, { limit: 1000 });

    if (documents.length === 0) {
      return 0;
    }

    const documentIds = documents.map(doc => doc.id);

    // Delete files from storage
    for (const document of documents) {
      try {
        await storageService.deleteFile(document.file_url);
      } catch (error) {
        logger.error(`Error deleting file from storage: ${document.id}`, error);
      }
    }

    // Permanently delete all trash documents
    await documentRepository.bulkPermanentDelete(documentIds);

    // Update storage usage
    const totalSize = documents.reduce((sum, doc) => sum + parseInt(doc.file_size || 0), 0);
    await storageRepository.decrementUsedStorage(userId, totalSize);

    logger.info(`Trash emptied: ${documents.length} documents permanently deleted by user ${userId}`);
    return documents.length;
  }

  /**
   * Create share link
   * Allows multiple shares per document
   */
  async createShare(documentId, shareData, userId) {
    const document = await documentRepository.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.user_id !== userId) {
      throw new Error('Access denied');
    }

    // If sharing with specific user ID, check if share already exists
    if (shareData.sharedWithUserId) {
      const existingShare = await shareRepository.checkUserAccess(documentId, shareData.sharedWithUserId);
      if (existingShare) {
        // Update existing share instead of creating new one
        return await shareRepository.update(existingShare.id, {
          permission_level: shareData.permissionLevel || 'view',
          expires_at: shareData.expiresAt || null,
          max_downloads: shareData.maxDownloads || null
        });
      }
    }

    // If sharing via email, check if user exists in system
    if (shareData.recipientEmail) {
      const userRepository = require('../../auth/repositories/userRepository');
      const existingUser = await userRepository.findByEmail(shareData.recipientEmail);

      if (existingUser) {
        shareData.sharedWithUserId = existingUser.id;
        // Check if share already exists for this user
        const existingShare = await shareRepository.checkUserAccess(documentId, existingUser.id);
        if (existingShare) {
          return await shareRepository.update(existingShare.id, {
            permission_level: shareData.permissionLevel || 'view',
            expires_at: shareData.expiresAt || null,
            max_downloads: shareData.maxDownloads || null
          });
        }
      }
    }

    // Map email share type to link (email is not a valid DB enum value)
    if (shareData.shareType === 'email') {
      shareData.shareType = 'link';
    }

    // Generate access token for link-based shares
    if (['link', 'password', 'public'].includes(shareData.shareType)) {
      shareData.accessToken = shareRepository.generateAccessToken();
    }

    // Hash password if provided
    if (shareData.password) {
      shareData.passwordHash = await shareRepository.hashPassword(shareData.password);
      delete shareData.password;
    }

    const share = await shareRepository.create({
      document_id: documentId,
      shared_by: userId,
      shared_with_user_id: shareData.sharedWithUserId || null,
      recipient_email: shareData.recipientEmail || null,
      share_type: shareData.shareType,
      permission_level: shareData.permissionLevel || 'view',
      access_token: shareData.accessToken || null,
      password_hash: shareData.passwordHash || null,
      expires_at: shareData.expiresAt || null,
      max_downloads: shareData.maxDownloads || null
    });

    // Send email notification if sharing to a specific email
    if (shareData.recipientEmail && share.access_token) {
      try {
        const emailService = require('../../../services/emailService');
        const userRepository = require('../../auth/repositories/userRepository');
        
        // Get sharer information
        const sharer = await userRepository.findById(userId);
        const sharerName = sharer ? `${sharer.first_name || ''} ${sharer.last_name || ''}`.trim() || sharer.username : 'Someone';
        const sharerEmail = sharer ? sharer.email : '';
        
        // Format file size
        const formatFileSize = (bytes) => {
          if (bytes === 0) return '0 Bytes';
          const k = 1024;
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
        };
        
        // Get file type from mime type or extension
        const fileType = document.mime_type ? document.mime_type.split('/')[1].toUpperCase() : 
                        path.extname(document.file_name).substring(1).toUpperCase();
        
        // Build share URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const shareUrl = `${frontendUrl}/shared/${share.access_token}`;
        
        // Format expiration date if exists
        let expiresAt = null;
        if (shareData.expiresAt) {
          const expDate = new Date(shareData.expiresAt);
          expiresAt = expDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        
        // Send email notification
        await emailService.sendDocumentSharedEmail({
          recipientEmail: shareData.recipientEmail,
          documentTitle: document.title,
          documentDescription: document.description,
          fileType: fileType,
          fileSize: formatFileSize(document.file_size),
          shareUrl: shareUrl,
          sharerName: sharerName,
          sharerEmail: sharerEmail,
          hasPassword: !!shareData.passwordHash,
          expiresAt: expiresAt
        });
        
        logger.info(`Email notification sent to ${shareData.recipientEmail} for document ${documentId}`);
      } catch (emailError) {
        // Log error but don't fail the share creation
        logger.error('Error sending share notification email:', emailError);
      }
    }

    logger.info(`New share created for document ${documentId} by user ${userId}`);
    return share;
  }

  /**
   * Get document via share token
   */
  async getSharedDocument(token, password = null, email = null) {
    const share = await shareRepository.findByToken(token);

    if (!share) {
      throw new Error('Share not found');
    }

    // Check expiry
    if (shareRepository.isExpired(share)) {
      throw new Error('Share link expired');
    }

    // Check download limit
    if (shareRepository.hasReachedDownloadLimit(share)) {
      throw new Error('Download limit reached');
    }

    // Check ALL requirements first, then validate if provided
    const requiresPassword = !!share.password_hash;
    const requiresEmail = !!share.recipient_email;

    // If credentials are required but not provided, throw error indicating what's needed
    if (requiresPassword && !password && requiresEmail && !email) {
      throw new Error('Email and password required');
    } else if (requiresEmail && !email) {
      throw new Error('Email verification required');
    } else if (requiresPassword && !password) {
      throw new Error('Password required');
    }

    // Now validate the provided credentials
    if (requiresPassword && password) {
      const valid = await shareRepository.verifyPassword(password, share.password_hash);
      if (!valid) {
        throw new Error('Invalid password');
      }
    }

    if (requiresEmail && email) {
      if (email.toLowerCase() !== share.recipient_email.toLowerCase()) {
        throw new Error('Invalid email address');
      }
    }

    const document = await documentRepository.findByIdWithOwner(share.document_id);
    return { document, share };
  }

  /**
   * Get storage stats
   */
  async getStorageStats(userId) {
    return await storageRepository.getStorageStats(userId);
  }

  /**
   * Create folder
   */
  async createFolder(folderData, userId) {
    // Check if folder name already exists
    const exists = await folderRepository.nameExists(
      userId,
      folderData.name,
      folderData.parentFolderId || null
    );

    if (exists) {
      throw new Error('Folder with this name already exists in this location');
    }

    return await folderRepository.create({
      user_id: userId,
      parent_folder_id: folderData.parentFolderId || null,
      name: folderData.name,
      description: folderData.description || null
    });
  }

  /**
   * Get folder tree
   */
  async getFolderTree(userId) {
    return await folderRepository.getFolderTree(userId);
  }

  /**
   * Get folder contents (combined folders and documents with pagination)
   * Folders only show on the first page, always on top
   */
  async getFolderContents(userId, options = {}) {
    const { page = 1, limit = 50, folderId = null, sortBy = 'name', sortOrder = 'asc' } = options;

    // Only get folders on the first page
    let foldersWithCounts = [];
    if (page === 1) {
      const folders = await folderRepository.findByUserId(userId, {
        parentFolderId: folderId
      });

      // Calculate file counts and total size for folders
      const knex = require('../../../config/knex');
      foldersWithCounts = await Promise.all(
        (Array.isArray(folders) ? folders : []).map(async (folder) => {
          // Get total size of all documents in this folder
          const result = await knex('documents')
            .where({ folder_id: folder.id })
            .whereNull('deleted_at')
            .sum('file_size as total_size')
            .first();

          return {
            ...folder,
            type: 'folder',
            file_count: await folderRepository.getDocumentCount(folder.id),
            subfolder_count: await folderRepository.getSubfolderCount(folder.id),
            total_size: parseInt(result.total_size) || 0
          };
        })
      );

      // Sort folders by name
      foldersWithCounts.sort((a, b) => {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    }

    // Get paginated documents
    const documentsResult = await documentRepository.findByUserId(userId, {
      folderId,
      page,
      limit,
      sortBy: sortBy === 'name' ? 'title' : sortBy,
      sortOrder
    });

    // Add type to documents
    const documents = (documentsResult.documents || []).map(doc => ({
      ...doc,
      type: 'document'
    }));

    // On first page: folders first, then documents. On other pages: only documents
    const items = page === 1 ? [...foldersWithCounts, ...documents] : documents;

    // Calculate total items (only documents are paginated)
    const totalDocuments = documentsResult.pagination?.total || 0;
    const totalPages = Math.ceil(totalDocuments / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total: totalDocuments,
        pages: totalPages
      }
    };
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId, userId) {
    const folder = await folderRepository.findById(folderId);

    if (!folder) {
      throw new Error('Folder not found');
    }

    if (folder.user_id !== userId) {
      throw new Error('Access denied');
    }

    // Check if folder has subfolders
    const subfolderCount = await folderRepository.getSubfolderCount(folderId);
    if (subfolderCount > 0) {
      throw new Error('Folder contains subfolders. Please delete them first.');
    }

    // Check if folder has documents
    const documentCount = await folderRepository.getDocumentCount(folderId);
    if (documentCount > 0) {
      throw new Error('Folder contains documents. Please move or delete them first.');
    }

    await folderRepository.delete(folderId);
  }
}

module.exports = new DocumentService();
