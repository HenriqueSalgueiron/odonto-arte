import { useNavigate } from "react-router";
import { Box, Button, Container, Typography } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Olá, {user?.name ?? ""}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sistema de Gestão de Laboratório de Prótese
        </Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Sair
        </Button>
      </Box>
    </Container>
  );
}

export default HomePage;
