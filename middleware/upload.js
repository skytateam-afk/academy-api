const multer = require('multer');

// Use memory storage for R2 upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept different file types based on field name
    if (file.fieldname === 'video') {
        // Accept video and audio files
        if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video and audio files are allowed for video field!'), false);
        }
    } else if (file.fieldname === 'attachment') {
        // Accept attachment file types
        const allowedMimeTypes = [
            'application/pdf',
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/zip', 'application/x-zip-compressed'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed for attachment! Supported: PDF, MP3, WAV, OGG, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP'), false);
        }
    } else {
        // Accept any file type for other fields
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
});

module.exports = upload;
