const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { authenticateToken } = require('../../../middleware/auth');

// POST /legal/accept-policy
router.post('/accept-policy', authenticateToken, policyController.acceptPolicy);

module.exports = router;
