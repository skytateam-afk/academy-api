/**
 * Result Service
 * Business logic for result batch management
 */

const { pool } = require('../../config/database');
const Result = require('../../models/Result');
const logger = require('../../config/winston');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const storageService = require('../../services/storageService');

// Initialize R2 client for fetching files
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

class ResultService {
    /**
     * Generate unique batch code
     */
    static async generateBatchCode(classroomId, academicYear, term) {
        const prefix = 'RB';
        const year = academicYear.replace(/[^0-9]/g, '').substring(0, 4);
        const termCode = term.replace(/[^0-9]/g, '') || '1';
        
        // Get count of existing batches for this classroom/year/term
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM result_batches 
             WHERE classroom_id = $1 AND academic_year = $2 AND term = $3`,
            [classroomId, academicYear, term]
        );
        
        const sequence = String(parseInt(result.rows[0].count) + 1).padStart(3, '0');
        return `${prefix}-${year}-T${termCode}-${sequence}`;
    }

    /**
     * Create a new result batch
     */
    static async createBatch(data, userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const {
                batchName,
                classroomId,
                academicYear,
                term,
                gradingScaleId,
                subjectGroupId,
                teacherName,
                principalName
            } = data;

            // Validate classroom exists
            const classroomCheck = await client.query(
                'SELECT id, name FROM classrooms WHERE id = $1',
                [classroomId]
            );

            if (classroomCheck.rows.length === 0) {
                throw new Error('Classroom not found');
            }

            // Validate grading scale exists
            const scaleCheck = await client.query(
                'SELECT id FROM grading_scales WHERE id = $1',
                [gradingScaleId]
            );

            if (scaleCheck.rows.length === 0) {
                throw new Error('Grading scale not found');
            }

            // Generate batch code
            const batchCode = await this.generateBatchCode(classroomId, academicYear, term);

            // Get classroom student count
            const studentCountResult = await client.query(
                'SELECT COUNT(*) as student_count FROM classroom_students WHERE classroom_id = $1',
                [classroomId]
            );
            const studentCount = parseInt(studentCountResult.rows[0].student_count) || 0;

            // Create batch
            const result = await client.query(
                `INSERT INTO result_batches
                (batch_name, batch_code, classroom_id, academic_year, term,
                 grading_scale_id, subject_group_id, status, total_students, created_by, 
                 teacher_name, principal_name)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, $9, $10, $11)
                RETURNING *`,
                [batchName, batchCode, classroomId, academicYear, term, gradingScaleId, subjectGroupId, studentCount, userId, teacherName, principalName]
            );

            await client.query('COMMIT');

            logger.info('Result batch created', {
                batchId: result.rows[0].id,
                batchCode: result.rows[0].batch_code,
                userId
            });

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error creating result batch', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get all batches with filters
     */
    static async getAllBatches(filters = {}) {
        try {
            const {
                classroomId,
                academicYear,
                term,
                status,
                createdBy,
                limit = 50,
                offset = 0
            } = filters;

            // Build WHERE clause for both count and data queries
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 1;

            if (classroomId) {
                whereClause += ` AND rb.classroom_id = $${paramCount}`;
                params.push(classroomId);
                paramCount++;
            }

            if (academicYear) {
                whereClause += ` AND rb.academic_year = $${paramCount}`;
                params.push(academicYear);
                paramCount++;
            }

            if (term) {
                whereClause += ` AND rb.term = $${paramCount}`;
                params.push(term);
                paramCount++;
            }

            if (status) {
                whereClause += ` AND rb.status = $${paramCount}`;
                params.push(status);
                paramCount++;
            }

            if (createdBy) {
                whereClause += ` AND rb.created_by = $${paramCount}`;
                params.push(createdBy);
                paramCount++;
            }

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM result_batches rb
                ${whereClause}
            `;
            const countResult = await pool.query(countQuery, params);
            const total = parseInt(countResult.rows[0].total);

            // Get paginated data with real-time counts
            const dataQuery = `
                SELECT 
                    rb.*,
                    c.name as classroom_name,
                    c.level as grade_level,
                    gs.name as grading_scale_name,
                    sg.name as subject_group_name,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    (SELECT COUNT(*) FROM classroom_students WHERE classroom_id = rb.classroom_id) as total_students,
                    (SELECT COUNT(*) FROM subject_group_subjects WHERE subject_group_id = rb.subject_group_id) as total_subjects,
                    (SELECT COUNT(*) FROM student_results WHERE classroom_id = rb.classroom_id AND academic_year = rb.academic_year AND term = rb.term) as total_results
                FROM result_batches rb
                LEFT JOIN classrooms c ON rb.classroom_id = c.id
                LEFT JOIN grading_scales gs ON rb.grading_scale_id = gs.id
                LEFT JOIN subject_groups sg ON rb.subject_group_id = sg.id
                LEFT JOIN users u ON rb.created_by = u.id
                ${whereClause}
                ORDER BY rb.created_at DESC 
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;
            const dataParams = [...params, limit, offset];
            const dataResult = await pool.query(dataQuery, dataParams);

            return {
                data: dataResult.rows,
                total,
                limit,
                offset
            };
        } catch (error) {
            logger.error('Error getting result batches', { error: error.message });
            throw error;
        }
    }

    /**
     * Get batch by ID with details
     */
    static async getBatchById(batchId) {
        try {
            const result = await pool.query(
                `SELECT 
                    rb.*,
                    c.name as classroom_name,
                    c.level as grade_level,
                    c.section,
                    gs.name as grading_scale_name,
                    gs.grade_config,
                    sg.name as subject_group_name,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    u.email as created_by_email
                FROM result_batches rb
                LEFT JOIN classrooms c ON rb.classroom_id = c.id
                LEFT JOIN grading_scales gs ON rb.grading_scale_id = gs.id
                LEFT JOIN subject_groups sg ON rb.subject_group_id = sg.id
                LEFT JOIN users u ON rb.created_by = u.id
                WHERE rb.id = $1`,
                [batchId]
            );

            if (result.rows.length === 0) {
                throw new Error('Batch not found');
            }

            const batch = result.rows[0];

            // Get actual student count from classroom
            const studentCount = await pool.query(
                'SELECT COUNT(*) as count FROM classroom_students WHERE classroom_id = $1',
                [batch.classroom_id]
            );
            batch.total_students = parseInt(studentCount.rows[0].count) || 0;

            // Get actual subject count from subject group
            if (batch.subject_group_id) {
                const subjectCount = await pool.query(
                    'SELECT COUNT(*) as count FROM subject_group_subjects WHERE subject_group_id = $1',
                    [batch.subject_group_id]
                );
                batch.total_subjects = parseInt(subjectCount.rows[0].count) || 0;
            }

            // Get actual results count
            const resultsCount = await pool.query(
                `SELECT COUNT(*) as count FROM student_results 
                 WHERE classroom_id = $1 AND academic_year = $2 AND term = $3`,
                [batch.classroom_id, batch.academic_year, batch.term]
            );
            batch.total_results = parseInt(resultsCount.rows[0].count) || 0;

            return batch;
        } catch (error) {
            logger.error('Error getting batch by ID', { error: error.message, batchId });
            throw error;
        }
    }

    /**
     * Update a batch
     */
    static async updateBatch(batchId, data, userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const {
                batchName,
                classroomId,
                academicYear,
                term,
                gradingScaleId,
                subjectGroupId
            } = data;

            // Check if batch exists
            const batchCheck = await client.query(
                'SELECT id FROM result_batches WHERE id = $1',
                [batchId]
            );

            if (batchCheck.rows.length === 0) {
                throw new Error('Batch not found');
            }

            // Validate classroom exists
            const classroomCheck = await client.query(
                'SELECT id, name FROM classrooms WHERE id = $1',
                [classroomId]
            );

            if (classroomCheck.rows.length === 0) {
                throw new Error('Classroom not found');
            }

            // Validate grading scale exists
            const scaleCheck = await client.query(
                'SELECT id FROM grading_scales WHERE id = $1',
                [gradingScaleId]
            );

            if (scaleCheck.rows.length === 0) {
                throw new Error('Grading scale not found');
            }

            // Validate subject group exists
            const groupCheck = await client.query(
                'SELECT id FROM subject_groups WHERE id = $1',
                [subjectGroupId]
            );

            if (groupCheck.rows.length === 0) {
                throw new Error('Subject group not found');
            }

            // Update batch
            const result = await client.query(
                `UPDATE result_batches
                 SET batch_name = $1,
                     classroom_id = $2,
                     academic_year = $3,
                     term = $4,
                     grading_scale_id = $5,
                     subject_group_id = $6,
                     updated_by = $7,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8
                 RETURNING *`,
                [batchName, classroomId, academicYear, term, gradingScaleId, subjectGroupId, userId, batchId]
            );

            await client.query('COMMIT');

            logger.info('Result batch updated', {
                batchId,
                userId
            });

            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error updating result batch', { error: error.message, batchId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Parse CSV file and validate data
     * Expected format: user_id,email,first_name,last_name,MATH_CA,MATH_EXAM,ENG_CA,ENG_EXAM,...
     * Each subject has separate CA and Exam columns
     */
    static async parseAndValidateCSV(fileKey, batchId) {
        try {
            logger.info('Starting CSV parsing from R2', { fileKey, batchId });

            // Get batch info to know which subjects to expect
            const batch = await this.getBatchById(batchId);
            const subjectGroupId = batch.subject_group_id;

            // Get subjects from subject group
            const subjectsResult = await pool.query(
                `SELECT s.code FROM subjects s
                 JOIN subject_group_subjects sgs ON s.id = sgs.subject_id
                 WHERE sgs.subject_group_id = $1`,
                [subjectGroupId]
            );
            const expectedSubjects = subjectsResult.rows.map(r => r.code);

            logger.info('Expected subjects', { expectedSubjects });

            // Fetch CSV file from R2
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileKey,
            });
            const response = await r2Client.send(command);

            return new Promise((resolve, reject) => {
                const results = [];
                const errors = [];
                let lineNumber = 0;

                const stream = Readable.from(response.Body)
                    .pipe(csv())
                    .on('data', (row) => {
                        lineNumber++;
                        
                        try {
                            // Get student info from fixed columns
                            const userId = row.user_id || row.userId || row.student_id;
                            const email = row.email;

                            // Validate student identification
                            if (!userId && !email) {
                                errors.push({
                                    line: lineNumber,
                                    error: 'Missing user_id or email',
                                    data: row
                                });
                                return;
                            }

                            // Parse each subject's CA and Exam columns separately
                            expectedSubjects.forEach(subjectCode => {
                                const caColumnName = `${subjectCode}_CA`;
                                const examColumnName = `${subjectCode}_EXAM`;
                                
                                const caValue = row[caColumnName];
                                const examValue = row[examColumnName];
                                
                                // Skip if both CA and Exam are empty
                                if ((!caValue || caValue.trim() === '') && (!examValue || examValue.trim() === '')) {
                                    return;
                                }

                                // Parse CA score (default to 0 if not provided)
                                let caScore = 0;
                                if (caValue && caValue.trim() !== '') {
                                    caScore = parseFloat(caValue);
                                    if (isNaN(caScore)) {
                                        errors.push({
                                            line: lineNumber,
                                            error: `Invalid CA score for ${subjectCode}: ${caValue}`,
                                            data: { ...row, subject: subjectCode }
                                        });
                                        return;
                                    }
                                }

                                // Parse Exam score (default to 0 if not provided)
                                let examScore = 0;
                                if (examValue && examValue.trim() !== '') {
                                    examScore = parseFloat(examValue);
                                    if (isNaN(examScore)) {
                                        errors.push({
                                            line: lineNumber,
                                            error: `Invalid Exam score for ${subjectCode}: ${examValue}`,
                                            data: { ...row, subject: subjectCode }
                                        });
                                        return;
                                    }
                                }

                                // Calculate total score
                                const totalScore = caScore + examScore;

                                results.push({
                                    userId,
                                    email,
                                    subjectCode,
                                    caScore,
                                    examScore,
                                    totalScore
                                });
                            });
                        } catch (rowError) {
                            logger.error('Error processing row', { lineNumber, error: rowError.message });
                            errors.push({
                                line: lineNumber,
                                error: `Row processing error: ${rowError.message}`,
                                data: row
                            });
                        }
                    })
                    .on('end', () => {
                        logger.info('CSV parsing completed', { 
                            totalRows: lineNumber, 
                            resultsCount: results.length, 
                            errorsCount: errors.length 
                        });
                        resolve({ results, errors });
                    })
                    .on('error', (error) => {
                        logger.error('CSV parsing stream error', { error: error.message });
                        reject(error);
                    });

                // Add timeout as safety measure
                setTimeout(() => {
                    if (!stream.destroyed) {
                        logger.warn('CSV parsing timeout - destroying stream');
                        stream.destroy();
                        reject(new Error('CSV parsing timeout after 60 seconds'));
                    }
                }, 60000); // 60 second timeout
            });
        } catch (error) {
            logger.error('Error in parseAndValidateCSV', { error: error.message });
            throw error;
        }
    }

    /**
     * Process CSV and import results
     */
    static async processCSVImport(batchId, fileKey, userId, fileUrl) {
        // Update batch status to processing BEFORE transaction
        // This makes it immediately visible to polling queries
        await pool.query(
            'UPDATE result_batches SET status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            ['processing', userId, batchId]
        );

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Get batch details
            const batchResult = await client.query(
                `SELECT rb.*, gs.grade_config 
                 FROM result_batches rb
                 JOIN grading_scales gs ON rb.grading_scale_id = gs.id
                 WHERE rb.id = $1`,
                [batchId]
            );

            const batch = batchResult.rows[0];
            const gradeConfig = batch.grade_config;

            // Parse CSV from R2
            const { results: csvData, errors: parseErrors } = await this.parseAndValidateCSV(fileKey, batchId);

            const importedResults = [];
            const failedImports = [];
            const subjects = new Set();
            const students = new Set();

            // Process each row
            for (const row of csvData) {
                try {
                    // Find student
                    let studentQuery = 'SELECT id FROM users WHERE ';
                    let studentParams = [];
                    
                    if (row.userId) {
                        studentQuery += 'id = $1';
                        studentParams = [row.userId];
                    } else {
                        studentQuery += 'email = $1';
                        studentParams = [row.email];
                    }

                    const studentResult = await client.query(studentQuery, studentParams);
                    
                    if (studentResult.rows.length === 0) {
                        failedImports.push({
                            data: row,
                            error: 'Student not found'
                        });
                        continue;
                    }

                    const studentId = studentResult.rows[0].id;

                    // Verify student is in classroom
                    const enrollmentCheck = await client.query(
                        'SELECT id FROM classroom_students WHERE classroom_id = $1 AND student_id = $2',
                        [batch.classroom_id, studentId]
                    );

                    if (enrollmentCheck.rows.length === 0) {
                        failedImports.push({
                            data: row,
                            error: 'Student not enrolled in this classroom'
                        });
                        continue;
                    }

                    // Find subject
                    const subjectResult = await client.query(
                        'SELECT id FROM subjects WHERE code = $1 AND is_active = true',
                        [row.subjectCode]
                    );

                    if (subjectResult.rows.length === 0) {
                        failedImports.push({
                            data: row,
                            error: `Subject not found: ${row.subjectCode}`
                        });
                        continue;
                    }

                    const subjectId = subjectResult.rows[0].id;

                    // Calculate total and grade
                    const totalScore = row.caScore + row.examScore;
                    const { grade, remark } = Result.calculateGrade(totalScore, gradeConfig);

                    // Insert or update result
                    const resultInsert = await client.query(
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
                        [batch.classroom_id, studentId, subjectId, batch.academic_year, batch.term,
                         row.caScore, row.examScore, totalScore, grade, remark, userId]
                    );

                    importedResults.push(resultInsert.rows[0]);
                    students.add(studentId);
                    subjects.add(subjectId);

                } catch (error) {
                    failedImports.push({
                        data: row,
                        error: error.message
                    });
                }
            }

            // Update batch statistics with R2 file URL
            await client.query(
                `UPDATE result_batches 
                 SET status = $1,
                     total_students = $2,
                     total_subjects = $3,
                     total_results = $4,
                     failed_imports = $5,
                     error_log = $6,
                     processed_at = CURRENT_TIMESTAMP,
                     csv_file_path = $7,
                     updated_by = $8
                 WHERE id = $9`,
                [
                    failedImports.length > 0 ? 'completed' : 'completed',
                    students.size,
                    subjects.size,
                    importedResults.length,
                    failedImports.length,
                    JSON.stringify([...parseErrors, ...failedImports]),
                    fileUrl,
                    userId,
                    batchId
                ]
            );

            await client.query('COMMIT');

            logger.info('CSV import processed', {
                batchId,
                imported: importedResults.length,
                failed: failedImports.length
            });

            return {
                success: true,
                imported: importedResults.length,
                failed: failedImports.length,
                errors: [...parseErrors, ...failedImports]
            };

        } catch (error) {
            await client.query('ROLLBACK');
            
            // Update batch status to failed
            await pool.query(
                `UPDATE result_batches 
                 SET status = 'failed', error_log = $1, updated_by = $2
                 WHERE id = $3`,
                [JSON.stringify([{ error: error.message }]), userId, batchId]
            );

            logger.error('Error processing CSV import', { error: error.message, batchId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Publish batch results (make visible to students)
     */
    static async publishBatch(batchId, userId) {
        try {
            const result = await pool.query(
                `UPDATE result_batches 
                 SET status = 'published', 
                     published_at = CURRENT_TIMESTAMP,
                     updated_by = $1
                 WHERE id = $2
                 RETURNING *`,
                [userId, batchId]
            );

            if (result.rows.length === 0) {
                throw new Error('Batch not found');
            }

            logger.info('Result batch published', { batchId, userId });
            return result.rows[0];
        } catch (error) {
            logger.error('Error publishing batch', { error: error.message, batchId });
            throw error;
        }
    }

    /**
     * Update batch status
     */
    static async updateBatchStatus(batchId, status, userId) {
        try {
            const result = await pool.query(
                `UPDATE result_batches 
                 SET status = $1, 
                     updated_by = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3
                 RETURNING *`,
                [status, userId, batchId]
            );

            if (result.rows.length === 0) {
                throw new Error('Batch not found');
            }

            logger.info('Result batch status updated', { batchId, status, userId });
            return result.rows[0];
        } catch (error) {
            logger.error('Error updating batch status', { error: error.message, batchId });
            throw error;
        }
    }

    /**
     * Update batch signatures and names
     */
    static async updateBatchSignatures(batchId, data, userId) {
        try {
            const {
                teacherName,
                principalName,
                teacherSignatureUrl,
                principalSignatureUrl
            } = data;

            // Build dynamic update query
            const updates = [];
            const params = [];
            let paramCount = 1;

            if (teacherName !== undefined) {
                updates.push(`teacher_name = $${paramCount}`);
                params.push(teacherName);
                paramCount++;
            }

            if (principalName !== undefined) {
                updates.push(`principal_name = $${paramCount}`);
                params.push(principalName);
                paramCount++;
            }

            if (teacherSignatureUrl !== undefined) {
                updates.push(`teacher_signature_url = $${paramCount}`);
                params.push(teacherSignatureUrl);
                paramCount++;
            }

            if (principalSignatureUrl !== undefined) {
                updates.push(`principal_signature_url = $${paramCount}`);
                params.push(principalSignatureUrl);
                paramCount++;
            }

            if (updates.length === 0) {
                throw new Error('No fields to update');
            }

            updates.push(`updated_by = $${paramCount}`);
            params.push(userId);
            paramCount++;

            updates.push(`updated_at = CURRENT_TIMESTAMP`);

            params.push(batchId);

            const query = `
                UPDATE result_batches
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(query, params);

            if (result.rows.length === 0) {
                throw new Error('Batch not found');
            }

            logger.info('Batch signatures updated', { batchId, userId });
            return result.rows[0];
        } catch (error) {
            logger.error('Error updating batch signatures', { error: error.message, batchId });
            throw error;
        }
    }

    /**
     * Delete batch
     */
    static async deleteBatch(batchId, userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Get batch info
            const batchCheck = await client.query(
                'SELECT * FROM result_batches WHERE id = $1',
                [batchId]
            );

            if (batchCheck.rows.length === 0) {
                throw new Error('Batch not found');
            }

            const batch = batchCheck.rows[0];

            // Delete associated results
            await client.query(
                `DELETE FROM student_results 
                 WHERE classroom_id = $1 
                   AND academic_year = $2 
                   AND term = $3`,
                [batch.classroom_id, batch.academic_year, batch.term]
            );

            // Delete batch
            await client.query('DELETE FROM result_batches WHERE id = $1', [batchId]);

            await client.query('COMMIT');

            // Delete files from R2 (do this after commit to avoid issues)
            const deletePromises = [];

            // Delete CSV file from R2 if exists
            if (batch.csv_file_path) {
                try {
                    // Extract file key from URL
                    const publicUrl = process.env.R2_PUBLIC_URL || '';
                    if (batch.csv_file_path.startsWith(publicUrl)) {
                        const fileKey = batch.csv_file_path.replace(publicUrl + '/', '');
                        deletePromises.push(
                            storageService.deleteFile(fileKey).catch(err => {
                                logger.warn('Failed to delete CSV file from R2', { fileKey, error: err.message });
                            })
                        );
                    }
                } catch (err) {
                    logger.warn('Error extracting CSV file key for deletion', { error: err.message });
                }
            }

            // Delete teacher signature from R2 if exists
            if (batch.teacher_signature_url) {
                try {
                    const publicUrl = process.env.R2_PUBLIC_URL || '';
                    if (batch.teacher_signature_url.startsWith(publicUrl)) {
                        const fileKey = batch.teacher_signature_url.replace(publicUrl + '/', '');
                        deletePromises.push(
                            storageService.deleteFile(fileKey).catch(err => {
                                logger.warn('Failed to delete teacher signature from R2', { fileKey, error: err.message });
                            })
                        );
                    }
                } catch (err) {
                    logger.warn('Error extracting teacher signature key for deletion', { error: err.message });
                }
            }

            // Delete principal signature from R2 if exists
            if (batch.principal_signature_url) {
                try {
                    const publicUrl = process.env.R2_PUBLIC_URL || '';
                    if (batch.principal_signature_url.startsWith(publicUrl)) {
                        const fileKey = batch.principal_signature_url.replace(publicUrl + '/', '');
                        deletePromises.push(
                            storageService.deleteFile(fileKey).catch(err => {
                                logger.warn('Failed to delete principal signature from R2', { fileKey, error: err.message });
                            })
                        );
                    }
                } catch (err) {
                    logger.warn('Error extracting principal signature key for deletion', { error: err.message });
                }
            }

            // Wait for all file deletions to complete
            await Promise.all(deletePromises);

            logger.info('Result batch deleted', { batchId, userId });
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error deleting batch', { error: error.message, batchId });
            throw error;
        } finally {
            client.release();
        }
    }

    // ==================== SUBJECT GROUP METHODS ====================

    /**
     * Create a new subject group
     */
    static async createSubjectGroup(data, userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const { name, description, academicSession, term, subjectIds } = data;

            // Validate subjects exist
            if (subjectIds && subjectIds.length > 0) {
                const subjectsCheck = await client.query(
                    'SELECT id FROM subjects WHERE id = ANY($1::int[])',
                    [subjectIds]
                );

                if (subjectsCheck.rows.length !== subjectIds.length) {
                    throw new Error('One or more subjects not found');
                }
            }

            // Create subject group
            const groupResult = await client.query(
                `INSERT INTO subject_groups 
                (name, description, academic_session, term, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [name, description, academicSession, term, userId]
            );

            const subjectGroup = groupResult.rows[0];

            // Add subjects to group
            if (subjectIds && subjectIds.length > 0) {
                for (const subjectId of subjectIds) {
                    await client.query(
                        `INSERT INTO subject_group_subjects (subject_group_id, subject_id)
                         VALUES ($1, $2)`,
                        [subjectGroup.id, subjectId]
                    );
                }
            }

            await client.query('COMMIT');

            logger.info('Subject group created', {
                groupId: subjectGroup.id,
                userId
            });

            return await this.getSubjectGroupById(subjectGroup.id);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error creating subject group', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get all subject groups with filters
     */
    static async getAllSubjectGroups(filters = {}) {
        try {
            const {
                academicSession,
                term,
                search,
                limit = 50,
                offset = 0
            } = filters;

            let query = `
                SELECT 
                    sg.*,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    COUNT(DISTINCT sgs.subject_id) as subject_count
                FROM subject_groups sg
                LEFT JOIN users u ON sg.created_by = u.id
                LEFT JOIN subject_group_subjects sgs ON sg.id = sgs.subject_group_id
                WHERE 1=1
            `;

            const params = [];
            let paramCount = 1;

            if (academicSession) {
                query += ` AND sg.academic_session = $${paramCount}`;
                params.push(academicSession);
                paramCount++;
            }

            if (term) {
                query += ` AND sg.term = $${paramCount}`;
                params.push(term);
                paramCount++;
            }

            if (search) {
                query += ` AND (sg.name ILIKE $${paramCount} OR sg.description ILIKE $${paramCount})`;
                params.push(`%${search}%`);
                paramCount++;
            }

            query += ` GROUP BY sg.id, u.first_name, u.last_name
                       ORDER BY sg.created_at DESC 
                       LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error('Error getting subject groups', { error: error.message });
            throw error;
        }
    }

    /**
     * Get subject group by ID with subjects
     */
    static async getSubjectGroupById(groupId) {
        try {
            const groupResult = await pool.query(
                `SELECT 
                    sg.*,
                    u.first_name || ' ' || u.last_name as created_by_name
                FROM subject_groups sg
                LEFT JOIN users u ON sg.created_by = u.id
                WHERE sg.id = $1`,
                [groupId]
            );

            if (groupResult.rows.length === 0) {
                throw new Error('Subject group not found');
            }

            const group = groupResult.rows[0];

            // Get subjects in this group
            const subjectsResult = await pool.query(
                `SELECT 
                    s.id, s.name, s.code
                FROM subjects s
                JOIN subject_group_subjects sgs ON s.id = sgs.subject_id
                WHERE sgs.subject_group_id = $1
                ORDER BY s.name`,
                [groupId]
            );

            group.subjects = subjectsResult.rows;
            group.subject_count = subjectsResult.rows.length;

            return group;
        } catch (error) {
            logger.error('Error getting subject group by ID', { error: error.message, groupId });
            throw error;
        }
    }

    /**
     * Update subject group
     */
    static async updateSubjectGroup(groupId, data, userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const { name, description, academicSession, term, subjectIds } = data;

            // Update subject group
            await client.query(
                `UPDATE subject_groups 
                 SET name = $1, 
                     description = $2, 
                     academic_session = $3,
                     term = $4,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5`,
                [name, description, academicSession, term, groupId]
            );

            // Update subjects if provided
            if (subjectIds !== undefined) {
                // Validate subjects exist
                if (subjectIds.length > 0) {
                    const subjectsCheck = await client.query(
                        'SELECT id FROM subjects WHERE id = ANY($1::int[])',
                        [subjectIds]
                    );

                    if (subjectsCheck.rows.length !== subjectIds.length) {
                        throw new Error('One or more subjects not found');
                    }
                }

                // Remove existing subjects
                await client.query(
                    'DELETE FROM subject_group_subjects WHERE subject_group_id = $1',
                    [groupId]
                );

                // Add new subjects
                for (const subjectId of subjectIds) {
                    await client.query(
                        `INSERT INTO subject_group_subjects (subject_group_id, subject_id)
                         VALUES ($1, $2)`,
                        [groupId, subjectId]
                    );
                }
            }

            await client.query('COMMIT');

            logger.info('Subject group updated', { groupId, userId });
            return await this.getSubjectGroupById(groupId);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error updating subject group', { error: error.message, groupId });
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Delete subject group
     */
    static async deleteSubjectGroup(groupId, userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Check if group is being used by any batches
            const batchCheck = await client.query(
                'SELECT COUNT(*) as count FROM result_batches WHERE subject_group_id = $1',
                [groupId]
            );

            if (parseInt(batchCheck.rows[0].count) > 0) {
                throw new Error('Cannot delete subject group that is being used by result batches');
            }

            // Delete subject group (cascade will delete subject_group_subjects)
            const result = await client.query(
                'DELETE FROM subject_groups WHERE id = $1 RETURNING *',
                [groupId]
            );

            if (result.rows.length === 0) {
                throw new Error('Subject group not found');
            }

            await client.query('COMMIT');

            logger.info('Subject group deleted', { groupId, userId });
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error deleting subject group', { error: error.message, groupId });
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = ResultService;
