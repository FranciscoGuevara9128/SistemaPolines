import express from 'express';
import { obtenerReferencias } from '../controllers/referencias.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(verificarToken);

router.get('/', obtenerReferencias);

export default router;
