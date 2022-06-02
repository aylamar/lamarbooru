import { Router } from 'express';
import apiRoutes from './api/api.controller.js';

let router = Router();
router.use('/api', apiRoutes);

export default router;