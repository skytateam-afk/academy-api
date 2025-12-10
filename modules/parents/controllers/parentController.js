/**
 * Parent Controller
 * Handles HTTP requests for parent management
 */

const Parent = require('../../../models/Parent');
const logger = require('../../../config/winston');

/**
 * Get all parents
 */
exports.getAllParents = async (req, res) => {
    try {
        const { page, limit, search, sort_by, sort_order } = req.query;

        const result = await Parent.getAll({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            search,
            sort_by,
            sort_order
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('Error fetching parents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch parents',
            error: error.message
        });
    }
};

/**
 * Get parent by ID
 */
exports.getParentById = async (req, res) => {
    try {
        const { id } = req.params;

        const parent = await Parent.getWithStudents(id);

        if (!parent) {
            return res.status(404).json({
                success: false,
                message: 'Parent not found'
            });
        }

        res.json({
            success: true,
            parent
        });
    } catch (error) {
        logger.error('Error fetching parent:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch parent',
            error: error.message
        });
    }
};

/**
 * Create new parent
 */
exports.createParent = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, address } = req.body;

        // Validation
        if (!first_name || !last_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and email are required'
            });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const parent = await Parent.create({
            first_name,
            last_name,
            email,
            phone,
            address
        });

        logger.info('Parent created', {
            parentId: parent.id,
            createdBy: req.user.userId
        });

        res.status(201).json({
            success: true,
            message: 'Parent created successfully',
            parent
        });
    } catch (error) {
        logger.error('Error creating parent:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create parent'
        });
    }
};

/**
 * Update parent
 */
exports.updateParent = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone, address } = req.body;

        // Validate email format if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const parent = await Parent.update(id, {
            first_name,
            last_name,
            email,
            phone,
            address
        });

        logger.info('Parent updated', {
            parentId: id,
            updatedBy: req.user.userId
        });

        res.json({
            success: true,
            message: 'Parent updated successfully',
            parent
        });
    } catch (error) {
        logger.error('Error updating parent:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to update parent'
        });
    }
};

/**
 * Delete parent
 */
exports.deleteParent = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Parent.delete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Parent not found'
            });
        }

        logger.info('Parent deleted', {
            parentId: id,
            deletedBy: req.user.userId
        });

        res.json({
            success: true,
            message: 'Parent deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting parent:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete parent',
            error: error.message
        });
    }
};

/**
 * Get students for a parent
 */
exports.getParentStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;

        const result = await Parent.getStudents(id, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('Error fetching parent students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students',
            error: error.message
        });
    }
};

/**
 * Add student to parent
 */
exports.addStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id } = req.body;

        if (!student_id) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        const student = await Parent.addStudent(id, student_id);

        logger.info('Student added to parent', {
            parentId: id,
            studentId: student_id,
            addedBy: req.user.userId
        });

        res.json({
            success: true,
            message: 'Student added to parent successfully',
            student
        });
    } catch (error) {
        logger.error('Error adding student to parent:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to add student to parent'
        });
    }
};

/**
 * Remove student from parent
 */
exports.removeStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Parent.removeStudent(studentId);

        logger.info('Student removed from parent', {
            studentId,
            removedBy: req.user.userId
        });

        res.json({
            success: true,
            message: 'Student removed from parent successfully',
            student
        });
    } catch (error) {
        logger.error('Error removing student from parent:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to remove student from parent'
        });
    }
};
