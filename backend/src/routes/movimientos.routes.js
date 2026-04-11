import express from 'express';
import { registrarEntrega, enviarTransporte, liberarPolines, getRecepcionesPendientes, procesarRecepcion } from '../controllers/movimientos.controller.js';

const router = express.Router();

router.post('/entregas', registrarEntrega);
router.post('/movimientos/transporte', enviarTransporte);
router.post('/movimientos/liberacion', liberarPolines);
router.get('/recepciones/pendientes', getRecepcionesPendientes);
router.post('/recepcion', procesarRecepcion);

export default router;
