import express from 'express';
import { obtenerPolinesCliente } from '../controllers/clientes.controller.js';

const router = express.Router();

router.get('/:id/polines', obtenerPolinesCliente);

export default router;
