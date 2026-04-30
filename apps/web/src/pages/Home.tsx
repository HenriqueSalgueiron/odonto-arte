import { Link as RouterLink, useNavigate } from "react-router";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";

const NAV_CARDS = [
  { to: "/services", title: "Serviços" },
  { to: "/dentists", title: "Dentistas" },
];

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
          justifyContent: "center",
          gap: 3,
          py: 4,
        }}
      >
        <Typography variant="h4" component="h1">
          Bem-vindo, {user?.name ?? ""}
        </Typography>

        <Stack spacing={2}>
          {NAV_CARDS.map((card) => (
            <Card key={card.to}>
              <CardActionArea component={RouterLink} to={card.to}>
                <CardContent>
                  <Typography variant="h6">{card.title}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>

        <Button variant="outlined" onClick={handleLogout}>
          Sair
        </Button>
      </Box>
    </Container>
  );
}

export default HomePage;
