import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import crypto from 'crypto';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'rider-movements');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, uploadDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
        // Generate unique filename: timestamp-random-originalname
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        const sanitized = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${uniqueSuffix}-${sanitized}${ext}`);
    }
});

// File filter - only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
};

// Configure multer
export const uploadRiderMovementDocuments = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
    }
}).fields([
    { name: 'handoverPaper', maxCount: 1 },
    { name: 'passingPaper', maxCount: 1 }
]);
