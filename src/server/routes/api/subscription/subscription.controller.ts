import { Router } from 'express';
import {
    getLogsByIdHandler,
    getSubscriptionAllHandler,
    getSubscriptionByIdHandler,
    newSubscriptionHandler,
    updateSubStatusHandler,
} from './subscription.service.js';

let router = Router();

router.get('/', getSubscriptionAllHandler);
router.post('/', newSubscriptionHandler);
router.get('/logs/:id', getLogsByIdHandler);
router.get('/:id', getSubscriptionByIdHandler);
router.put('/:id', updateSubStatusHandler);

export default router;
