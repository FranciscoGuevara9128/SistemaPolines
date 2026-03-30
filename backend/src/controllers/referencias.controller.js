import * as ReferenciasService from '../services/referencias.service.js';

export const obtenerReferencias = async (req, res) => {
  try {
    const data = await ReferenciasService.obtenerReferencias();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
