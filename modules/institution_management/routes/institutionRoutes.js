/**
 * Institution Routes
 */

const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const logger = require('../../../config/winston');

// All routes require authentication
router.use(authenticateToken);

// Get all institutions (Admin only)
router.get(
    '/',
    requirePermission('institution.view'),
    institutionController.getAllInstitutions
);

// Create institution (Admin only)
router.post(
    '/',
    requirePermission('institution.create'),
    institutionController.createInstitution
);

// Get institution by ID (Admin only)
router.get(
    '/:id',
    requirePermission('institution.view'),
    institutionController.getInstitutionById
);

// Update institution (Admin only)
router.put(
    '/:id',
    requirePermission('institution.update'),
    institutionController.updateInstitution
);

// Delete institution (Admin only)
router.delete(
    '/:id',
    requirePermission('institution.delete'),
    institutionController.deleteInstitution
);

logger.info('INSTITUTION ROUTES LOADED SUCCESSFULLY');

module.exports = router;
