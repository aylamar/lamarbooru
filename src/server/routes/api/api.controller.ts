import { Router } from "express";
import { apiRedirectHandler } from './api.service.js';
import fileRoutes from "./file/file.controller.js";

let router = Router();

router.use('/file', fileRoutes);
router.get('/', apiRedirectHandler)

export default router;