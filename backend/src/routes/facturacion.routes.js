import express from 'express';
import { generarFacturacion } from '../controllers/facturacion.controller.js';

const router = express.Router();

router.post('/facturacion/generar', generarFacturacion);

export default router;
