import { useState, useEffect } from 'react';
import { getPolinesCliente, getReferencias } from '../services/api';

const Dashboard = () => {
  const [clienteId, setClienteId] = useState('');
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState('');
  const [clientesDirectos, setClientesDirectos] = useState([]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data } = await getReferencias();
        if (data.success && data.data.clientes_directos) {
          setClientesDirectos(data.data.clientes_directos);
        }
      } catch (err) {
        console.error('Error cargando clientes para el dashboard', err);
      }
    };
    fetchClientes();
  }, []);

  const handleBuscar = async (e) => {
    e.preventDefault();
    if (!clienteId) return;
    try {
      const response = await getPolinesCliente(clienteId);
      setEstado(response.data.data);
      setError('');
    } catch (err) {
      setError('Error al obtener el estado. Verifica el ID del cliente.');
      setEstado(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">Estado de Polines por Cliente</h1>
      
      <form onSubmit={handleBuscar} className="flex gap-4 items-end">
        <div className="flex-1 max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente Directo</label>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
          >
            <option value="">-- Selecciona el Cliente Directo --</option>
            {clientesDirectos.map(cliente => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-150"
        >
          Consultar
        </button>
      </form>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {estado && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white border rounded-lg shadow-sm p-6 flex flex-col items-center justify-center transform transition hover:scale-105">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">En Almacenamiento</h3>
            <p className="text-4xl font-extrabold text-blue-600 mt-2">{estado.almacenamiento}</p>
            <div className="mt-4 text-xs text-center text-gray-400">Polines actualmente en bodegas del cliente</div>
          </div>
          
          <div className="bg-white border rounded-lg shadow-sm p-6 flex flex-col items-center justify-center transform transition hover:scale-105">
            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">En Transporte</h3>
            <p className="text-4xl font-extrabold text-green-600 mt-2">{estado.transporte}</p>
            <div className="mt-4 text-xs text-center text-gray-400">Polines enviados al cliente final</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
