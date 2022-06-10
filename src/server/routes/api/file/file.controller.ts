import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import {
    getFileHandler,
    getFileStats,
    searchFileHandler,
    tagSearchHandler,
    trashFileHandler,
    unTrashFileHandler,
    updateFileHandler,
    uploadBooruFile,
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
// PUT /api/file/trash/:id sets a file's status as "trash" to be deleted in a few days
router.put('/trash/:id', unTrashFileHandler);
// DELETE /api/file/trash/:id sets a file's status as "trash" to be deleted in a few days
router.delete('/trash/:id', trashFileHandler);
// GET /api/file/search/:page to get a page of files
router.get('/search/:id/', searchFileHandler);
// PUT /api/file/booru to upload a file from booru
router.post('/booru', uploadBooruFile);
// GET /api/file/tags/:tag to get a list of tags starting with :tag
router.get('/tags/:tag', tagSearchHandler);

export default router;
