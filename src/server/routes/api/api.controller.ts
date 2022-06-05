import { Router } from 'express';
import { apiRedirectHandler } from './api.service.js';
import fileRoutes from './file/file.controller.js';
import subscriptionRoutes from './subscription/subscription.controller.js';

let router = Router();

router.use('/file', fileRoutes);
router.use('/subscription', subscriptionRoutes);
router.get('/', apiRedirectHandler);

export default router;
