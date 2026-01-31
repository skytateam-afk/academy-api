/**
 * Institution Dashboard Controller
 * Provides statistics and management for institution admins
 */

const knex = require('../../../config/knex');
const User = require('../../user_management/models/User');
const Pathway = require('../../../models/Pathway');
const logger = require('../../../config/winston');
const crypto = require('crypto');
const emailService = require('../../../services/emailService');

class InstitutionDashboardController {
    /**
     * Get institution overview statistics
     */
    async getOverviewStats(req, res) {
        try {
            // Fix: Token contains institution_id (snake_case), map to camelCase for internal use
            const institutionId = req.user.institution_id || req.user.institutionId;

            if (!institutionId) {
                return res.status(403).json({
                    success: false,
                    message: 'User is not associated with an institution'
                });
            }

            // 1. Total Students
            const studentRole = await knex('roles').where('name', 'student').first();
            const totalStudents = await knex('users')
                .where({ institution_id: institutionId, role_id: studentRole.id })
                .count('* as count')
                .first();

            // 2. Active Pathways
            const activePathways = await knex('pathways')
                .where({ institution_id: institutionId, is_published: true })
                .count('* as count')
                .first();

            // 3. Total Enrollments (Fix: was missing)
            const totalEnrollments = await knex('pathway_enrollments as pe')
                .join('pathways as p', 'pe.pathway_id', 'p.id')
                .where('p.institution_id', institutionId)
                .count('* as count')
                .first();

            // 4. Completions (Fix: was missing)
            const completions = await knex('pathway_enrollments as pe')
                .join('pathways as p', 'pe.pathway_id', 'p.id')
                .where('p.institution_id', institutionId)
                .where(q => {
                    q.where('pe.status', 'completed')
                        .orWhere('pe.progress_percent', 100);
                })
                .count('* as count')
                .first();

            // 5. Average Progress
            const avgProgress = await knex('pathway_enrollments as pe')
                .join('pathways as p', 'pe.pathway_id', 'p.id')
                .where('p.institution_id', institutionId)
                .avg('pe.progress_percent as avgProgress')
                .first();

            res.json({
                success: true,
                data: {
                    totalStudents: parseInt(totalStudents?.count || 0),
                    activePathways: parseInt(activePathways?.count || 0),
                    totalEnrollments: parseInt(totalEnrollments?.count || 0),
                    completions: parseInt(completions?.count || 0),
                    completionRate: parseInt(totalEnrollments?.count) > 0
                        ? ((parseInt(completions?.count || 0) / parseInt(totalEnrollments?.count)) * 100).toFixed(2)
                        : "0.00",
                    avgProgress: parseFloat(avgProgress?.avgProgress || 0).toFixed(2)
                }
            });
        } catch (error) {
            logger.error('Error fetching institution stats', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error fetching institution statistics',
                error: error.message
            });
        }
    }

    /**
     * Get students in the institution
     */
    async getStudents(req, res) {
        try {
            // Fix: Token contains institution_id (snake_case)
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { page = 1, limit = 10, search = '' } = req.query;
            const offset = (page - 1) * limit;

            const studentRole = await knex('roles').where('name', 'student').first();

            let query = knex('users')
                .where({ institution_id: institutionId, role_id: studentRole.id });

            if (search) {
                query = query.where(function () {
                    this.where('first_name', 'ilike', `%${search}%`)
                        .orWhere('last_name', 'ilike', `%${search}%`)
                        .orWhere('email', 'ilike', `%${search}%`);
                });
            }

            const [{ total }] = await query.clone().count('* as total');

            const students = await query
                .select(
                    'id', 'username', 'email', 'first_name', 'last_name',
                    'phone', 'is_active', 'created_at',
                    'student_id', 'department', 'level'
                )
                .limit(limit)
                .offset(offset)
                .orderBy('created_at', 'desc');

            res.json({
                success: true,
                data: students,
                pagination: {
                    total: parseInt(total),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(parseInt(total) / limit)
                }
            });
        } catch (error) {
            logger.error('Error fetching institution students', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error fetching students',
                error: error.message
            });
        }
    }

    /**
     * Bulk upload students via CSV
     */
    async bulkUploadStudents(req, res) {
        try {
            // Fix: Token contains institution_id (snake_case)
            const institutionId = req.user.institution_id || req.user.institutionId;
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const csvData = req.file.buffer.toString('utf-8');
            const lines = csvData.split('\n').map(line => line.trim()).filter(line => line);

            if (lines.length < 2) {
                return res.status(400).json({ success: false, message: 'CSV is empty or missing headers' });
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const emailIdx = headers.indexOf('email');
            const firstNameIdx = headers.indexOf('first_name');
            const lastNameIdx = headers.indexOf('last_name');
            const studentIdIdx = headers.indexOf('student_id');
            const deptIdx = headers.indexOf('department');
            const levelIdx = headers.indexOf('level');

            if (emailIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required columns: email, first_name, last_name'
                });
            }

            const results = { success: 0, failed: 0, errors: [] };

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                const email = cols[emailIdx];
                const firstName = cols[firstNameIdx];
                const lastName = cols[lastNameIdx];
                const studentId = studentIdIdx !== -1 ? cols[studentIdIdx] : null;
                const department = deptIdx !== -1 ? cols[deptIdx] : null;
                const level = levelIdx !== -1 ? cols[levelIdx] : null;

                if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    results.failed++;
                    results.errors.push(`Row ${i + 1}: Invalid email address`);
                    continue;
                }

                try {
                    const generatedPassword = crypto.randomBytes(12).toString('base64').slice(0, 12);

                    const user = await User.create({
                        email,
                        password: generatedPassword,
                        first_name: firstName,
                        last_name: lastName,
                        role_name: 'student',
                        institution_id: institutionId,
                        student_id: studentId,
                        department: department,
                        level: level
                    });

                    emailService.sendAccountCreatedEmail({
                        email: user.email,
                        username: user.username,
                        password: generatedPassword,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        roleName: 'student',
                        institutionName: 'Institutional Portal'
                    }).catch(err => logger.error('Welcome email failed', { error: err.message, userId: user.id }));

                    results.success++;
                } catch (error) {
                    results.failed++;
                    results.errors.push(`Row ${i + 1} (${email}): ${error.message}`);
                }
            }

            res.json({
                success: true,
                message: `Processed ${lines.length - 1} rows. ${results.success} succeeded, ${results.failed} failed.`,
                data: results
            });
        } catch (error) {
            logger.error('Bulk upload error', { error: error.message });
            res.status(500).json({ success: false, message: 'Internal server error during upload' });
        }
    }

    /**
     * Get pathways for the institution
     */
    async getPathways(req, res) {
        try {
            // Fix: Token contains institution_id (snake_case)
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { page = 1, limit = 10 } = req.query;

            const pathways = await Pathway.getAll({
                institutionId,
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: pathways.pathways,
                pagination: pathways.pagination
            });
        } catch (error) {
            logger.error('Error fetching institution pathways', { error: error.message });
            res.status(500).json({ success: false, message: 'Error fetching pathways' });
        }
    }

    /**
     * Assign students to a pathway
     */
    async assignPathway(req, res) {
        try {
            // Fix: Token contains institution_id (snake_case)
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { pathwayId, studentIds } = req.body;

            if (!pathwayId || !studentIds || !Array.isArray(studentIds)) {
                return res.status(400).json({ success: false, message: 'Pathway ID and student IDs array are required' });
            }

            const pathway = await Pathway.getById(pathwayId);
            if (!pathway || pathway.institution_id !== institutionId) {
                return res.status(403).json({ success: false, message: 'Unauthorized pathway access' });
            }

            const results = { success: 0, alreadyEnrolled: 0, errors: [] };
            const successfulStudentIds = []; // Track successful IDs

            for (const studentId of studentIds) {
                try {
                    const student = await knex('users')
                        .where({ id: studentId, institution_id: institutionId })
                        .first();

                    if (!student) {
                        results.errors.push(`Student ${studentId} not found in your institution`);
                        continue;
                    }

                    const existing = await knex('pathway_enrollments')
                        .where({ pathway_id: pathwayId, user_id: studentId })
                        .first();

                    if (existing) {
                        results.alreadyEnrolled++;
                        continue;
                    }

                    await knex('pathway_enrollments').insert({
                        pathway_id: pathwayId,
                        user_id: studentId,
                        status: 'active',
                        enrolled_at: new Date()
                    });

                    await Pathway.enrollMemberInAllPathwayCourses(pathwayId, studentId);

                    results.success++;
                    successfulStudentIds.push(studentId);
                } catch (error) {
                    results.errors.push(`Error enrolling ${studentId}: ${error.message}`);
                }
            }

            res.json({
                success: true,
                message: `Assignment complete. ${results.success} enrolled, ${results.alreadyEnrolled} already enrolled.`,
                data: results
            });
        } catch (error) {
            logger.error('Pathway assignment error', { error: error.message });
            res.status(500).json({ success: false, message: 'Error assigning pathway' });
        }
    }

    /**
     * Assign a single student to a pathway (New Feature)
     */
    async assignSinglePathway(req, res) {
        try {
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { pathway_id, student_id } = req.body;

            // Normalize input names if they come in differently (e.g. camelCase vs snake_case)
            const pathwayId = pathway_id || req.body.pathwayId;
            const studentId = student_id || req.body.studentId;

            if (!pathwayId || !studentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Both pathway_id and student_id are required'
                });
            }

            // Verify pathway belongs to institution
            const pathway = await Pathway.getById(pathwayId);
            if (!pathway || pathway.institution_id !== institutionId) {
                return res.status(403).json({ success: false, message: 'Unauthorized pathway access or pathway not found' });
            }

            // Verify student belongs to institution
            const student = await knex('users')
                .where({ id: studentId, institution_id: institutionId })
                .first();

            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found in your institution' });
            }

            // Check existing enrollment
            const existing = await knex('pathway_enrollments')
                .where({ pathway_id: pathwayId, user_id: studentId })
                .first();

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Student is already enrolled in this pathway'
                });
            }

            // Perform enrollment
            await knex('pathway_enrollments').insert({
                pathway_id: pathwayId,
                user_id: studentId,
                status: 'active',
                enrolled_at: new Date()
            });

            // Enroll in all courses within the pathway
            await Pathway.enrollMemberInAllPathwayCourses(pathwayId, studentId);

            // Send notification (optional - similar to existing)
            // notificationService.sendAssignedNotification(...)

            res.json({
                success: true,
                message: 'Student assigned to pathway successfully',
                data: {
                    pathway_id: pathwayId,
                    student_id: studentId,
                    status: 'active'
                }
            });
        } catch (error) {
            logger.error('Single pathway assignment error', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Error assigning student to pathway',
                error: error.message
            });
        }
    }

    /**
     * Update student details
     */
    async updateStudent(req, res) {
        try {
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { id } = req.params;
            const {
                student_id, studentId,
                department, level,
                first_name, last_name, phone, username
            } = req.body;

            const finalStudentId = student_id !== undefined ? student_id : studentId;

            // 1. Verify student exists in institution
            const student = await knex('users')
                .where({ id, institution_id: institutionId })
                .first();

            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found in your institution' });
            }

            // 2. Build update object (only include defined fields)
            const updateData = {
                updated_at: new Date()
            };

            if (finalStudentId !== undefined) updateData.student_id = finalStudentId;
            if (department !== undefined) updateData.department = department;
            if (level !== undefined) updateData.level = level;
            if (first_name !== undefined) updateData.first_name = first_name;
            if (last_name !== undefined) updateData.last_name = last_name;
            if (phone !== undefined) updateData.phone = phone;
            if (username !== undefined) updateData.username = username;

            // 3. Perform Update
            await knex('users')
                .where({ id })
                .update(updateData);

            res.json({ success: true, message: 'Student details updated successfully' });
        } catch (error) {
            // Handle unique constraint violations
            if (error.code === '23505') {
                if (error.constraint === 'users_username_key') {
                    return res.status(409).json({ success: false, message: 'Username already exists' });
                }
            }
            logger.error('Error updating student', { error: error.message });
            res.status(500).json({ success: false, message: 'Error updating student' });
        }
    }

    /**
     * Update student status (activate/deactivate)
     */
    async updateStudentStatus(req, res) {
        try {
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { id } = req.params;
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
            }

            const student = await knex('users')
                .where({ id, institution_id: institutionId })
                .first();

            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found in your institution' });
            }

            await knex('users')
                .where({ id })
                .update({
                    is_active: isActive,
                    updated_at: new Date()
                });

            // Send notification
            emailService.sendAccountStatusEmail({
                email: student.email,
                firstName: student.first_name,
                isActive,
                institutionName: 'Institutional Portal' // Could fetch institution name if needed
            }).catch(err => logger.error('Status email failed', { error: err.message }));

            res.json({ success: true, message: `Student access ${isActive ? 'activated' : 'deactivated'} successfully` });
        } catch (error) {
            logger.error('Error updating student status', { error: error.message });
            res.status(500).json({ success: false, message: 'Error updating student status' });
        }
    }
    /**
     * Get recent student activity across all pathways
     */
    async getRecentStudentActivity(req, res) {
        try {
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { limit = 10 } = req.query;

            const activity = await knex('pathway_enrollments as pe')
                .join('users as u', 'pe.user_id', 'u.id')
                .join('pathways as p', 'pe.pathway_id', 'p.id')
                .where('u.institution_id', institutionId)
                .select(
                    'u.id as student_id',
                    'u.first_name',
                    'u.last_name',
                    'u.avatar_url',
                    'p.id as pathway_id',
                    'p.title as pathway_title',
                    'pe.progress_percent as progress',
                    'pe.last_accessed_at',
                    'pe.status'
                )
                .orderBy('pe.last_accessed_at', 'desc')
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: activity
            });
        } catch (error) {
            logger.error('Error fetching student activity', { error: error.message });
            res.status(500).json({ success: false, message: 'Error fetching student activity' });
        }
    }

    /**
     * Get top performing pathways based on completion rate
     */
    async getTopPerformingPathways(req, res) {
        try {
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { limit = 5 } = req.query;

            // Calculate average progress for each pathway in this institution
            const pathways = await knex('pathways as p')
                .leftJoin('pathway_enrollments as pe', 'p.id', 'pe.pathway_id')
                .where('p.institution_id', institutionId)
                .select(
                    'p.id',
                    'p.title',
                    knex.raw('COUNT(pe.id) as total_enrolled'),
                    knex.raw('COALESCE(AVG(pe.progress_percent), 0) as avg_progress'),
                    knex.raw("COUNT(CASE WHEN pe.status = 'completed' THEN 1 END) as completion_count")
                )
                .groupBy('p.id')
                .orderBy('avg_progress', 'desc')
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: pathways.map(p => ({
                    ...p,
                    avg_progress: Math.round(parseFloat(p.avg_progress || 0)),
                    total_enrolled: parseInt(p.total_enrolled),
                    completion_count: parseInt(p.completion_count)
                }))
            });
        } catch (error) {
            logger.error('Error fetching top pathways', { error: error.message });
            res.status(500).json({ success: false, message: 'Error fetching top pathways' });
        }
    }

    /**
     * Get pathways needing attention (low engagement/progress)
     */
    async getPathwaysNeedingAttention(req, res) {
        try {
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { limit = 5 } = req.query;

            // Find pathways with lowest average progress, but only if they have enrollments
            const pathways = await knex('pathways as p')
                .join('pathway_enrollments as pe', 'p.id', 'pe.pathway_id')
                .where('p.institution_id', institutionId)
                .select(
                    'p.id',
                    'p.title',
                    knex.raw('COUNT(pe.id) as total_enrolled'),
                    knex.raw('COALESCE(AVG(pe.progress_percent), 0) as avg_progress'),
                    knex.raw("count(CASE WHEN pe.last_accessed_at < NOW() - INTERVAL '7 days' THEN 1 END) as inactive_count")
                )
                .groupBy('p.id')
                .having(knex.raw('COUNT(pe.id)'), '>', 0) // Only consider active pathways
                .orderBy('avg_progress', 'asc')
                .limit(parseInt(limit));

            res.json({
                success: true,
                data: pathways.map(p => ({
                    ...p,
                    avg_progress: Math.round(parseFloat(p.avg_progress || 0)),
                    total_enrolled: parseInt(p.total_enrolled),
                    inactive_count: parseInt(p.inactive_count)
                }))
            });
        } catch (error) {
            logger.error('Error fetching pathways needing attention', { error: error.message });
            res.status(500).json({ success: false, message: 'Error fetching pathway attention data' });
        }
    }

    /**
     * Get detailed pathway progress for a specific student
     */
    async getStudentPathways(req, res) {
        try {
            const institutionId = req.user.institution_id || req.user.institutionId;
            const { studentId } = req.params;

            // Verify student belongs to institution
            const student = await knex('users')
                .where({ id: studentId, institution_id: institutionId })
                .first();

            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found in your institution' });
            }

            const pathways = await knex('pathway_enrollments as pe')
                .join('pathways as p', 'pe.pathway_id', 'p.id')
                .where('pe.user_id', studentId)
                .select(
                    'p.id',
                    'p.title',
                    'p.description',
                    'pe.progress_percent as progress',
                    'pe.status',
                    'pe.enrolled_at',
                    'pe.completed_at',
                    'pe.last_accessed_at'
                )
                .orderBy('pe.last_accessed_at', 'desc');

            res.json({
                success: true,
                data: {
                    student: {
                        id: student.id,
                        first_name: student.first_name,
                        last_name: student.last_name,
                        email: student.email,
                        avatar_url: student.avatar_url
                    },
                    pathways
                }
            });
        } catch (error) {
            logger.error('Error fetching student pathways', { error: error.message });
            res.status(500).json({ success: false, message: 'Error fetching student pathways' });
        }
    }
}

module.exports = new InstitutionDashboardController();
