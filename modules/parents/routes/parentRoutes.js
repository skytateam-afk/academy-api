/**
 * Parent Routes
 */

const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { authenticateToken } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');

// All routes require authentication and parent permissions
router.use(authenticateToken);

// Get all parents
router.get('/',
    requirePermission('parent.read'),
    parentController.getAllParents
);

// Get parent by ID
router.get('/:id',
    requirePermission('parent.read'),
    parentController.getParentById
);

// Create new parent
router.post('/',
    requirePermission('parent.create'),
    parentController.createParent
);

// Update parent
router.put('/:id',
    requirePermission('parent.update'),
    parentController.updateParent
);

// Delete parent
router.delete('/:id',
    requirePermission('parent.delete'),
    parentController.deleteParent
);

// Get students for a parent
router.get('/:id/students',
    requirePermission('parent.read'),
    parentController.getParentStudents
);

// Add student to parent
router.post('/:id/students',
    requirePermission('parent.manage_students'),
    parentController.addStudent
);

// Remove student from parent
router.delete('/students/:studentId',
    requirePermission('parent.manage_students'),
    parentController.removeStudent
);

module.exports = router;
