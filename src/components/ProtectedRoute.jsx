import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Only users with the specified roles can access this. ex: <ProtectedRoute roles={['admin']}>
export default function ProtectedRoute({ children, roles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="p-8 text-slate-500">Loading...</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}
