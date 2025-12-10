/**
 * Personalisation Routes
 */

const express = require('express');
const router = express.Router();
const personalisationController = require('../controllers/personalisationController');
const { authenticateToken } = require('../../../middleware/auth');

/**
 * @route   GET /api/personalisations
 * @desc    Get user preferences
 * @access  Private
 */
router.get('/', authenticateToken, personalisationController.getPreferences);

/**
 * @route   PATCH /api/personalisations
 * @desc    Update user preferences
 * @access  Private
 */
router.patch('/', authenticateToken, personalisationController.updatePreferences);

module.exports = router;
