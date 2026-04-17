import express from 'express';
import * as GestionController from '../controllers/gestion.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Middleware de protección global para estas rutas
router.use(verificarToken);

// Clientes Directos
router.get('/clientes-directos', GestionController.getClientesDirectos);
router.post('/clientes-directos', GestionController.postClienteDirecto);
router.put('/clientes-directos/:id', GestionController.putClienteDirecto);

// Clientes Finales
router.get('/clientes-finales', GestionController.getClientesFinales);
router.post('/clientes-finales', GestionController.postClienteFinal);
router.put('/clientes-finales/:id', GestionController.putClienteFinal);

// Usuarios
router.get('/usuarios', GestionController.getUsuarios);
router.post('/usuarios', GestionController.postUsuario);
router.put('/usuarios/:id', GestionController.putUsuario);

// Inventario
router.get('/inventario', GestionController.getInventario);
router.put('/inventario/:id', GestionController.putInventario);

export default router;
