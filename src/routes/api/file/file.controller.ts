import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { getFileHandler, searchFileHandler, updateFileHandler, uploadFileHandler } from './file.service';

const upload = multer({ storage: memoryStorage() });

let router = Router();

// POST /api/file/
router.post('/', upload.single('file'), uploadFileHandler);
// GET /api/file/:id to get a file by id
router.get('/:id', getFileHandler);
// PUT /api/file/:id to update image with new tags/data
router.put('/:id', updateFileHandler);
// GET /api/file/search/:page to get a page of files
router.get('/search/:id/', searchFileHandler);

export default router;