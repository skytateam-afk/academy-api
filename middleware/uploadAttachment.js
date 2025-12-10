const multer = require('multer');

// Use memory storage for R2 upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Accept PDF, audio (MP3, WAV, OGG), and document files
    const allowedMimeTypes = [
        'application/pdf',
        'audio/mpeg',        // MP3
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/ogg',
        'audio/x-ogg',
        'application/msword', // DOC
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/vnd.ms-excel', // XLS
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.ms-powerpoint', // PPT
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
        'text/plain',        // TXT
        'application/zip',   // ZIP
        'application/x-zip-compressed'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed. Allowed types: PDF, MP3, WAV, OGG, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP'), false);
    }
};

const uploadAttachment = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

module.exports = uploadAttachment;
