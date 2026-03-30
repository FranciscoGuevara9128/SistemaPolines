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
    const data = req.body;
    const result = await MovimientosService.enviarTransporte(data);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const liberarPolines = async (req, res) => {
  try {
    const { id_movimiento } = req.body;
    const result = await MovimientosService.liberarPolines(id_movimiento);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
