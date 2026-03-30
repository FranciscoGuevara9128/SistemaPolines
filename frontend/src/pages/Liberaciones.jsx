import { useState, useEffect } from 'react';
import { liberarPolines, getReferencias } from '../services/api';

const BADGE = {
  ALMACENAMIENTO: 'bg-blue-100 text-blue-800',
  TRANSPORTE:     'bg-amber-100 text-amber-800'
};

const Liberaciones = () => {
  const [formData, setFormData] = useState({ id_movimiento: '', cantidad_liberar: '' });
  const [movSeleccionado, setMovSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [referencias, setReferencias] = useState({ movimientos_activos: [] });

  useEffect(() => {
    fetchReferencias();
  }, []);

  const fetchReferencias = async () => {
    try {
      const { data } = await getReferencias();
      if (data.success) {
        setReferencias({ movimientos_activos: data.data.movimientos_activos });
      }
    } catch (err) {
      console.error('Error cargando referencias:', err);
    }
  };

  const handleMovimientoChange = (e) => {
    const id = e.target.value;
    const mov = referencias.movimientos_activos.find(m => m.id === id);
    setMovSeleccionado(mov || null);
    setFormData({
      id_movimiento: id,
      cantidad_liberar: mov ? mov.cantidad_restante : ''
    });
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    try {
      const cantidadEnviada = parseInt(formData.cantidad_liberar, 10);
      const result = await liberarPolines({
        id_movimiento: formData.id_movimiento,
        cantidad_liberar: cantidadEnviada
      });

      const { parcial, cantidad_liberada, cantidad_restante, estado_previo } = result.data.data;
      setMensaje({
        tipo: 'success',
        texto: parcial
          ? `Liberación parcial desde ${estado_previo}: ${cantidad_liberada} liberadas. Quedan ${cantidad_restante} activas.`
          : `Liberación total desde ${estado_previo}. ${cantidad_liberada} polines devueltos al inventario.`
      });

      if (!parcial) {
        // Movimiento cerrado: quitar de la lista
        setReferencias(prev => ({
          ...prev,
          movimientos_activos: prev.movimientos_activos.filter(m => m.id !== formData.id_movimiento)
        }));
      } else {
        // Parcial: actualizar cantidad_restante en la lista
        setReferencias(prev => ({
          ...prev,
          movimientos_activos: prev.movimientos_activos.map(m =>
            m.id === formData.id_movimiento
              ? { ...m, cantidad_restante, label: m.label.replace(/^\[(\w+)\] \d+/, `[$1] ${cantidad_restante}`) }
              : m
          )
        }));
      }

      setFormData({ id_movimiento: '', cantidad_liberar: '' });
      setMovSeleccionado(null);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al liberar polines. ' + (err.response?.data?.error || err.message) });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">Liberación de Polines</h1>
      <p className="text-gray-600 text-sm">
        Libera polines de cualquier movimiento activo (almacenamiento o transporte). Puedes liberar una cantidad parcial.
      </p>

      {mensaje.texto && (
        <div className={`p-4 rounded-md ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50 p-6 rounded-lg border border-gray-100">
        {/* Selector de movimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Movimiento a Liberar
          </label>
          <select
            name="id_movimiento"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            value={formData.id_movimiento}
            onChange={handleMovimientoChange}
          >
            <option value="">-- Seleccione el Movimiento a Finalizar --</option>
            {referencias.movimientos_activos.map(mov => (
              <option key={mov.id} value={mov.id}>{mov.label}</option>
            ))}
          </select>

          {movSeleccionado && (
            <div className="mt-2 flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE[movSeleccionado.estado_uso] || 'bg-gray-100 text-gray-700'}`}>
                {movSeleccionado.estado_uso}
              </span>
              <span className="text-xs text-gray-500">
                Disponibles: <strong>{movSeleccionado.cantidad_restante}</strong> unidades
              </span>
            </div>
          )}
        </div>

        {/* Cantidad a liberar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad a Liberar
          </label>
          <input
            type="number"
            name="cantidad_liberar"
            required
            min="1"
            max={movSeleccionado?.cantidad_restante || undefined}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            value={formData.cantidad_liberar}
            onChange={handleChange}
            placeholder={movSeleccionado ? `Máx. ${movSeleccionado.cantidad_restante}` : 'Seleccione un movimiento primero'}
          />
          {movSeleccionado && formData.cantidad_liberar !== '' && parseInt(formData.cantidad_liberar, 10) < movSeleccionado.cantidad_restante && (
            <p className="mt-1 text-xs text-amber-600">
              Liberación parcial — {movSeleccionado.cantidad_restante - parseInt(formData.cantidad_liberar, 10)} unidades permanecerán activas.
            </p>
          )}
          {movSeleccionado && formData.cantidad_liberar !== '' && parseInt(formData.cantidad_liberar, 10) === movSeleccionado.cantidad_restante && (
            <p className="mt-1 text-xs text-emerald-600">
              Liberación total — el movimiento será cerrado.
            </p>
          )}
        </div>

        <div className="pt-4 border-t">
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-md transition duration-150"
          >
            Confirmar Liberación y Retorno a Inventario
          </button>
        </div>
      </form>
    </div>
  );
};

export default Liberaciones;
