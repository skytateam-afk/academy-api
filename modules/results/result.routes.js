/**
 * Result Routes
 */

const express = require('express');
const router = express.Router();
const resultController = require('./result.controller');
const { authenticateToken } = require('../../middleware/auth');
const multer = require('multer');

// Configure multer for CSV uploads - use memory storage for R2
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit for CSV files
    }
});

// Configure multer for signature image uploads - use memory storage for R2
const uploadSignature = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit for images
    }
});

// ============= BATCH MANAGEMENT =============
// Batch routes
router.post('/batches', authenticateToken, resultController.createBatch);
router.get('/batches', authenticateToken, resultController.getAllBatches);
router.get('/batches/:batchId', authenticateToken, resultController.getBatchById);
router.put('/batches/:batchId', authenticateToken, resultController.updateBatch);
router.patch('/batches/:batchId/signatures', authenticateToken, resultController.updateBatchSignatures);
router.post('/batches/:batchId/signature', authenticateToken, uploadSignature.single('signature'), resultController.uploadSignature);
router.get('/batches/:batchId/template', authenticateToken, resultController.downloadBatchTemplate);
router.post('/batches/:batchId/upload', authenticateToken, upload.single('csv'), resultController.uploadBatchCSV);
router.post('/batches/:batchId/publish', authenticateToken, resultController.publishBatch);
router.patch('/batches/:batchId/status', authenticateToken, resultController.updateBatchStatus);
router.delete('/batches/:batchId', authenticateToken, resultController.deleteBatch);
router.get('/batches/:batchId/results', authenticateToken, resultController.getBatchResults);

// ============= SETTINGS (Subjects & Grading Scales) =============
// Subjects
router.get('/subjects', authenticateToken, resultController.getSubjects);
router.post('/subjects', authenticateToken, resultController.createSubject);
router.put('/subjects/:subjectId', authenticateToken, resultController.updateSubject);
router.patch('/subjects/:subjectId/toggle-status', authenticateToken, resultController.toggleSubjectStatus);
router.delete('/subjects/:subjectId', authenticateToken, resultController.deleteSubject);

// Grading Scales
router.get('/grading-scales', authenticateToken, resultController.getGradingScales);
router.post('/grading-scales', authenticateToken, resultController.createGradingScale);
router.put('/grading-scales/:scaleId', authenticateToken, resultController.updateGradingScale);
router.patch('/grading-scales/:scaleId/toggle-default', authenticateToken, resultController.toggleGradingScaleDefault);
router.delete('/grading-scales/:scaleId', authenticateToken, resultController.deleteGradingScale);

// ============= SUBJECT GROUPS =============
router.post('/subject-groups', authenticateToken, resultController.createSubjectGroup);
router.get('/subject-groups', authenticateToken, resultController.getAllSubjectGroups);
router.get('/subject-groups/:groupId', authenticateToken, resultController.getSubjectGroupById);
router.put('/subject-groups/:groupId', authenticateToken, resultController.updateSubjectGroup);
router.delete('/subject-groups/:groupId', authenticateToken, resultController.deleteSubjectGroup);

// ============= LEGACY ROUTES =============
// Results (legacy - for backward compatibility)
router.post('/import', authenticateToken, resultController.importResults);
router.get('/class/:classroomId', authenticateToken, resultController.getClassResults);
router.get('/student/:studentId/report-card', authenticateToken, resultController.getStudentReportCard);

module.exports = router;
