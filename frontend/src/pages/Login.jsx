import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReferencias } from '../services/api';

const Login = () => {
  const [role, setRole] = useState('ADMIN');
  const [entityId, setEntityId] = useState('');
  const [referencias, setReferencias] = useState({ clientes_directos: [], clientes_finales: [] });
  const [loading, setLoading] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRef = async () => {
      try {
        const { data } = await getReferencias();
        if (data.success) {
          setReferencias({
            clientes_directos: data.data.clientes_directos || [],
            clientes_finales: data.data.clientes_finales || []
          });
        }
      } catch (e) {
        console.error('Error fetching data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchRef();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (role !== 'ADMIN' && !entityId) {
      alert('Debe seleccionar una entidad para este rol.');
      return;
    }

    let entityName = 'Administrador General';
    if (role === 'CLIENTE_DIRECTO') {
      const cd = referencias.clientes_directos.find(c => c.id === entityId);
      if (cd) entityName = cd.nombre;
    } else if (role === 'CLIENTE_FINAL') {
      const cf = referencias.clientes_finales.find(c => c.id === entityId);
      if (cf) entityName = cf.nombre;
    }

    login({ role, entityId: role === 'ADMIN' ? null : entityId, entityName });
    navigate('/'); // Redirect to dashboard
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p>Cargando opciones...</p></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-indigo-700 font-sans">
            Sistema de Polines
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Selector de Perfil
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccione el Rol
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setEntityId('');
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border bg-white"
              >
                <option value="ADMIN">Administrador General</option>
                <option value="CLIENTE_DIRECTO">Cliente Directo</option>
                <option value="CLIENTE_FINAL">Cliente Final</option>
              </select>
            </div>

            {role === 'CLIENTE_DIRECTO' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccione el Cliente Directo
                </label>
                <select
                  required
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border bg-white"
                >
                  <option value="">-- Seleccione una entidad --</option>
                  {referencias.clientes_directos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {role === 'CLIENTE_FINAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccione el Cliente Final
                </label>
                <select
                  required
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border bg-white"
                >
                  <option value="">-- Seleccione una entidad --</option>
                  {referencias.clientes_finales.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            )}

          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
            >
              Iniciar Sesión de Prueba
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
