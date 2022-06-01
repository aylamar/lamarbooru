import { Router } from "express";
import apiRoutes from "./api/api.controller";

let router = Router();
router.use('/api', apiRoutes);

router.get('/', async (req, res) => {
    await res.send('Hello World!');
})

export default router;