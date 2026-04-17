import * as ClientesService from '../services/clientes.service.js';

export const obtenerPolinesCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol: userRole, entityId } = req.user || {};

    // Seguridad: Si es cliente directo, solo puede ver su propia información
    if (userRole === 'CLIENTE_DIRECTO' && id !== entityId) {
      throw new Error('No tiene permisos para ver la información de este cliente.');
    }

    const result = await ClientesService.obtenerEstadoPolines(id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
