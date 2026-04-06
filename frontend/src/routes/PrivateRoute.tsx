import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type PrivateRouteProps = {
  children: React.ReactNode;
};

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span>Carregando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
