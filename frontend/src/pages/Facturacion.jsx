import { useState, useEffect } from 'react';
import { generarFacturacion, getReferencias } from '../services/api';

const MESES = [
  { val: 1, nombre: 'Enero' }, { val: 2, nombre: 'Febrero' }, { val: 3, nombre: 'Marzo' },
  { val: 4, nombre: 'Abril' }, { val: 5, nombre: 'Mayo' }, { val: 6, nombre: 'Junio' },
  { val: 7, nombre: 'Julio' }, { val: 8, nombre: 'Agosto' }, { val: 9, nombre: 'Septiembre' },
  { val: 10, nombre: 'Octubre' }, { val: 11, nombre: 'Noviembre' }, { val: 12, nombre: 'Diciembre' }
];

const Facturacion = () => {
  const [formData, setFormData] = useState({
    cliente_directo_id: '',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  });
  const [factura, setFactura] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [referencias, setReferencias] = useState({
    clientes_directos: []
  });

  useEffect(() => {
    const fetchReferencias = async () => {
      try {
        const { data } = await getReferencias();
        if (data.success) {
          setReferencias({
            clientes_directos: data.data.clientes_directos || []
          });
        }
      } catch (err) {
        console.error('Error cargando referencias:', err);
      }
    };
    fetchReferencias();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    setFactura(null);
    try {
      const resp = await generarFacturacion({
        cliente_directo_id: formData.cliente_directo_id,
        mes: parseInt(formData.mes, 10),
        anio: parseInt(formData.anio, 10)
      });
      setFactura(resp.data.data);
      setMensaje({ tipo: 'success', texto: 'Facturación generada correctamente.' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al generar facturación. ' + (err.response?.data?.error || err.message) });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">Generar Facturación Mensual</h1>
      <p className="text-gray-600 text-sm">Calcula los montos a cobrar por almacenamiento y transporte en un mes específico.</p>

      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente Directo a Facturar</label>
          <select
            name="cliente_directo_id"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            value={formData.cliente_directo_id}
            onChange={handleChange}
          >
            <option value="">-- Seleccione un Cliente --</option>
            {referencias.clientes_directos.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
          <select
            name="mes"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            value={formData.mes}
            onChange={handleChange}
          >
            {MESES.map(m => (
              <option key={m.val} value={m.val}>{m.nombre}</option>
            ))}
          </select>
        </div>

        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <input
            type="number"
            name="anio"
            min="2020" max="2100"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            value={formData.anio}
            onChange={handleChange}
          />
        </div>
        
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-150 h-10"
        >
          Generar y Calcular
        </button>
      </form>

      {mensaje.texto && (
        <div className={`p-4 rounded-md ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      {factura && (
        <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Resumen de Factura</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              ID: {factura.id}
            </span>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Periodo Facturado</p>
              <p className="text-base font-medium">{factura.mes} / {factura.anio}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha de Generación</p>
              <p className="text-base font-medium">{new Date(factura.fecha_generacion).toLocaleDateString()}</p>
            </div>
            <div className="col-span-2 pt-4 border-t mt-2">
              <p className="text-sm text-gray-500 mb-1">Total a Pagar</p>
              <p className="text-3xl font-bold text-gray-900">${parseFloat(factura.total).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturacion;
