const express = require('express');
const router = express.Router();
const workProfileController = require('../controllers/workProfileController');
const { authenticateToken } = require('../../../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.get('/me/work-profile', authenticateToken, workProfileController.getMyWorkProfile);
router.put('/me/work-profile', authenticateToken, upload.single('resume'), workProfileController.updateWorkProfile);

module.exports = router;
