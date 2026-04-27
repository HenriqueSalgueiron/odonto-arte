import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (isBootstrapping || (!isAuthenticated && accessToken)) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <Outlet />;
}
