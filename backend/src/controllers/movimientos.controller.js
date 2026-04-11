import * as MovimientosService from '../services/movimientos.service.js';

export const registrarEntrega = async (req, res) => {
  try {
    const data = req.body;
    const result = await MovimientosService.registrarEntrega(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const enviarTransporte = async (req, res) => {
  try {
    const { cliente_directo_id, tipo_polin_id, color_polin_id, cliente_final_id, cantidad_enviada } = req.body;
    const userRole = req.headers['x-user-role'];
    const entityId = req.headers['x-user-entity-id'];

    // Seguridad: Si es cliente directo, solo puede enviar transporte de su propia fábrica
    if (userRole === 'CLIENTE_DIRECTO' && cliente_directo_id !== entityId) {
      throw new Error('No tiene permisos para enviar inventario de otro cliente.');
    }

    const result = await MovimientosService.enviarTransporte({
      cliente_directo_id,
      tipo_polin_id,
      color_polin_id,
      cliente_final_id,
      cantidad_enviada: parseInt(cantidad_enviada, 10)
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const liberarPolines = async (req, res) => {
  try {
    const { estado_uso, cliente_dueño_id, tipo_polin_id, color_polin_id, cantidad_liberar } = req.body;
    const userRole = req.headers['x-user-role'];
    const entityId = req.headers['x-user-entity-id'];

    // Seguridad: Cliente directo solo puede liberar su almacenamiento o pull fijo. Cliente final solo su transporte.
    if (userRole === 'CLIENTE_DIRECTO') {
      if (!['ALMACENAMIENTO', 'PULL_FIJO'].includes(estado_uso) || cliente_dueño_id !== entityId) {
         throw new Error('No tiene permisos para liberar este inventario.');
      }
    } else if (userRole === 'CLIENTE_FINAL') {
      if (estado_uso !== 'TRANSPORTE' || cliente_dueño_id !== entityId) {
         throw new Error('No tiene permisos para liberar este inventario.');
      }
    }

    const result = await MovimientosService.liberarPolines({
      estado_uso,
      cliente_dueño_id,
      tipo_polin_id,
      color_polin_id,
      cantidad_liberar: cantidad_liberar ? parseInt(cantidad_liberar, 10) : null
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getRecepcionesPendientes = async (req, res) => {
  try {
    const result = await MovimientosService.getRecepcionesPendientes();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const procesarRecepcion = async (req, res) => {
  try {
    const data = req.body;
    const result = await MovimientosService.procesarRecepcion(data);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
