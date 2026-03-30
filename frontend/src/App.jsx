import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Entregas from './pages/Entregas';
import Transporte from './pages/Transporte';
import Liberaciones from './pages/Liberaciones';
import Facturacion from './pages/Facturacion';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="entregas" element={<Entregas />} />
        <Route path="transporte" element={<Transporte />} />
        <Route path="liberaciones" element={<Liberaciones />} />
        <Route path="facturacion" element={<Facturacion />} />
      </Route>
    </Routes>
  );
}

export default App;
