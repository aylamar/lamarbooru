import { Router } from "express";
import imageRoutes from "./image/";

let router = Router();
router.use('/image', imageRoutes);

router.get('/', async (req, res) => {
    await res.sendStatus(200);
})

export default router;