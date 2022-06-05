import { Router } from 'express';
import {
    getLogsByIdHandler,
    getRunsByTagsHandler,
    getSubscriptionAllHandler,
    getSubscriptionByIdHandler,
    newSubscriptionHandler,
} from './subscription.service.js';

let router = Router();

router.get('/', getSubscriptionAllHandler);
router.post('/', newSubscriptionHandler);
router.get('/runs', getRunsByTagsHandler);
router.get('/logs/:id', getLogsByIdHandler);
router.get('/:id', getSubscriptionByIdHandler);

export default router;
