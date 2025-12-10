/**
 * Result Controller
 * Handles HTTP requests for result management
 */

const Result = require('../../models/Result');
const ResultService = require('./result.service');
const logger = require('../../config/winston');

/**
 * Get all subjects
 */
exports.getSubjects = async (req, res) => {
    try {
        const { limit, offset, search, category, isActive } = req.query;
        const { pool } = require('../../config/database');
        
        // Build dynamic query
        let query = 'SELECT * FROM subjects WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (search) {
            query += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (category) {
            query += ` AND category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        if (isActive !== undefined) {
            query += ` AND is_active = $${paramCount}`;
            params.push(isActive === 'true');
            paramCount++;
        }

        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Add ordering and pagination
        query += ' ORDER BY name ASC';
        
        if (limit) {
            query += ` LIMIT $${paramCount}`;
            params.push(parseInt(limit));
            paramCount++;
        }

        if (offset) {
            query += ` OFFSET $${paramCount}`;
            params.push(parseInt(offset));
            paramCount++;
        }

        const result = await pool.query(query, params);

        res.json({
            subjects: result.rows,
            total,
            limit: limit ? parseInt(limit) : total,
            offset: offset ? parseInt(offset) : 0
        });
    } catch (error) {
        logger.error('Error in getSubjects', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
};

/**
 * Create subject
 */
exports.createSubject = async (req, res) => {
    try {
        const { name, code, category, description } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Name and code are required' });
        }

        const subject = await Result.createSubject({ name, code, category, description });
        res.status(201).json(subject);
    } catch (error) {
        logger.error('Error in createSubject', { error: error.message });

        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Subject code already exists' });
        }

        res.status(500).json({ error: 'Failed to create subject' });
    }
};

/**
 * Update subject
 */
exports.updateSubject = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { name, code, category, description } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Name and code are required' });
        }

        const { pool } = require('../../config/database');
        
        const result = await pool.query(
            `UPDATE subjects 
             SET name = $1, code = $2, category = $3, description = $4, updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [name, code, category || 'general', description, subjectId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error in updateSubject', { error: error.message });

        if (error.code === '23505') {
            return res.status(409).json({ error: 'Subject code already exists' });
        }

        res.status(500).json({ error: 'Failed to update subject' });
    }
};

/**
 * Toggle subject status
 */
exports.toggleSubjectStatus = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { pool } = require('../../config/database');
        
        const result = await pool.query(
            `UPDATE subjects 
             SET is_active = NOT is_active, updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [subjectId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json({
            message: 'Subject status updated successfully',
            subject: result.rows[0]
        });
    } catch (error) {
        logger.error('Error in toggleSubjectStatus', { error: error.message });
        res.status(500).json({ error: 'Failed to toggle subject status' });
    }
};

/**
 * Delete subject
 */
exports.deleteSubject = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { pool } = require('../../config/database');
        
        // Check if subject is being used
        const checkResult = await pool.query(
            `SELECT COUNT(*) as count FROM results WHERE subject_id = $1`,
            [subjectId]
        );

        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(409).json({ 
                error: 'Cannot delete subject that has results associated with it' 
            });
        }

        const result = await pool.query(
            'DELETE FROM subjects WHERE id = $1 RETURNING *',
            [subjectId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subject not found' });
        }

        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteSubject', { error: error.message });
        res.status(500).json({ error: 'Failed to delete subject' });
    }
};

/**
 * Get all grading scales
 */
exports.getGradingScales = async (req, res) => {
    try {
        const { limit, offset, search } = req.query;
        const { pool } = require('../../config/database');
        
        // Build dynamic query
        let query = `
            SELECT gs.*, u.username as creator_username
            FROM grading_scales gs
            LEFT JOIN users u ON gs.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (search) {
            query += ` AND gs.name ILIKE $${paramCount}`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // Get total count
        const countQuery = query.replace(/SELECT gs\.\*, u\.username as creator_username/, 'SELECT COUNT(DISTINCT gs.id)');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Add ordering and pagination
        query += ' ORDER BY gs.is_default DESC, gs.name ASC';
        
        if (limit) {
            query += ` LIMIT $${paramCount}`;
            params.push(parseInt(limit));
            paramCount++;
        }

        if (offset) {
            query += ` OFFSET $${paramCount}`;
            params.push(parseInt(offset));
            paramCount++;
        }

        const result = await pool.query(query, params);

        res.json({
            scales: result.rows,
            total,
            limit: limit ? parseInt(limit) : total,
            offset: offset ? parseInt(offset) : 0
        });
    } catch (error) {
        logger.error('Error in getGradingScales', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch grading scales' });
    }
};

/**
 * Create grading scale
 */
exports.createGradingScale = async (req, res) => {
    try {
        const { name, gradeConfig, isDefault } = req.body;

        if (!name || !gradeConfig || !Array.isArray(gradeConfig)) {
            return res.status(400).json({ error: 'Name and valid grade configuration are required' });
        }

        const scale = await Result.createGradingScale(
            { name, gradeConfig, isDefault },
            req.user.userId
        );

        res.status(201).json(scale);
    } catch (error) {
        logger.error('Error in createGradingScale', { error: error.message });
        res.status(500).json({ error: 'Failed to create grading scale' });
    }
};

/**
 * Update grading scale
 */
exports.updateGradingScale = async (req, res) => {
    try {
        const { scaleId } = req.params;
        const { name, gradeConfig, isDefault } = req.body;

        if (!name || !gradeConfig || !Array.isArray(gradeConfig)) {
            return res.status(400).json({ error: 'Name and valid grade configuration are required' });
        }

        const { pool } = require('../../config/database');
        
        const result = await pool.query(
            `UPDATE grading_scales 
             SET name = $1, grade_config = $2, is_default = $3, updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [name, JSON.stringify(gradeConfig), isDefault || false, scaleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Grading scale not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error in updateGradingScale', { error: error.message });
        res.status(500).json({ error: 'Failed to update grading scale' });
    }
};

/**
 * Toggle grading scale default status
 */
exports.toggleGradingScaleDefault = async (req, res) => {
    try {
        const { scaleId } = req.params;
        const { pool } = require('../../config/database');
        
        // If setting as default, unset all others first
        const checkResult = await pool.query(
            'SELECT is_default FROM grading_scales WHERE id = $1',
            [scaleId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Grading scale not found' });
        }

        const currentDefault = checkResult.rows[0].is_default;
        
        if (!currentDefault) {
            // Unset all other defaults
            await pool.query('UPDATE grading_scales SET is_default = false WHERE is_default = true');
        }

        // Toggle this one
        const result = await pool.query(
            `UPDATE grading_scales 
             SET is_default = NOT is_default, updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [scaleId]
        );

        res.json({
            message: 'Grading scale default status updated successfully',
            scale: result.rows[0]
        });
    } catch (error) {
        logger.error('Error in toggleGradingScaleDefault', { error: error.message });
        res.status(500).json({ error: 'Failed to toggle grading scale default status' });
    }
};

/**
 * Delete grading scale
 */
exports.deleteGradingScale = async (req, res) => {
    try {
        const { scaleId } = req.params;
        const { pool } = require('../../config/database');
        
        // Check if grading scale is being used
        const checkResult = await pool.query(
            `SELECT COUNT(*) as count FROM result_batches WHERE grading_scale_id = $1`,
            [scaleId]
        );

        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(409).json({ 
                error: 'Cannot delete grading scale that is being used in result batches' 
            });
        }

        const result = await pool.query(
            'DELETE FROM grading_scales WHERE id = $1 RETURNING *',
            [scaleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Grading scale not found' });
        }

        res.json({ message: 'Grading scale deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteGradingScale', { error: error.message });
        res.status(500).json({ error: 'Failed to delete grading scale' });
    }
};

/**
 * Import results from CSV
 */
exports.importResults = async (req, res) => {
    try {
        const { classroomId, results, gradingScaleId } = req.body;

        if (!classroomId || !results || !Array.isArray(results) || !gradingScaleId) {
            return res.status(400).json({
                error: 'Classroom ID, grading scale ID, and results array are required'
            });
        }

        const importedResults = await Result.importResults({
            classroomId,
            results,
            gradingScaleId,
            teacherId: req.user.userId
        });

        res.status(201).json({
            message: 'Results imported successfully',
            count: importedResults.length,
            results: importedResults
        });
    } catch (error) {
        logger.error('Error in importResults', { error: error.message });
        res.status(500).json({ error: error.message || 'Failed to import results' });
    }
};

/**
 * Get class results
 */
exports.getClassResults = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const { academicYear, term } = req.query;

        const results = await Result.getClassResults(classroomId, { academicYear, term });
        res.json(results);
    } catch (error) {
        logger.error('Error in getClassResults', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch class results' });
    }
};

/**
 * Get student report card
 */
exports.getStudentReportCard = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { classroomId, academicYear, term } = req.query;

        if (!classroomId) {
            return res.status(400).json({ error: 'Classroom ID is required' });
        }

        const reportCard = await Result.getStudentReportCard(
            studentId,
            classroomId,
            { academicYear, term }
        );

        res.json(reportCard);
    } catch (error) {
        logger.error('Error in getStudentReportCard', { error: error.message });
        res.status(500).json({ error: error.message || 'Failed to fetch report card' });
    }
};

// ============= BATCH MANAGEMENT =============

/**
 * Create a new result batch
 */
exports.createBatch = async (req, res) => {
    try {
        const { batchName, classroomId, academicYear, term, gradingScaleId, subjectGroupId } = req.body;

        if (!batchName || !classroomId || !academicYear || !term || !gradingScaleId || !subjectGroupId) {
            return res.status(400).json({
                error: 'Batch name, classroom, academic year, term, grading scale, and subject group are required'
            });
        }

        const batch = await ResultService.createBatch(req.body, req.user.userId);
        res.status(201).json(batch);
    } catch (error) {
        logger.error('Error in createBatch', { error: error.message });
        res.status(500).json({ error: error.message || 'Failed to create batch' });
    }
};

/**
 * Get all result batches
 */
exports.getAllBatches = async (req, res) => {
    try {
        const { classroomId, academicYear, term, status, limit, offset } = req.query;

        const result = await ResultService.getAllBatches({
            classroomId,
            academicYear,
            term,
            status,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        res.json(result);
    } catch (error) {
        logger.error('Error in getAllBatches', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
};

/**
 * Get batch by ID
 */
exports.getBatchById = async (req, res) => {
    try {
        const { batchId } = req.params;
        const batch = await ResultService.getBatchById(batchId);
        res.json(batch);
    } catch (error) {
        logger.error('Error in getBatchById', { error: error.message });
        
        if (error.message === 'Batch not found') {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        res.status(500).json({ error: 'Failed to fetch batch' });
    }
};

/**
 * Update a batch
 */
exports.updateBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { batchName, classroomId, academicYear, term, gradingScaleId, subjectGroupId } = req.body;

        if (!batchName || !classroomId || !academicYear || !term || !gradingScaleId || !subjectGroupId) {
            return res.status(400).json({
                error: 'Batch name, classroom, academic year, term, grading scale, and subject group are required'
            });
        }

        const batch = await ResultService.updateBatch(batchId, req.body, req.user.userId);
        
        res.json({
            message: 'Batch updated successfully',
            batch
        });
    } catch (error) {
        logger.error('Error in updateBatch', { error: error.message });
        
        if (error.message === 'Batch not found') {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        res.status(500).json({ error: error.message || 'Failed to update batch' });
    }
};

/**
 * Upload CSV and process batch
 */
exports.uploadBatchCSV = async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'CSV file is required' });
        }

        const storageService = require('../../services/storageService');
        
        // Upload CSV to R2
        logger.info('Uploading CSV to R2', { 
            batchId, 
            filename: req.file.originalname,
            size: req.file.size 
        });

        const uploadResult = await storageService.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'results/csv',
            { batchId: batchId.toString(), uploadedBy: req.user.userId }
        );

        logger.info('CSV uploaded to R2', { 
            batchId, 
            fileUrl: uploadResult.fileUrl,
            fileKey: uploadResult.fileKey 
        });

        // Process CSV from R2
        const result = await ResultService.processCSVImport(
            batchId, 
            uploadResult.fileKey, 
            req.user.userId,
            uploadResult.fileUrl
        );

        logger.info('Sending response to client', { batchId, result });

        // Ensure response is sent
        return res.status(200).json({
            success: true,
            message: 'CSV processed successfully',
            imported: result.imported,
            failed: result.failed,
            errors: result.errors || []
        });
    } catch (error) {
        logger.error('Error in uploadBatchCSV', { error: error.message, stack: error.stack });
        return res.status(500).json({ 
            success: false,
            error: error.message || 'Failed to process CSV' 
        });
    }
};

/**
 * Publish batch results
 */
exports.publishBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const batch = await ResultService.publishBatch(batchId, req.user.userId);
        
        res.json({
            message: 'Batch published successfully',
            batch
        });
    } catch (error) {
        logger.error('Error in publishBatch', { error: error.message });
        
        if (error.message === 'Batch not found') {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        res.status(500).json({ error: 'Failed to publish batch' });
    }
};

/**
 * Update batch status
 */
exports.updateBatchStatus = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['draft', 'processing', 'completed', 'published', 'failed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const batch = await ResultService.updateBatchStatus(batchId, status, req.user.userId);
        
        res.json({
            message: 'Batch status updated successfully',
            batch
        });
    } catch (error) {
        logger.error('Error in updateBatchStatus', { error: error.message });
        
        if (error.message === 'Batch not found') {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        res.status(500).json({ error: 'Failed to update batch status' });
    }
};

/**
 * Update batch signatures and names
 */
exports.updateBatchSignatures = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { teacherName, principalName, teacherSignatureUrl, principalSignatureUrl } = req.body;

        const batch = await ResultService.updateBatchSignatures(
            batchId,
            { teacherName, principalName, teacherSignatureUrl, principalSignatureUrl },
            req.user.userId
        );
        
        res.json({
            message: 'Batch signatures updated successfully',
            batch
        });
    } catch (error) {
        logger.error('Error in updateBatchSignatures', { error: error.message });
        
        if (error.message === 'Batch not found') {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        res.status(500).json({ error: error.message || 'Failed to update batch signatures' });
    }
};

/**
 * Upload signature image for batch
 */
exports.uploadSignature = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { type } = req.query; // 'teacher' or 'principal'

        if (!req.file) {
            return res.status(400).json({ error: 'Signature image is required' });
        }

        if (!type || !['teacher', 'principal'].includes(type)) {
            return res.status(400).json({ error: 'Invalid signature type. Must be "teacher" or "principal"' });
        }

        const storageService = require('../../services/storageService');
        
        // Upload signature to R2
        logger.info('Uploading signature to R2', { 
            batchId, 
            type,
            filename: req.file.originalname,
            size: req.file.size 
        });

        const uploadResult = await storageService.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'results/signatures',
            { 
                batchId: batchId.toString(), 
                signatureType: type,
                uploadedBy: req.user.userId 
            }
        );

        logger.info('Signature uploaded to R2', { 
            batchId, 
            type,
            fileUrl: uploadResult.fileUrl,
            fileKey: uploadResult.fileKey 
        });

        // Update the appropriate signature field
        const updateData = type === 'teacher' 
            ? { teacherSignatureUrl: uploadResult.fileUrl }
            : { principalSignatureUrl: uploadResult.fileUrl };

        const batch = await ResultService.updateBatchSignatures(
            batchId,
            updateData,
            req.user.userId
        );

        res.json({
            message: 'Signature uploaded successfully',
            signatureUrl: uploadResult.fileUrl,
            batch
        });
    } catch (error) {
        logger.error('Error in uploadSignature', { error: error.message });
        res.status(500).json({ error: 'Failed to upload signature' });
    }
};

/**
 * Delete batch
 */
exports.deleteBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        await ResultService.deleteBatch(batchId, req.user.userId);
        
        res.json({ message: 'Batch deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteBatch', { error: error.message });
        
        if (error.message === 'Batch not found') {
            return res.status(404).json({ error: 'Batch not found' });
        }
        
        res.status(500).json({ error: 'Failed to delete batch' });
    }
};

/**
 * Get batch results (all results for a batch)
 */
exports.getBatchResults = async (req, res) => {
    try {
        const { batchId } = req.params;
        
        // Get batch info first
        const batch = await ResultService.getBatchById(batchId);
        
        // Get results for this batch's classroom, year, and term
        const results = await Result.getClassResults(
            batch.classroom_id,
            { academicYear: batch.academic_year, term: batch.term }
        );

        res.json({
            batch,
            results
        });
    } catch (error) {
        logger.error('Error in getBatchResults', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch batch results' });
    }
};

/**
 * Download CSV template for a batch
 */
exports.downloadBatchTemplate = async (req, res) => {
    try {
        const { batchId } = req.params;
        
        // Get batch info including subject group
        const batch = await ResultService.getBatchById(batchId);
        
        if (!batch.subject_group_id) {
            return res.status(400).json({ error: 'Batch does not have a subject group assigned' });
        }

        const { pool } = require('../../config/database');

        // Get students in the classroom
        const studentsResult = await pool.query(
            `SELECT u.id as user_id, u.email, u.first_name, u.last_name
             FROM classroom_students cs
             JOIN users u ON cs.student_id = u.id
             WHERE cs.classroom_id = $1
             ORDER BY u.last_name, u.first_name`,
            [batch.classroom_id]
        );

        const students = studentsResult.rows;

        // Get subjects from the subject group
        const subjectsResult = await pool.query(
            `SELECT s.id, s.code, s.name
             FROM subjects s
             JOIN subject_group_subjects sgs ON s.id = sgs.subject_id
             WHERE sgs.subject_group_id = $1
             ORDER BY s.name`,
            [batch.subject_group_id]
        );

        const subjects = subjectsResult.rows;

        if (subjects.length === 0) {
            return res.status(400).json({ error: 'Subject group has no subjects assigned' });
        }

        // Generate CSV header with student info + subject columns (CA and Exam separate)
        let csvHeader = 'user_id,email,first_name,last_name';
        subjects.forEach(subject => {
            csvHeader += `,${subject.code}_CA,${subject.code}_EXAM`;
        });
        csvHeader += '\n';

        // Generate CSV rows with student info and empty score columns
        const csvRows = students.map(student => {
            let row = `${student.user_id},${student.email},${student.first_name},${student.last_name}`;
            // Add empty columns for CA and Exam for each subject
            subjects.forEach(() => {
                row += ',,'; // Two empty columns per subject (CA and Exam)
            });
            return row;
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="result-template-${batch.batch_code}.csv"`);
        res.send(csvContent);

        logger.info('CSV template downloaded', { 
            batchId, 
            studentCount: students.length,
            subjectCount: subjects.length
        });
    } catch (error) {
        logger.error('Error downloading CSV template', { error: error.message });
        res.status(500).json({ error: 'Failed to download template' });
    }
};

// ============= SUBJECT GROUP MANAGEMENT =============

/**
 * Create a new subject group
 */
exports.createSubjectGroup = async (req, res) => {
    try {
        const { name, description, academicSession, term, subjectIds } = req.body;

        if (!name || !subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
            return res.status(400).json({
                error: 'Name and at least one subject are required'
            });
        }

        const group = await ResultService.createSubjectGroup(req.body, req.user.userId);
        res.status(201).json(group);
    } catch (error) {
        logger.error('Error in createSubjectGroup', { error: error.message });
        res.status(500).json({ error: error.message || 'Failed to create subject group' });
    }
};

/**
 * Get all subject groups
 */
exports.getAllSubjectGroups = async (req, res) => {
    try {
        const { academicSession, term, search, limit, offset } = req.query;

        const groups = await ResultService.getAllSubjectGroups({
            academicSession,
            term,
            search,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        res.json(groups);
    } catch (error) {
        logger.error('Error in getAllSubjectGroups', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch subject groups' });
    }
};

/**
 * Get subject group by ID
 */
exports.getSubjectGroupById = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await ResultService.getSubjectGroupById(groupId);
        res.json(group);
    } catch (error) {
        logger.error('Error in getSubjectGroupById', { error: error.message });
        
        if (error.message === 'Subject group not found') {
            return res.status(404).json({ error: 'Subject group not found' });
        }
        
        res.status(500).json({ error: 'Failed to fetch subject group' });
    }
};

/**
 * Update subject group
 */
exports.updateSubjectGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, academicSession, term, subjectIds } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const group = await ResultService.updateSubjectGroup(groupId, req.body, req.user.userId);
        
        res.json({
            message: 'Subject group updated successfully',
            group
        });
    } catch (error) {
        logger.error('Error in updateSubjectGroup', { error: error.message });
        
        if (error.message === 'Subject group not found') {
            return res.status(404).json({ error: 'Subject group not found' });
        }
        
        res.status(500).json({ error: error.message || 'Failed to update subject group' });
    }
};

/**
 * Delete subject group
 */
exports.deleteSubjectGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        await ResultService.deleteSubjectGroup(groupId, req.user.userId);
        
        res.json({ message: 'Subject group deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteSubjectGroup', { error: error.message });
        
        if (error.message === 'Subject group not found') {
            return res.status(404).json({ error: 'Subject group not found' });
        }
        
        if (error.message.includes('being used by result batches')) {
            return res.status(409).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to delete subject group' });
    }
};
