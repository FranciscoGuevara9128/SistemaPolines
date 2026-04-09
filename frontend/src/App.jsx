import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Entregas from './pages/Entregas';
import Transporte from './pages/Transporte';
import Liberaciones from './pages/Liberaciones';
import Facturacion from './pages/Facturacion';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Rutas protegidas genéricas (cualquier rol logueado) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="liberaciones" element={<Liberaciones />} />

          {/* Rutas para Admin y Cliente Directo */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CLIENTE_DIRECTO']} />}>
            <Route path="transporte" element={<Transporte />} />
          </Route>

          {/* Rutas Solo Admin */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="entregas" element={<Entregas />} />
            <Route path="facturacion" element={<Facturacion />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
