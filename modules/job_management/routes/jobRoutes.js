const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken, optionalAuthenticateToken } = require('../../../middleware/auth');
const { requireAdmin } = require('../../../middleware/rbac');
const multer = require('multer');

// Configure multer for memory storage (for R2 upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// -- User Job Profile Routes --
router.get('/jobs/profile/me', authenticateToken, jobController.getMyJobProfile);
router.post('/jobs/profile/me',
    authenticateToken,
    upload.single('resume'),
    jobController.saveMyJobProfile
);

// -- Public Routes --
router.get('/jobs', optionalAuthenticateToken, jobController.listPublicJobs);
router.get('/jobs/:id', optionalAuthenticateToken, jobController.getJobDetail);
router.post('/jobs/:id/apply',
    upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'cover_letter', maxCount: 1 }]),
    jobController.applyForJob
);

// -- Admin Routes --
router.get('/admin/jobs', authenticateToken, requireAdmin, jobController.listAdminJobs);
router.post('/admin/jobs',
    authenticateToken,
    requireAdmin,
    upload.single('company_logo'),
    jobController.createJob
);
router.get('/admin/jobs/:id', authenticateToken, requireAdmin, jobController.getAdminJob);
router.put('/admin/jobs/:id',
    authenticateToken,
    requireAdmin,
    upload.single('company_logo'),
    jobController.updateJob
);
router.delete('/admin/jobs/:id', authenticateToken, requireAdmin, jobController.deleteJob);
router.patch('/admin/jobs/:id/status', authenticateToken, requireAdmin, jobController.toggleStatus);

router.get('/admin/jobs/:id/applications', authenticateToken, requireAdmin, jobController.listJobApplications);

// -- Admin Application Management Routes --
router.patch('/admin/jobs/applications/:id/status', authenticateToken, requireAdmin, jobController.updateApplicationStatus);
router.delete('/admin/jobs/applications/:id', authenticateToken, requireAdmin, jobController.deleteApplication);

// -- Admin Job Profile Routes --
router.get('/admin/job-profiles', authenticateToken, requireAdmin, jobController.listAllJobProfiles);
router.delete('/admin/job-profiles/:id', authenticateToken, requireAdmin, jobController.deleteJobProfile);

module.exports = router;
