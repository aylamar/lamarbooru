import { Router } from "express";
import { apiRedirectHandler } from './api.service';
import fileRoutes from "./file/file.controller";

let router = Router();

router.use('/file', fileRoutes);
router.get('/', apiRedirectHandler)

export default router;