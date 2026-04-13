import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types/User";

type RequireRoleProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
