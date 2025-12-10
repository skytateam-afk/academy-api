const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken } = require('../../../middleware/auth');
const { uploadDocument, handleUploadError } = require('../../../middleware/uploadDocument');

// Public routes (no authentication required)
router.get('/shared/:token', documentController.getSharedDocument);
router.get('/shared/:token/download', documentController.downloadSharedDocument);

// Conditional authentication wrapper - checks for query token first
const conditionalAuth = (req, res, next) => {
  // If token is in query param, skip header auth and let controller handle it
  if (req.query.token) {
    return next();
  }
  // Otherwise, require header authentication
  return authenticateToken(req, res, next);
};

// All other routes require authentication (or query token for download)
router.use(conditionalAuth);

// Folder routes (MUST come before /:id routes to avoid conflicts)
router.post('/folders', documentController.createFolder);
router.get('/folders', documentController.getFolderTree);
router.get('/folders/:id/path', documentController.getFolderPath);
router.delete('/folders/:id', documentController.deleteFolder);

// Document routes
router.post('/upload', uploadDocument, handleUploadError, documentController.uploadDocument);
router.get('/contents', documentController.getFolderContents);
router.get('/', documentController.getDocuments);
router.get('/search', documentController.searchDocuments);
router.get('/shared-with-me', documentController.getSharedWithMe);
router.get('/storage', documentController.getStorageStats);

// Trash/Recycle Bin routes (MUST come before /:id routes)
router.get('/trash', documentController.getTrash);
router.delete('/trash/empty', documentController.emptyTrash);
router.post('/bulk-delete', documentController.bulkDeleteDocuments);
router.post('/bulk-restore', documentController.bulkRestoreDocuments);
router.post('/bulk-permanent-delete', documentController.bulkPermanentDeleteDocuments);

// Single document routes
router.get('/:id', documentController.getDocument);
router.patch('/:id', documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);
router.get('/:id/download', documentController.downloadDocument);  // Uses conditionalAuth from router.use above
router.post('/:id/restore', documentController.restoreDocument);
router.delete('/:id/permanent', documentController.permanentDeleteDocument);

// Share management
router.post('/:documentId/share', documentController.createShare);
router.get('/:documentId/shares', documentController.getDocumentShares);
router.delete('/shares/:shareId', documentController.deleteShare);
router.get('/shares/created', documentController.getCreatedShares); // New route

// Admin routes
// TODO: Add proper admin middleware check here
router.post('/quota', documentController.updateUserQuota);

module.exports = router;
