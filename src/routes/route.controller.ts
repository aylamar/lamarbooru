import { Router } from 'express';
import apiRoutes from './api/api.controller.js';

let router = Router();
router.use('/api', apiRoutes);

router.get('/', async (req, res) => {
    await res.render('index', {layout: false, title: 'Home'});
});

export default router;