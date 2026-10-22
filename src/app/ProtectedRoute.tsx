import { Navigate, Outlet } from "react-router-dom";
import type { PropsWithChildren } from "react";
import type { Role } from "@/components/core/constants/roles";
import { useAuth } from "./providers/use-auth";
import { FullScreenLoader } from "@/features/shared/components/FullScreenLoader";

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles: readonly Role[];
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.dashboardPath()} replace />;
  }
  return children ?? <Outlet />;
}
