const multer = require('multer');
const path = require('path');

// Use memory storage for Cloudflare R2 uploads
// Files will be buffered in memory and then uploaded to R2
const storage = multer.memoryStorage();

// File filter for library files
const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    // Documents
    'application/pdf': ['.pdf'],
    // Audio
    'audio/mpeg': ['.mp3'],
    'audio/mp3': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    // Video
    'video/mp4': ['.mp4'],
    'video/avi': ['.avi'],
    'video/x-matroska': ['.mkv'],
    'video/webm': ['.webm'],
    'video/mov': ['.mov'],
    // Images for thumbnails
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  };

  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'thumbnail') {
    // Thumbnails must be images
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Thumbnail must be an image file (JPEG, PNG, or WebP)'), false);
    }
  } else if (file.fieldname === 'file') {
    // Files can be PDF, audio, or video
    if (allowedMimes[file.mimetype] && allowedMimes[file.mimetype].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File must be PDF, MP3, WAV, OGG, MP4, AVI, MKV, WebM, or MOV'), false);
    }
  } else {
    cb(new Error('Invalid field name'), false);
  }
};

// Create upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for files
    files: 2 // Max 2 files (1 file + 1 thumbnail)
  }
});

// Middleware to handle both file and thumbnail upload
const uploadLibraryFiles = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Middleware to handle only thumbnail upload (for cover images)
const uploadLibraryThumbnail = upload.single('thumbnail');

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 2 files (1 file + 1 thumbnail)'
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
  uploadLibraryFiles,
  uploadLibraryThumbnail,
  handleUploadError
};
