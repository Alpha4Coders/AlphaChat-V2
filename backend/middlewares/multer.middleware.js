import multer from "multer";
import path from "path";

// Configure multer for file uploads
const storage = multer.memoryStorage();

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documents
        'application/pdf',
        'text/plain',
        'text/markdown',
        // Code files
        'text/javascript',
        'application/javascript',
        'text/typescript',
        'application/json',
        'text/html',
        'text/css',
        // Archives
        'application/zip',
        'application/x-rar-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
};

// Max file size: 10MB
const maxSize = 10 * 1024 * 1024;

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: maxSize
    }
});

// Single file upload
export const uploadSingle = upload.single('file');

// Multiple files upload (max 5)
export const uploadMultiple = upload.array('files', 5);

export default { upload, uploadSingle, uploadMultiple };
