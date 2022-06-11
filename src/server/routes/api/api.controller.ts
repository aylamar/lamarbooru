import { Router } from 'express';
import { apiRedirectHandler } from './api.service.js';
import databaseController from './database/database.controller.js';
import fileRoutes from './file/file.controller.js';
import subscriptionRoutes from './subscription/subscription.controller.js';
import tagController from './tag/tag.controller.js';

let router = Router();

router.use('/file', fileRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/database', databaseController);
router.use('/tag', tagController);
router.get('/', apiRedirectHandler);

export default router;
