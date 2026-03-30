import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

export const getReferencias = () => api.get('/referencias');
export const getPolinesCliente = (clienteId) => api.get(`/clientes/${clienteId}/polines`);
export const registrarEntrega = (data) => api.post('/entregas', data);
export const enviarTransporte = (data) => api.post('/movimientos/transporte', data);
export const liberarPolines = (data) => api.post('/movimientos/liberacion', data);
export const generarFacturacion = (data) => api.post('/facturacion/generar', data);

export default api;
