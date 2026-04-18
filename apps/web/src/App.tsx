import { Container, Typography, Box } from "@mui/material";

function App() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          OdontoArte
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Sistema de Gestão de Laboratório de Prótese
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
