import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Usuario no autenticado, redirigir a Login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Usuario autenticado pero sin rol permitido, redirigir al Dashboard principal
    return <Navigate to="/" replace />;
  }

  // Usuario autenticado y con rol permitido, mostrar contenido anidado
  return <Outlet />;
};

export default ProtectedRoute;
