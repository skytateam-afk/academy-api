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

// Public-ish routes (Self-access allowed)


// Institution Dashboard View Permission (Global for remaining routes)
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
router.put('/students/:id', requirePermission('institution.students.manage'), institutionDashboardController.updateStudent);
router.patch('/students/:id/status', requirePermission('institution.students.manage'), institutionDashboardController.updateStudentStatus);

// Pathway Management
router.get('/pathways', requirePermission('institution.pathways.manage'), institutionDashboardController.getPathways);
router.post('/pathways/assign',
    requirePermission('institution.pathways.manage'),
    institutionDashboardController.assignPathway
);
// New: Assign Single Student
router.post('/pathways/assign-single',
    requirePermission('institution.pathways.manage'),
    institutionDashboardController.assignSinglePathway
);

// Analytics Routes
router.get('/analytics/activity',
    requirePermission('institution.dashboard.view'),
    institutionDashboardController.getRecentStudentActivity
);

router.get('/analytics/pathways/top',
    requirePermission('institution.dashboard.view'),
    institutionDashboardController.getTopPerformingPathways
);

router.get('/analytics/pathways/attention',
    requirePermission('institution.dashboard.view'),
    institutionDashboardController.getPathwaysNeedingAttention
);



module.exports = router;
