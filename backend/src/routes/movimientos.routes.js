import express from 'express';
import { registrarEntrega, enviarTransporte, liberarPolines } from '../controllers/movimientos.controller.js';

const router = express.Router();

router.post('/entregas', registrarEntrega);
router.post('/movimientos/transporte', enviarTransporte);
router.post('/movimientos/liberacion', liberarPolines);

export default router;
