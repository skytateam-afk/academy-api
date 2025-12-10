/**
 * Result Model
 * Handles result management operations
 */

const { pool } = require('../config/database');
const logger = require('../config/winston');

class Result {
    /**
     * Get all subjects
     */
    static async getAllSubjects(options = {}) {
        try {
            const { isActive } = options;
            let query = 'SELECT * FROM subjects WHERE 1=1';
            const params = [];

            if (isActive !== undefined) {
                query += ' AND is_active = $1';
                params.push(isActive);
            }

            query += ' ORDER BY name ASC';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error('Error getting subjects', { error: error.message });
            throw error;
        }
    }

    /**
     * Create subject
     */
    static async createSubject(data) {
        try {
            const { name, code, category, description } = data;

            const result = await pool.query(
                `INSERT INTO subjects (name, code, category, description)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [name, code, category || 'general', description || null]
            );

            logger.info('Subject created', { subjectId: result.rows[0].id });
            return result.rows[0];
        } catch (error) {
            logger.error('Error creating subject', { error: error.message });
            throw error;
        }
    }

    /**
     * Get all grading scales
     */
    static async getAllGradingScales() {
        try {
            const result = await pool.query(
                `SELECT gs.*, u.username as creator_username
         FROM grading_scales gs
         LEFT JOIN users u ON gs.created_by = u.id
         ORDER BY is_default DESC, created_at DESC`
            );
            return result.rows;
        } catch (error) {
            logger.error('Error getting grading scales', { error: error.message });
            throw error;
        }
    }

    /**
     * Create grading scale
     */
    static async createGradingScale(data, userId) {
        try {
            const { name, gradeConfig, isDefault } = data;

            const result = await pool.query(
                `INSERT INTO grading_scales (name, grade_config, is_default, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [name, JSON.stringify(gradeConfig), isDefault || false, userId]
            );

            logger.info('Grading scale created', { scaleId: result.rows[0].id });
            return result.rows[0];
        } catch (error) {
            logger.error('Error creating grading scale', { error: error.message });
            throw error;
        }
    }

    /**
     * Calculate grade based on grading scale
     */
    static calculateGrade(totalScore, gradeConfig) {
        const config = typeof gradeConfig === 'string' ? JSON.parse(gradeConfig) : gradeConfig;

        for (const range of config) {
            if (totalScore >= range.min && totalScore <= range.max) {
                return {
                    grade: range.grade,
                    remark: range.remark
                };
            }
        }

        return { grade: 'F', remark: 'Fail' };
    }

    /**
     * Import results from CSV data
     */
    static async importResults(data) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const { classroomId, results, gradingScaleId, teacherId } = data;

            // Get classroom info
            const classroomResult = await client.query(
                'SELECT academic_year, academic_term FROM classrooms WHERE id = $1',
                [classroomId]
            );

            if (classroomResult.rows.length === 0) {
                throw new Error('Classroom not found');
            }

            const { academic_year, academic_term } = classroomResult.rows[0];

            // Get grading scale
            const scaleResult = await client.query(
                'SELECT grade_config FROM grading_scales WHERE id = $1',
                [gradingScaleId]
            );

            if (scaleResult.rows.length === 0) {
                throw new Error('Grading scale not found');
            }

            const gradeConfig = scaleResult.rows[0].grade_config;

            const insertedResults = [];

            for (const record of results) {
                const { studentId, subjectId, caScore, examScore } = record;
                const totalScore = parseFloat(caScore) + parseFloat(examScore);
                const { grade, remark } = this.calculateGrade(totalScore, gradeConfig);

                const result = await client.query(
                    `INSERT INTO student_results 
           (classroom_id, student_id, subject_id, academic_year, term, 
            ca_score, exam_score, total_score, grade, remark, teacher_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (classroom_id, student_id, subject_id, academic_year, term)
           DO UPDATE SET
             ca_score = EXCLUDED.ca_score,
             exam_score = EXCLUDED.exam_score,
             total_score = EXCLUDED.total_score,
             grade = EXCLUDED.grade,
             remark = EXCLUDED.remark,
             teacher_id = EXCLUDED.teacher_id,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
                    [classroomId, studentId, subjectId, academic_year, academic_term,
                        caScore, examScore, totalScore, grade, remark, teacherId]
                );

                insertedResults.push(result.rows[0]);
            }

            await client.query('COMMIT');

            logger.info('Results imported', { count: insertedResults.length, classroomId });
            return insertedResults;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error importing results', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get class results
     */
    static async getClassResults(classroomId, options = {}) {
        try {
            const { academicYear, term } = options;

            let query = `
        SELECT 
          sr.*,
          u.first_name, u.last_name, u.email, u.username,
          s.name as subject_name, s.code as subject_code
        FROM student_results sr
        JOIN users u ON sr.student_id = u.id
        JOIN subjects s ON sr.subject_id = s.id
        WHERE sr.classroom_id = $1
      `;

            const params = [classroomId];
            let paramCount = 2;

            if (academicYear) {
                query += ` AND sr.academic_year = $${paramCount}`;
                params.push(academicYear);
                paramCount++;
            }

            if (term) {
                query += ` AND sr.term = $${paramCount}`;
                params.push(term);
            }

            query += ' ORDER BY u.last_name, u.first_name, s.name';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error('Error getting class results', { error: error.message });
            throw error;
        }
    }

    /**
     * Get student report card
     */
    static async getStudentReportCard(studentId, classroomId, options = {}) {
        try {
            const { academicYear, term } = options;

            // Get student info
            const studentResult = await pool.query(
                `SELECT u.*, cs.enrollment_number, cs.roll_number
         FROM users u
         LEFT JOIN classroom_students cs ON u.id = cs.student_id AND cs.classroom_id = $2
         WHERE u.id = $1`,
                [studentId, classroomId]
            );

            if (studentResult.rows.length === 0) {
                throw new Error('Student not found');
            }

            // Get classroom info
            const classroomResult = await pool.query(
                'SELECT * FROM classrooms WHERE id = $1',
                [classroomId]
            );

            // Get results
            let query = `
        SELECT sr.*, s.name as subject_name, s.code as subject_code
        FROM student_results sr
        JOIN subjects s ON sr.subject_id = s.id
        WHERE sr.student_id = $1 AND sr.classroom_id = $2
      `;

            const params = [studentId, classroomId];
            let paramCount = 3;

            if (academicYear) {
                query += ` AND sr.academic_year = $${paramCount}`;
                params.push(academicYear);
                paramCount++;
            }

            if (term) {
                query += ` AND sr.term = $${paramCount}`;
                params.push(term);
            }

            query += ' ORDER BY s.name';

            const resultsResult = await pool.query(query, params);

            return {
                student: studentResult.rows[0],
                classroom: classroomResult.rows[0],
                results: resultsResult.rows
            };
        } catch (error) {
            logger.error('Error getting student report card', { error: error.message });
            throw error;
        }
    }
}

module.exports = Result;
