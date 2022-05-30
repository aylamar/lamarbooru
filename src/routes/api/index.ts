import { Router } from "express";
import fileRoutes from "./file/";

let router = Router();
router.use('/file', fileRoutes);

router.get('/', async (req, res) => {
    await res.sendStatus(200);
})

export default router;