import { Router } from 'express';
import { getStats } from './database.service.js';

let router = Router();

// GET /api/database/stats to get current database stats
router.get('/stats', getStats);

export default router;