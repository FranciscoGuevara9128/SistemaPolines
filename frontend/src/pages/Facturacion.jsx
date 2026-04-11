import { useState, useEffect } from 'react';
import { generarFacturacion, getReferencias } from '../services/api';

const MESES = [
  { val: 1, nombre: 'Enero' }, { val: 2, nombre: 'Febrero' }, { val: 3, nombre: 'Marzo' },
  { val: 4, nombre: 'Abril' }, { val: 5, nombre: 'Mayo' }, { val: 6, nombre: 'Junio' },
  { val: 7, nombre: 'Julio' }, { val: 8, nombre: 'Agosto' }, { val: 9, nombre: 'Septiembre' },
  { val: 10, nombre: 'Octubre' }, { val: 11, nombre: 'Noviembre' }, { val: 12, nombre: 'Diciembre' }
];

const TRAMO_STYLE = {
  ALMACENAMIENTO: { badge: 'bg-blue-100 text-blue-800', icon: '🏭', label: 'Almacenamiento' },
  TRANSPORTE:     { badge: 'bg-amber-100 text-amber-800', icon: '🚚', label: 'Transporte' },
  PULL_FIJO:      { badge: 'bg-indigo-100 text-indigo-800', icon: '📉', label: 'Pull Fijo' },
  COSTO_ENTREGA:  { badge: 'bg-emerald-100 text-emerald-800', icon: '💵', label: 'Costo Entrega' },
  SINIESTRO:      { badge: 'bg-red-100 text-red-800', icon: '🔥', label: 'Siniestro' }
};

const Facturacion = () => {
  const [formData, setFormData] = useState({
    cliente_directo_id: '',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  });
  const [factura, setFactura] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [referencias, setReferencias] = useState({ clientes_directos: [] });
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    const fetchReferencias = async () => {
      try {
        const { data } = await getReferencias();
        if (data.success) {
          setReferencias({ clientes_directos: data.data.clientes_directos || [] });
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
    setMostrarDetalles(false);
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

  const mesNombre = MESES.find(m => m.val === parseInt(formData.mes, 10))?.nombre || '';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">Generar Facturación Mensual</h1>
      <p className="text-gray-600 text-sm">
        Calcula los montos por tramo: días en almacenamiento y días en transporte, con tarifas independientes.
      </p>

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
              <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
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
            {MESES.map(m => <option key={m.val} value={m.val}>{m.nombre}</option>)}
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Cabecera */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Resumen de Factura</h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono">
              {factura.id?.slice(0, 8)}...
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Período */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Período Facturado</p>
                <p className="font-medium">{mesNombre} {factura.anio}</p>
              </div>
              <div>
                <p className="text-gray-500">Fecha de Generación</p>
                <p className="font-medium">{new Date(factura.fecha_generacion).toLocaleDateString('es-NI')}</p>
              </div>
            </div>

            {/* Resumen extraído de detalles si existen */}
            {factura.detalles && factura.detalles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(TRAMO_STYLE).map(tramo => {
                  const subtotal = factura.detalles.filter(d => d.estado_tramo === tramo).reduce((acc, obj) => acc + parseFloat(obj.subtotal), 0);
                  if (subtotal === 0) return null;
                  const style = TRAMO_STYLE[tramo];
                  return (
                    <div key={tramo} className={`rounded-lg p-3 border ${style.badge.split(' ')[0]} bg-opacity-30 border-opacity-50`}>
                      <div className="flex items-center gap-2 mb-1">
                         <span>{style.icon}</span>
                         <span className={`text-xs font-semibold uppercase ${style.badge.split(' ')[1]}`}>{style.label}</span>
                      </div>
                      <p className={`text-xl font-bold ${style.badge.split(' ')[1].replace('-800', '-900')}`}>
                        ${subtotal.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total */}
            <div className="pt-4 border-t flex justify-between items-center">
              <p className="text-gray-600 font-medium">Total a Pagar</p>
              <p className="text-3xl font-extrabold text-gray-900">${parseFloat(factura.total).toFixed(2)}</p>
            </div>

            {/* Detalles por tramo */}
            {factura.detalles && factura.detalles.length > 0 && (
              <div>
                <button
                  onClick={() => setMostrarDetalles(v => !v)}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {mostrarDetalles ? '▲ Ocultar' : '▼ Ver'} desglose por tramo ({factura.detalles.length} líneas)
                </button>

                {mostrarDetalles && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 font-medium text-gray-600">Tramo</th>
                          <th className="px-3 py-2 font-medium text-gray-600 text-right">Cantidad</th>
                          <th className="px-3 py-2 font-medium text-gray-600 text-right">Días</th>
                          <th className="px-3 py-2 font-medium text-gray-600 text-right">Tarifa/día</th>
                          <th className="px-3 py-2 font-medium text-gray-600 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {factura.detalles.map((d, i) => {
                          const style = TRAMO_STYLE[d.estado_tramo] || { badge: 'bg-gray-100 text-gray-700', icon: '📦' };
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                                  {style.icon} {d.estado_tramo}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">{d.cantidad}</td>
                              <td className="px-3 py-2 text-right">{d.dias}</td>
                              <td className="px-3 py-2 text-right">${parseFloat(d.tarifa).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-medium">${parseFloat(d.subtotal).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturacion;
