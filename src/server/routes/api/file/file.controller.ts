import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import {
    getFileHandler,
    getFileStats,
    searchFileHandler,
    updateFileHandler,
    uploadFileHandler,
} from './file.service.js';

const upload = multer({ storage: memoryStorage() });

let router = Router();


// GET /api/file/stats to get current file stats
router.get('/stats', getFileStats);
// POST /api/file/ to upload a file
router.post('/', upload.single('file'), uploadFileHandler);
// GET /api/file/:id to get a file by id
router.get('/:id', getFileHandler);
// PUT /api/file/:id to update image with new tags/data
router.put('/:id', updateFileHandler);
// GET /api/file/search/:page to get a page of files
router.get('/search/:id/', searchFileHandler);

export default router;