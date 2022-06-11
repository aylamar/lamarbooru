import { Router } from 'express';
import { tagSearchHandler } from './tag.service.js';

let router = Router();

// GET /api/tag/search/:tag to get a list of tags starting with :tag
router.get('/search/:tag', tagSearchHandler);

export default router;
