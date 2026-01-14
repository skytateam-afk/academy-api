/**
 * AI Management Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const conversationController = require('../controllers/conversationController');
const feedbackController = require('../controllers/feedbackController');
const widgetConfigController = require('../controllers/widgetConfigController');
const widgetAuthController = require('../controllers/widgetAuthController');
const promptController = require('../controllers/promptController');
const knowledgeBaseController = require('../controllers/knowledgeBaseController');

// Configure multer for file uploads (CSV files for knowledge base)
const uploadDir = path.join(__dirname, '../../../uploads/knowledge-base');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// ============================================================================
// Conversation Routes
// ============================================================================
router.get('/conversations', conversationController.list);
router.get('/conversations/analytics', conversationController.getAnalytics);
router.get('/conversations/:sessionId', conversationController.getById);
router.delete('/conversations/:sessionId', conversationController.delete);

// ============================================================================
// Feedback Routes
// ============================================================================
router.get('/feedbacks', feedbackController.list);
router.get('/feedbacks/analytics', feedbackController.getAnalytics);
router.get('/feedbacks/:id', feedbackController.getById);
router.delete('/feedbacks/:id', feedbackController.delete);

// ============================================================================
// Widget Config Routes
// ============================================================================
router.get('/widget-config', widgetConfigController.getActive);
router.get('/widget-config/all', widgetConfigController.list);
router.get('/widget-config/:id', widgetConfigController.getById);
router.post('/widget-config', widgetConfigController.create);
router.put('/widget-config/:id', widgetConfigController.update);
router.put('/widget-config/:id/activate', widgetConfigController.activate);
router.delete('/widget-config/:id', widgetConfigController.delete);

// ============================================================================
// Widget Authentication Routes
// ============================================================================
router.post('/widget/request-otp', widgetAuthController.requestOTP);
router.post('/widget/verify-otp', widgetAuthController.verifyOTP);

// ============================================================================
// Prompt Routes
// ============================================================================
router.get('/prompts', promptController.list);
router.get('/prompts/versions', promptController.getVersions);
router.get('/prompts/version/:version', promptController.getByVersion);
router.get('/prompts/version/:version/:name', promptController.getByVersionAndName);
router.get('/prompts/:id', promptController.getById);
router.post('/prompts', promptController.create);
router.put('/prompts/:id', promptController.update);
router.put('/prompts/version/:version/activate', promptController.activateVersion);
router.delete('/prompts/:id', promptController.delete);

// ============================================================================
// Knowledge Base Routes
// ============================================================================
router.get('/knowledge-base', knowledgeBaseController.list);
router.get('/knowledge-base/collections', knowledgeBaseController.getCollections);
router.get('/knowledge-base/stats', knowledgeBaseController.getStats);
router.get('/knowledge-base/:id', knowledgeBaseController.getById);
router.post('/knowledge-base/ingest', upload.single('file'), knowledgeBaseController.ingest);
router.get('/knowledge-base/ingest/progress/:jobId', knowledgeBaseController.getProgress);
router.delete('/knowledge-base/:id', knowledgeBaseController.delete);
router.delete('/knowledge-base/collection/:collectionName', knowledgeBaseController.clearCollection);

module.exports = router;
