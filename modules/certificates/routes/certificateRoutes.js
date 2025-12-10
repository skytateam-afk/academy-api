/**
 * Certificate Routes
 */

const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateToken } = require('../../../middleware/auth');

// Protected routes (require authentication)
router.post('/courses/:courseId/certificate', authenticateToken, certificateController.generateCertificate);
router.get('/courses/:courseId/certificate', authenticateToken, certificateController.getCertificate);
router.get('/courses/:courseId/certificate/eligibility', authenticateToken, certificateController.checkCertificateEligibility);
router.get('/my-certificates', authenticateToken, certificateController.getUserCertificates);

// Public routes (no authentication required)
router.get('/verify/:certificateNumber', certificateController.verifyCertificate);
router.get('/users/:userId/certificates', certificateController.getUserCertificatesById);

module.exports = router;
