const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');

/**
 * @route   GET /api/staff
 * @desc    Get all staff members with filters
 * @access  Private (HR, Admin)
 */
router.get('/', authenticateToken, requirePermission('staff.read'), staffController.getAllStaff);

/**
 * @route   GET /api/staff/generate-id
 * @desc    Generate a new staff ID
 * @access  Private (HR, Admin)
 */
router.get('/generate-id', authenticateToken, requirePermission('staff.create'), staffController.generateStaffId);

/**
 * @route   GET /api/staff/statistics/departments
 * @desc    Get department statistics
 * @access  Private (HR, Admin)
 */
router.get('/statistics/departments', authenticateToken, requirePermission('staff.read'), staffController.getDepartmentStats);

/**
 * @route   GET /api/staff/statistics/employment
 * @desc    Get employment statistics
 * @access  Private (HR, Admin)
 */
router.get('/statistics/employment', authenticateToken, requirePermission('staff.read'), staffController.getEmploymentStats);

/**
 * @route   GET /api/staff/upcoming-reviews
 * @desc    Get staff members with upcoming reviews
 * @access  Private (HR, Admin)
 */
router.get('/upcoming-reviews', authenticateToken, requirePermission('staff.read'), staffController.getUpcomingReviews);

/**
 * @route   GET /api/staff/export/csv
 * @desc    Export staff to CSV
 * @access  Private (HR, Admin)
 */
router.get('/export/csv', authenticateToken, requirePermission('staff.read'), staffController.exportToCSV);

/**
 * @route   GET /api/staff/department/:department
 * @desc    Get staff by department
 * @access  Private (HR, Admin)
 */
router.get('/department/:department', authenticateToken, requirePermission('staff.read'), staffController.getByDepartment);

/**
 * @route   GET /api/staff/by-staff-id/:staffId
 * @desc    Get staff by staff ID
 * @access  Private (HR, Admin)
 */
router.get('/by-staff-id/:staffId', authenticateToken, requirePermission('staff.read'), staffController.getStaffByStaffId);

/**
 * @route   GET /api/staff/:id
 * @desc    Get staff member by ID
 * @access  Private (HR, Admin)
 */
router.get('/:id', authenticateToken, requirePermission('staff.read'), staffController.getStaffById);

/**
 * @route   POST /api/staff
 * @desc    Create new staff member
 * @access  Private (HR, Admin)
 */
router.post('/', authenticateToken, requirePermission('staff.create'), staffController.createStaff);

/**
 * @route   POST /api/staff/bulk-update
 * @desc    Bulk update staff members
 * @access  Private (Admin)
 */
router.post('/bulk-update', authenticateToken, requirePermission('staff.update'), staffController.bulkUpdate);

/**
 * @route   PUT /api/staff/:id
 * @desc    Update staff member
 * @access  Private (HR, Admin)
 */
router.put('/:id', authenticateToken, requirePermission('staff.update'), staffController.updateStaff);

/**
 * @route   PATCH /api/staff/:id/status
 * @desc    Update employment status
 * @access  Private (HR, Admin)
 */
router.patch('/:id/status', authenticateToken, requirePermission('staff.update'), staffController.updateStatus);

/**
 * @route   PATCH /api/staff/:id/custom-fields
 * @desc    Update custom fields
 * @access  Private (HR, Admin)
 */
router.patch('/:id/custom-fields', authenticateToken, requirePermission('staff.update'), staffController.updateCustomFields);

/**
 * @route   PATCH /api/staff/:id/metadata
 * @desc    Update metadata
 * @access  Private (HR, Admin)
 */
router.patch('/:id/metadata', authenticateToken, requirePermission('staff.update'), staffController.updateMetadata);

/**
 * @route   DELETE /api/staff/:id
 * @desc    Delete staff member
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, requirePermission('staff.delete'), staffController.deleteStaff);

module.exports = router;
