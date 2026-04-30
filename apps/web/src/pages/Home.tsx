import { Link as RouterLink } from "react-router";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";

const NAV_CARDS = [
  { to: "/services", title: "Serviços" },
  { to: "/dentists", title: "Dentistas" },
  { to: "/settings", title: "Configurações" },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
    </Box>
  );
}

export default HomePage;
