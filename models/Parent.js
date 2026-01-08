/**
 * Parent Model
 * Handles all parent-related database operations
 */

const knex = require('../config/knex');
const logger = require('../config/winston');

class Parent {
    /**
     * Create a new parent
     * @param {Object} parentData - Parent data
     * @returns {Promise<Object>} Created parent
     */
    static async create(parentData) {
        const { first_name, last_name, email, phone, address } = parentData;

        try {
            const [parent] = await knex('parents')
                .insert({
                    first_name,
                    last_name,
                    email,
                    phone: phone || null,
                    address: address || null
                })
                .returning('*');

            logger.info('Parent created', {
                parentId: parent.id,
                email: parent.email
            });

            return parent;
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Find parent by ID
     * @param {string} parentId - Parent ID
     * @returns {Promise<Object|null>} Parent object or null
     */
    static async findById(parentId) {
        const parent = await knex('parents')
            .where({ id: parentId })
            .first();

        return parent || null;
    }

    /**
     * Find parent by email
     * @param {string} email - Parent email
     * @returns {Promise<Object|null>} Parent object or null
     */
    static async findByEmail(email) {
        const parent = await knex('parents')
            .where({ email })
            .first();

        return parent || null;
    }

    /**
     * Get all parents with pagination and student counts
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Parents and pagination info
     */
    static async getAll(options = {}) {
        const {
            page = 1,
            limit = 20,
            search = '',
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = options;

        const offset = (page - 1) * limit;
        let query = knex('parents');

        // Search filter
        if (search) {
            query = query.where(function () {
                this.where('first_name', 'ilike', `%${search}%`)
                    .orWhere('last_name', 'ilike', `%${search}%`)
                    .orWhere('email', 'ilike', `%${search}%`)
                    .orWhere('phone', 'ilike', `%${search}%`);
            });
        }

        // Count total
        const [{ count }] = await query.clone().count('* as count');
        const total = parseInt(count);

        // Get parents with student counts
        const parents = await query
            .select(
                'parents.*',
                knex.raw('COUNT(users.id) as student_count')
            )
            .leftJoin('users', 'parents.id', 'users.parent_id')
            .groupBy('parents.id')
            .orderBy(sort_by, sort_order)
            .limit(limit)
            .offset(offset);

        return {
            parents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Update parent
     * @param {string} parentId - Parent ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated parent
     */
    static async update(parentId, updates) {
        const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'address'];
        const updateData = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            throw new Error('No valid fields to update');
        }

        try {
            const [parent] = await knex('parents')
                .where({ id: parentId })
                .update({
                    ...updateData,
                    updated_at: new Date()
                })
                .returning('*');

            if (!parent) {
                throw new Error('Parent not found');
            }

            logger.info('Parent updated', {
                parentId,
                updatedFields: Object.keys(updateData)
            });

            return parent;
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Delete parent
     * @param {string} parentId - Parent ID
     * @returns {Promise<boolean>} Success status
     */
    static async delete(parentId) {
        // First, remove parent_id from all associated students
        await knex('users')
            .where({ parent_id: parentId })
            .update({ parent_id: null });

        const deleted = await knex('parents')
            .where({ id: parentId })
            .del();

        logger.info('Parent deleted', { parentId });
        return deleted > 0;
    }

    /**
     * Get students associated with a parent
     * @param {string} parentId - Parent ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Students and pagination info
     */
    static async getStudents(parentId, options = {}) {
        const {
            page = 1,
            limit = 10
        } = options;

        const offset = (page - 1) * limit;

        // Get total count - handle case where no results exist
        const countResult = await knex('users')
            .where({ parent_id: parentId })
            .count('* as count');

        const total = countResult && countResult[0] ? parseInt(countResult[0].count) : 0;
        const totalPages = Math.ceil(total / limit);

        // Get paginated students
        const students = await knex('users')
            .select(
                'users.id',
                'users.username',
                'users.email',
                'users.first_name',
                'users.last_name',
                'users.avatar_url',
                'users.is_active',
                'users.created_at',
                'roles.name as role_name'
            )
            .leftJoin('roles', 'users.role_id', 'roles.id')
            .where({ 'users.parent_id': parentId })
            .orderBy('users.created_at', 'desc')
            .limit(limit)
            .offset(offset);

        return {
            students,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }

    /**
     * Add student to parent
     * @param {string} parentId - Parent ID
     * @param {string} studentId - Student ID
     * @returns {Promise<Object>} Updated student
     */
    static async addStudent(parentId, studentId) {
        // Check if student already has a parent
        const student = await knex('users')
            .where({ id: studentId })
            .first();

        if (!student) {
            throw new Error('Student not found');
        }

        if (student.parent_id && student.parent_id !== parentId) {
            throw new Error('Student is already associated with another parent');
        }

        // Update student's parent_id
        const [updatedStudent] = await knex('users')
            .where({ id: studentId })
            .update({
                parent_id: parentId,
                updated_at: new Date()
            })
            .returning('*');

        logger.info('Student added to parent', {
            parentId,
            studentId
        });

        return updatedStudent;
    }

    /**
     * Remove student from parent
     * @param {string} studentId - Student ID
     * @returns {Promise<Object>} Updated student
     */
    static async removeStudent(studentId) {
        const [updatedStudent] = await knex('users')
            .where({ id: studentId })
            .update({
                parent_id: null,
                updated_at: new Date()
            })
            .returning('*');

        if (!updatedStudent) {
            throw new Error('Student not found');
        }

        logger.info('Student removed from parent', {
            studentId
        });

        return updatedStudent;
    }

    /**
     * Get parent with student details
     * @param {string} parentId - Parent ID
     * @returns {Promise<Object>} Parent with students
     */
    static async getWithStudents(parentId) {
        const parent = await this.findById(parentId);

        if (!parent) {
            return null;
        }

        const result = await this.getStudents(parentId);

        return {
            ...parent,
            students: result.students
        };
    }
}

module.exports = Parent;
