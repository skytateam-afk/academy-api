/**
 * XP Routes
 * API routes for XP system
 */

const express = require('express');
const router = express.Router();
const xpController = require('../controllers/xpController');
const { authenticateToken } = require('../../../middleware/auth');
const uploadImage = require('../../../middleware/uploadImage');

// All XP routes require authentication
router.use(authenticateToken);

// Get current user's XP profile
router.get('/profile', xpController.getXPProfile);

// Get XP transaction history
router.get('/history', xpController.getXPHistory);

// Get XP leaderboard (with pagination)
router.get('/leaderboard', xpController.getLeaderboard);

// Get all XP levels/badges
router.get('/levels', xpController.getLevels);

// Get user's level information
router.get('/level', xpController.getUserLevel);

// Admin XP Level Management (admin only)
router.post('/levels/badge', uploadImage.single('badge'), xpController.uploadBadgeImage);
router.post('/levels', xpController.createLevel);
router.put('/levels/:id', xpController.updateLevel);
router.delete('/levels/:id', xpController.deleteLevel);
router.patch('/levels/:id/toggle', xpController.toggleLevel);

// Admin XP Activities Management
const xpActivitiesController = require('../controllers/xpActivitiesController');

// XP Activities management routes
router.get('/activities', xpActivitiesController.getXPActivities);
router.post('/activities', xpActivitiesController.createXPActivity);
router.put('/activities/:id', xpActivitiesController.updateXPActivity);
router.delete('/activities/:id', xpActivitiesController.deleteXPActivity);
router.patch('/activities/:id/toggle', xpActivitiesController.toggleXPActivity);

module.exports = router;
