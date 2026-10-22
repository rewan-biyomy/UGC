import { Navigate, createBrowserRouter } from "react-router-dom";
import { Role } from "@/components/core/constants/roles";
import { ProtectedRoute } from "./ProtectedRoute";
import { LandingPage } from "@/features/landing/LandingPage";
import { OnboardingWizard } from "@/features/auth/components/OnboardingWizard";
import { AdminEntry } from "@/features/admin/AdminEntry";
import { BrowseCreatorsPage } from "@/features/client/BrowseCreatorsPage";
import { CreatorProfilePage } from "@/features/client/CreatorProfilePage";
import { ClientRequestsPage } from "@/features/client/ClientRequestsPage";
import { CreatorDashboard } from "@/features/creator/CreatorDashboard";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/auth", element: <OnboardingWizard /> },
  { path: "/admin", element: <AdminEntry /> },
  {
    element: <ProtectedRoute allowedRoles={[Role.CLIENT]} />,
    children: [
      { path: "/client", element: <BrowseCreatorsPage /> },
      { path: "/client/requests", element: <ClientRequestsPage /> },
      { path: "/client/creators/:creatorId", element: <CreatorProfilePage /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[Role.CREATOR]} />,
    children: [{ path: "/creator", element: <CreatorDashboard /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={[Role.CREATOR]} />,
    children: [
      { path: "/creator/profile", element: <CreatorDashboard /> },
      { path: "/creator/portfolio", element: <CreatorDashboard /> },
      { path: "/creator/upload", element: <CreatorDashboard /> },
      { path: "/creator/requests", element: <CreatorDashboard /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);