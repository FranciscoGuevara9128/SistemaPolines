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
    const { id_movimiento, cliente_final_id, cantidad_enviada } = req.body;
    const result = await MovimientosService.enviarTransporte({
      id_movimiento,
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
    // cantidad_liberar es opcional: si se omite, libera el total disponible
    const { id_movimiento, cantidad_liberar } = req.body;
    const result = await MovimientosService.liberarPolines({
      id_movimiento,
      cantidad_liberar: cantidad_liberar ? parseInt(cantidad_liberar, 10) : null
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
