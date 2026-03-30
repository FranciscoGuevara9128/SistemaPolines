import { useState, useEffect } from 'react';
import { enviarTransporte, getReferencias } from '../services/api';

const Transporte = () => {
  const [formData, setFormData] = useState({
    id_movimiento: '',
    cliente_final_id: ''
  });
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
          // Filtrar solo los movimientos que están en almacenamiento, listos para enviar
          const almacenados = data.data.movimientos_activos.filter(m => m.estado_uso === 'ALMACENAMIENTO');
          setReferencias({
            movimientos_activos: almacenados,
            clientes_finales: data.data.clientes_finales || []
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
      await enviarTransporte({
        ...formData
      });
      setMensaje({ tipo: 'success', texto: 'Movimiento enviado a Transporte exitosamente.' });
      setFormData({ id_movimiento: '', cliente_final_id: '' });
      // Remover el movimiento enviado de la lista de pendientes localmente
      setReferencias(prev => ({
        ...prev,
        movimientos_activos: prev.movimientos_activos.filter(m => m.id != formData.id_movimiento)
      }));
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al enviar a transporte. ' + (err.response?.data?.error || err.message) });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">Enviar a Transporte</h1>
      <p className="text-gray-600 text-sm">Cambia el estado de polines en almacenamiento a TRANSPORTE hacia un cliente final.</p>

      {mensaje.texto && (
        <div className={`p-4 rounded-md ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-gray-50 p-6 rounded-lg border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Movimiento en Almacenamiento a Enviar</label>
          <select
            name="id_movimiento"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            value={formData.id_movimiento}
            onChange={handleChange}
          >
            <option value="">-- Seleccione un Lote Disponible --</option>
            {referencias.movimientos_activos.map(mov => (
              <option key={mov.id} value={mov.id}>
                {mov.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente Final (Destino)</label>
          <select
            name="cliente_final_id"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            value={formData.cliente_final_id}
            onChange={handleChange}
          >
            <option value="">-- Seleccione un Cliente Final --</option>
            {referencias.clientes_finales.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="pt-4 border-t">
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-md transition duration-150"
          >
            Enviar a Transporte y Cliente Final
          </button>
        </div>
      </form>
    </div>
  );
};

export default Transporte;
