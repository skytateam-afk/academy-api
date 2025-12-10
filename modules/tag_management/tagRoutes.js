/**
 * Tag Management Routes
 * System-wide tagging/metadata management
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/rbac');
const tagController = require('./tagController');

// Apply authentication to all routes
router.use(authenticateToken);

// Tag management routes
router.get('/', tagController.getTags);
router.get('/keys', tagController.getTagKeys);
router.get('/keys/:key/values', tagController.getTagValues);
router.get('/categories', tagController.getCategories);
router.get('/:id', tagController.getTagById);
router.post('/', tagController.createTag);
router.patch('/:id', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

// Resource tagging routes
router.post('/resources', tagController.tagResource);
router.delete('/resources/:resource_type/:resource_id/:tag_id', tagController.untagResource);
router.get('/resources/:resource_type/:resource_id', tagController.getResourceTags);
router.post('/search', tagController.searchResourcesByTags);
router.post('/bulk', tagController.bulkTagResources);

module.exports = router;
