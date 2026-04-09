import * as ReferenciasService from '../services/referencias.service.js';

export const obtenerReferencias = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    const entityId = req.headers['x-user-entity-id'];
    
    // Si la llamada no tiene cabeceras (por ej, desde el Login), se comporta como ADMIN pero sin entityId.
    // El servicio maneja role !== CLIENTE_* sin filtros adicionales.

    const data = await ReferenciasService.obtenerReferencias(userRole, entityId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
