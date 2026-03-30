import { useState, useEffect } from 'react';
import { enviarTransporte, getReferencias } from '../services/api';

const Transporte = () => {
  const [formData, setFormData] = useState({
    id_movimiento: '',
    cliente_final_id: '',
    cantidad_enviada: ''
  });
  const [movSeleccionado, setMovSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [referencias, setReferencias] = useState({
    movimientos_activos: [],
    clientes_finales: []
  });

  useEffect(() => {
    const fetchReferencias = async () => {
      try {
        const { data } = await getReferencias();
        if (data.success) {
          // Solo movimientos en ALMACENAMIENTO con cantidad_restante > 0 y que sean raíz (no hijos)
          const disponibles = data.data.movimientos_activos.filter(
            m => m.estado_uso === 'ALMACENAMIENTO' && m.cantidad_restante > 0 && !m.es_hijo
          );
          setReferencias({
            movimientos_activos: disponibles,
            clientes_finales: data.data.clientes_finales || []
          });
        }
      } catch (err) {
        console.error('Error cargando referencias', err);
      }
    };
    fetchReferencias();
  }, []);

  const handleMovimientoChange = (e) => {
    const id = e.target.value;
    const mov = referencias.movimientos_activos.find(m => m.id === id);
    setMovSeleccionado(mov || null);
    setFormData(prev => ({
      ...prev,
      id_movimiento: id,
      cantidad_enviada: mov ? mov.cantidad_restante : ''
    }));
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    try {
      const result = await enviarTransporte({
        id_movimiento: formData.id_movimiento,
        cliente_final_id: formData.cliente_final_id,
        cantidad_enviada: parseInt(formData.cantidad_enviada, 10)
      });
      const { restante_en_origen, origen_cerrado } = result.data.data;
      const msg = origen_cerrado
        ? 'Lote completo enviado a transporte. El origen fue cerrado.'
        : `Envío parcial registrado. Quedan ${restante_en_origen} unidades en almacenamiento.`;
      setMensaje({ tipo: 'success', texto: msg });
      setFormData({ id_movimiento: '', cliente_final_id: '', cantidad_enviada: '' });
      setMovSeleccionado(null);
      // Actualizar lista local
      setReferencias(prev => ({
        ...prev,
        movimientos_activos: origen_cerrado
          ? prev.movimientos_activos.filter(m => m.id !== formData.id_movimiento)
          : prev.movimientos_activos.map(m =>
              m.id === formData.id_movimiento
                ? { ...m, cantidad_restante: restante_en_origen, label: m.label.replace(/^\[ALMACENAMIENTO\] \d+/, `[ALMACENAMIENTO] ${restante_en_origen}`) }
                : m
            )
      }));
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al enviar a transporte. ' + (err.response?.data?.error || err.message) });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">Enviar a Transporte</h1>
      <p className="text-gray-600 text-sm">
        Envía polines en almacenamiento hacia un cliente final. Puedes enviar una cantidad parcial del lote.
      </p>

      {mensaje.texto && (
        <div className={`p-4 rounded-md ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50 p-6 rounded-lg border border-gray-100">
        {/* Movimiento origen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lote en Almacenamiento a Enviar
          </label>
          <select
            name="id_movimiento"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            value={formData.id_movimiento}
            onChange={handleMovimientoChange}
          >
            <option value="">-- Seleccione un Lote Disponible --</option>
            {referencias.movimientos_activos.map(mov => (
              <option key={mov.id} value={mov.id}>{mov.label}</option>
            ))}
          </select>
          {movSeleccionado && (
            <p className="mt-1 text-xs text-blue-600 font-medium">
              Disponible para envío: <strong>{movSeleccionado.cantidad_restante}</strong> unidades
            </p>
          )}
        </div>

        {/* Cantidad a enviar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad a Enviar
          </label>
          <input
            type="number"
            name="cantidad_enviada"
            required
            min="1"
            max={movSeleccionado?.cantidad_restante || undefined}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            value={formData.cantidad_enviada}
            onChange={handleChange}
            placeholder={movSeleccionado ? `Máx. ${movSeleccionado.cantidad_restante}` : 'Seleccione un lote primero'}
          />
          {movSeleccionado && parseInt(formData.cantidad_enviada, 10) < movSeleccionado.cantidad_restante && formData.cantidad_enviada !== '' && (
            <p className="mt-1 text-xs text-amber-600">
              Envío parcial — {movSeleccionado.cantidad_restante - parseInt(formData.cantidad_enviada, 10)} unidades quedarán en almacenamiento.
            </p>
          )}
        </div>

        {/* Cliente final */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente Final (Destino)
          </label>
          <select
            name="cliente_final_id"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            value={formData.cliente_final_id}
            onChange={handleChange}
          >
            <option value="">-- Seleccione un Cliente Final --</option>
            {referencias.clientes_finales.map(cliente => (
              <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t">
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-md transition duration-150"
          >
            Enviar a Transporte
          </button>
        </div>
      </form>
    </div>
  );
};

export default Transporte;
