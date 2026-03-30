import * as FacturacionService from '../services/facturacion.service.js';

export const generarFacturacion = async (req, res) => {
  try {
    const data = req.body;
    console.log('Solicitud de facturación:', data);
    const result = await FacturacionService.generarFacturacion(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error Generacion Facturacion:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
