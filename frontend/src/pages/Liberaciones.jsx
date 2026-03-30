import { useState, useEffect } from 'react';
import { liberarPolines, getReferencias } from '../services/api';

const Liberaciones = () => {
  const [formData, setFormData] = useState({
    id_movimiento: ''
  });
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [referencias, setReferencias] = useState({
    movimientos_activos: []
  });

  useEffect(() => {
    const fetchReferencias = async () => {
      try {
        const { data } = await getReferencias();
        if (data.success) {
          // Filtrar movimientos que estén en transporte listos para ser liberados 
          // (o cualquier estado activo si la lógica del negocio lo requiere)
          const transportados = data.data.movimientos_activos.filter(m => m.estado_uso === 'TRANSPORTE');
          setReferencias({
            movimientos_activos: transportados
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
    try {
      await liberarPolines({
        id_movimiento: formData.id_movimiento
      });
      setMensaje({ tipo: 'success', texto: 'Polines liberados exitosamente. Inventario reabastecido.' });
      setFormData({ id_movimiento: '' });
      // Remover de la lista
      setReferencias(prev => ({
        ...prev,
        movimientos_activos: prev.movimientos_activos.filter(m => m.id != formData.id_movimiento)
      }));
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al liberar polines. ' + (err.response?.data?.error || err.message) });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">Liberación de Polines</h1>
      <p className="text-gray-600 text-sm">Libera los polines de un movimiento (transporte o almacenamiento) para que vuelvan al inventario general.</p>

      {mensaje.texto && (
        <div className={`p-4 rounded-md ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50 p-6 rounded-lg border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Movimiento a Liberar</label>
          <select
            name="id_movimiento"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            value={formData.id_movimiento}
            onChange={handleChange}
          >
            <option value="">-- Seleccione el Movimiento a Finalizar --</option>
            {referencias.movimientos_activos.map(mov => (
              <option key={mov.id} value={mov.id}>
                {mov.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Muestra los polines actualmente en sitio del Cliente Final.</p>
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
