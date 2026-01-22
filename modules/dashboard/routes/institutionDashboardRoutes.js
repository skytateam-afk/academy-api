/**
 * Institution Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const institutionDashboardController = require('../controllers/institutionDashboardController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// All routes require authentication and institution dashboard view permission
router.use(authenticateToken);
router.use(requirePermission('institution.dashboard.view'));

// Overview Stats
router.get('/stats', institutionDashboardController.getOverviewStats);

// Student Management
router.get('/students', requirePermission('institution.students.manage'), institutionDashboardController.getStudents);
router.post('/students/bulk-upload',
    requirePermission('institution.students.manage'),
    upload.single('file'),
    institutionDashboardController.bulkUploadStudents
);

// Pathway Management
router.get('/pathways', requirePermission('institution.pathways.manage'), institutionDashboardController.getPathways);
router.post('/pathways/assign',
    requirePermission('institution.pathways.manage'),
    institutionDashboardController.assignPathway
);

module.exports = router;
