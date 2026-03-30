import express from 'express';
import { obtenerReferencias } from '../controllers/referencias.controller.js';

const router = express.Router();

router.get('/', obtenerReferencias);

export default router;
