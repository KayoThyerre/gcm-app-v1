import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type RequireRoleProps = {
  allowedRoles: Array<"ADMIN" | "USER">;
  children: React.ReactNode;
};

export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role as "ADMIN" | "USER")) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
