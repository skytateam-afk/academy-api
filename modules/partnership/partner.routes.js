/**
 * Partner Routes
 * Defines API endpoints for partnership inquiries
 */

const express = require('express');
const router = express.Router();
const partnerController = require('./partner.controller');
const { authenticateToken } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');

// POST /api/partners - Submit a new inquiry
router.post('/', partnerController.createPartner);

// GET /api/partners - Protected route (Super Admin only via permission)
router.get('/', authenticateToken, requirePermission('view.partners'), partnerController.getPartners);

module.exports = router;
