/**
 * Storage Service - Cloudflare R2
 * Handles file uploads and management using Cloudflare R2 (S3-compatible)
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/winston');

// Initialize R2 client
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Generate a unique file key
 * @param {string} folder - Folder path
 * @param {string} filename - Original filename
 * @returns {string} Unique file key
 */
const generateFileKey = (folder, filename) => {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = filename.split('.').pop();
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${folder}/${timestamp}-${uuid}-${sanitizedName}`;
};

/**
 * Upload file to R2
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} folder - Folder path (e.g., 'courses', 'lessons', 'avatars')
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Upload result with file URL and key
 */
const uploadFile = async (fileBuffer, filename, mimetype, folder = 'uploads', metadata = {}) => {
    try {
        const fileKey = generateFileKey(folder, filename);
        
        // Sanitize metadata values to only include ASCII printable characters
        // S3/R2 metadata values must be ASCII and cannot contain certain characters
        const sanitizeMetadataValue = (value) => {
            if (typeof value !== 'string') return String(value);
            // Remove non-ASCII characters and encode the value
            return value.replace(/[^\x20-\x7E]/g, '').substring(0, 255); // Limit to 255 chars
        };
        
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: mimetype,
            Metadata: {
                originalname: sanitizeMetadataValue(filename),
                uploadedat: new Date().toISOString().replace(/[^0-9T:-]/g, ''),
                ...Object.entries(metadata).reduce((acc, [key, value]) => {
                    acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = sanitizeMetadataValue(value);
                    return acc;
                }, {})
            }
        });

        await r2Client.send(command);

        const fileUrl = `${PUBLIC_URL}/${fileKey}`;

        logger.info('File uploaded successfully', {
            filename,
            fileKey,
            size: fileBuffer.length,
            folder
        });

        return {
            success: true,
            fileUrl,
            fileKey,
            filename,
            size: fileBuffer.length,
            mimetype
        };
    } catch (error) {
        logger.error('File upload failed', {
            filename,
            folder,
            error: error.message
        });
        throw new Error(`File upload failed: ${error.message}`);
    }
};

/**
 * Upload multiple files
 * @param {Array} files - Array of file objects with buffer, filename, mimetype
 * @param {string} folder - Folder path
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleFiles = async (files, folder = 'uploads') => {
    try {
        const uploadPromises = files.map(file => 
            uploadFile(file.buffer, file.filename, file.mimetype, folder, file.metadata || {})
        );
        
        const results = await Promise.all(uploadPromises);
        
        logger.info('Multiple files uploaded', {
            count: files.length,
            folder
        });
        
        return results;
    } catch (error) {
        logger.error('Multiple file upload failed', {
            error: error.message
        });
        throw error;
    }
};

/**
 * Delete file from R2
 * @param {string} fileKey - File key to delete
 * @returns {Promise<boolean>} Deletion success status
 */
const deleteFile = async (fileKey) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        });

        await r2Client.send(command);

        logger.info('File deleted successfully', { fileKey });
        return true;
    } catch (error) {
        logger.error('File deletion failed', {
            fileKey,
            error: error.message
        });
        throw new Error(`File deletion failed: ${error.message}`);
    }
};

/**
 * Delete multiple files
 * @param {Array<string>} fileKeys - Array of file keys to delete
 * @returns {Promise<Object>} Deletion results
 */
const deleteMultipleFiles = async (fileKeys) => {
    try {
        const deletePromises = fileKeys.map(key => deleteFile(key));
        await Promise.all(deletePromises);
        
        logger.info('Multiple files deleted', {
            count: fileKeys.length
        });
        
        return {
            success: true,
            deletedCount: fileKeys.length
        };
    } catch (error) {
        logger.error('Multiple file deletion failed', {
            error: error.message
        });
        throw error;
    }
};

/**
 * Get file metadata
 * @param {string} fileKey - File key
 * @returns {Promise<Object>} File metadata
 */
const getFileMetadata = async (fileKey) => {
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        });

        const response = await r2Client.send(command);

        return {
            contentType: response.ContentType,
            contentLength: response.ContentLength,
            lastModified: response.LastModified,
            metadata: response.Metadata
        };
    } catch (error) {
        logger.error('Failed to get file metadata', {
            fileKey,
            error: error.message
        });
        throw new Error(`Failed to get file metadata: ${error.message}`);
    }
};

/**
 * Generate presigned URL for temporary access
 * @param {string} fileKey - File key
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Presigned URL
 */
const getPresignedUrl = async (fileKey, expiresIn = 3600) => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        });

        const url = await getSignedUrl(r2Client, command, { expiresIn });

        logger.info('Presigned URL generated', {
            fileKey,
            expiresIn
        });

        return url;
    } catch (error) {
        logger.error('Failed to generate presigned URL', {
            fileKey,
            error: error.message
        });
        throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
};

/**
 * Generate presigned URL for upload
 * @param {string} folder - Folder path
 * @param {string} filename - Filename
 * @param {string} mimetype - File MIME type
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<Object>} Presigned upload URL and file key
 */
const getPresignedUploadUrl = async (folder, filename, mimetype, expiresIn = 3600) => {
    try {
        const fileKey = generateFileKey(folder, filename);
        
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            ContentType: mimetype,
        });

        const url = await getSignedUrl(r2Client, command, { expiresIn });

        logger.info('Presigned upload URL generated', {
            fileKey,
            expiresIn
        });

        return {
            uploadUrl: url,
            fileKey,
            fileUrl: `${PUBLIC_URL}/${fileKey}`,
            expiresIn
        };
    } catch (error) {
        logger.error('Failed to generate presigned upload URL', {
            error: error.message
        });
        throw new Error(`Failed to generate presigned upload URL: ${error.message}`);
    }
};

/**
 * Extract file key from URL
 * @param {string} fileUrl - Full file URL
 * @returns {string} File key
 */
const extractFileKey = (fileUrl) => {
    if (!fileUrl) return null;
    
    // Remove the public URL prefix to get the key
    if (fileUrl.startsWith(PUBLIC_URL)) {
        return fileUrl.replace(`${PUBLIC_URL}/`, '');
    }
    
    // If it's already a key, return as is
    return fileUrl;
};

/**
 * Validate file type
 * @param {string} mimetype - File MIME type
 * @param {Array<string>} allowedTypes - Array of allowed MIME types
 * @returns {boolean} Validation result
 */
const validateFileType = (mimetype, allowedTypes) => {
    return allowedTypes.includes(mimetype);
};

/**
 * Validate file size
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {boolean} Validation result
 */
const validateFileSize = (fileSize, maxSize) => {
    return fileSize <= maxSize;
};

/**
 * Get file type category
 * @param {string} mimetype - File MIME type
 * @returns {string} File category (video, audio, image, document, other)
 */
const getFileCategory = (mimetype) => {
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('text')) return 'document';
    return 'other';
};

module.exports = {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    deleteMultipleFiles,
    getFileMetadata,
    getPresignedUrl,
    getPresignedUploadUrl,
    extractFileKey,
    validateFileType,
    validateFileSize,
    getFileCategory
};
