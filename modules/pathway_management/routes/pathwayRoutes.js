/**
 * Pathway Routes
 */

const express = require('express');
const router = express.Router();
const pathwayController = require('../controllers/pathwayController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const uploadImage = require('../../../middleware/uploadImage');
const logger = require('../../../config/winston');

// Public routes (no authentication required)
router.get('/featured', pathwayController.getFeaturedPathways);
router.get('/slug/:slug', pathwayController.getPathwayBySlug);

// Protected routes (authentication required)
router.use(authenticateToken);

// Debug middleware to catch all requests to pathways
router.use((req, res, next) => {
  console.log('🎯 PATHWAY ROUTE HIT:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    params: req.params,
    query: req.query,
    bodyKeys: req.body ? Object.keys(req.body) : 'no body',
    contentType: req.headers['content-type'],
    filesKeys: req.files ? Object.keys(req.files) : 'no files',
    user: req.user ? { id: req.user.userId } : 'NO USER'
  });
  next();
});

// ====================== PATHWAY APPLICATION ROUTES ======================
// These must come before /:id routes to avoid shadowing

// Student routes
router.post('/apply', pathwayController.applyForPathway);
router.get('/applications/my', pathwayController.getMyApplications);
router.get('/:pathwayId/application-check', pathwayController.checkApplicationEligibility);

// Application stats
router.get('/applications/stats', pathwayController.getApplicationStatistics);

// Application lists (Specific static routes)
router.get('/applications/noauth', pathwayController.getAllApplications); // TEMP UNAUTHENTICATED
router.get('/applications', pathwayController.getAllApplications); // TEMP UNAUTHENTICATED

// Application by ID (mixed access)
router.get('/applications/:id', pathwayController.getApplicationById);

// Review application (Admin/Staff only)
router.patch('/applications/:id/review', requirePermission('pathway.review'), pathwayController.reviewApplication);

// Delete application (Admin/Staff only)
router.delete('/applications/:id', requirePermission('pathway.review'), pathwayController.deleteApplication);

// Pathway-specific applications (Admin/Staff only)
router.get('/:id/applications', (req, res, next) => {
  console.log(`=== ROUTE HIT: /:id/applications (id: ${req.params.id}) ===`);
  return next();
}, pathwayController.getPathwayApplications);

// ====================== PATHWAY ROUTES ======================

// Get all pathways (filtered based on permissions)
router.get('/', pathwayController.getAllPathways);

// Get my pathways (Student self-service)
router.get('/my-pathways', pathwayController.getMyStudentPathways);

// Get pathway by ID
router.get('/:id', pathwayController.getPathwayById);

// Admin/Instructor routes
router.post(
  '/',
  requirePermission('pathway.create'),
  uploadImage.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  pathwayController.createPathway
);

router.put(
  '/:id',
  requirePermission('pathway.update'),
  uploadImage.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  pathwayController.updatePathway
);

router.delete(
  '/:id',
  requirePermission('pathway.delete'),
  pathwayController.deletePathway
);

router.patch(
  '/:id/publish',
  requirePermission('pathway.publish'),
  pathwayController.togglePublish
);

router.patch(
  '/:id/featured',
  requirePermission('pathway.update'),
  pathwayController.toggleFeatured
);

// Course management in pathway
router.post(
  '/:id/courses',
  requirePermission('pathway.update'),
  pathwayController.addCourse
);

router.delete(
  '/:id/courses/:courseId',
  requirePermission('pathway.update'),
  pathwayController.removeCourse
);

logger.info('PATHWAY APPLICATION ROUTES LOADED SUCCESSFULLY');

// Test endpoint to verify routes are working
router.get('/test-route', (req, res) => {
  console.log('PATHWAY TEST ROUTE HIT');
  res.json({ success: true, message: 'Pathway test route working' });
});

// Emergency fallback route
router.get('/debug', (req, res) => {
  console.log('DEBUG ROUTE HIT');
  res.json({
    success: true,
    message: 'Debug route working',
    user: req.user ? { id: req.user.userId, role: req.user.role } : 'No user',
    url: req.url,
    method: req.method,
    params: req.params,
    query: req.query
  });
});

// Direct model test endpoint
router.get('/test-applications', async (req, res) => {
  console.log('TEST APPLICATIONS ROUTE HIT');
  try {
    const Applications = require('../models/PathwayApplication');
    const result = await Applications.getAll({ limit: 10 });
    console.log('TEST RESULT:', result);
    res.json({
      success: true,
      count: result.applications.length,
      applications: result.applications.slice(0, 2),
      pagination: result.pagination
    });
  } catch (error) {
    console.error('TEST ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});



/*
// Temporarily comment out permission checks to debug routing
// Admin/Staff routes - require review permission for sensitive user data
router.get('/applications/stats', (req, res, next) => {
  console.log('=== ROUTE HIT: /applications/stats ===');
  return next();
}, requirePermission('pathway.review'), pathwayController.getApplicationStatistics);

router.get('/applications', (req, res, next) => {
  console.log('=== ROUTE HIT: /applications ===');
  console.log('USER:', req.user ? { id: req.user.userId, role: req.user.role } : 'NO USER');
  console.log('PARAMS:', req.params);
  console.log('QUERY:', req.query);
  return next();
}, requirePermission('pathway.review'), pathwayController.getAllApplications);
*/



module.exports = router;
