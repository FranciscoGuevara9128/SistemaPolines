import * as ClientesService from '../services/clientes.service.js';

export const obtenerPolinesCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ClientesService.obtenerEstadoPolines(id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
