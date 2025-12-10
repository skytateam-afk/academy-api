const multer = require('multer');
const path = require('path');

// Use memory storage for Cloudflare R2 uploads
const storage = multer.memoryStorage();

// File size limits by role (in bytes)
const SIZE_LIMITS = {
  student: 50 * 1024 * 1024,     // 50MB
  instructor: 100 * 1024 * 1024, // 100MB
  admin: 200 * 1024 * 1024,      // 200MB
  super_admin: 500 * 1024 * 1024 // 500MB
};

// Allowed file types
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Text files
  'text/plain',
  'text/csv',
  'text/html',
  'text/markdown',
  
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  
  // Video
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed'
];

// File filter function
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check if mime type is allowed
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Allowed types: PDF, DOCX, XLSX, PPTX, TXT, CSV, Images, Audio, Video, ZIP`), false);
  }
};

// Get file size limit based on user role
const getSizeLimit = (userRole) => {
  const role = userRole?.toLowerCase() || 'student';
  return SIZE_LIMITS[role] || SIZE_LIMITS.student;
};

// Create upload middleware with dynamic size limit
const createUploadMiddleware = (req, res, next) => {
  const userRole = req.user?.role?.name || 'student';
  const sizeLimit = getSizeLimit(userRole);
  
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: sizeLimit,
      files: 1 // Only one file at a time
    }
  }).single('file');
  
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxSizeMB = Math.floor(sizeLimit / (1024 * 1024));
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size for your role (${userRole}) is ${maxSizeMB}MB`
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Only one file can be uploaded at a time'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }
    
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    next();
  });
};

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  uploadDocument: createUploadMiddleware,
  handleUploadError,
  SIZE_LIMITS,
  ALLOWED_MIME_TYPES
};
