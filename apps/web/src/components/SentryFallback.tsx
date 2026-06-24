import { Box, Button, Container, Stack, Typography } from "@mui/material";

// Renderizado pelo Sentry.ErrorBoundary quando algum erro de render derruba
// a app. O Sentry captura o erro automaticamente; aqui mostramos uma tela
// mínima e útil pra usuária recuperar.
export function SentryFallback() {
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3} alignItems="center" textAlign="center">
        <Typography variant="h4" component="h1">
          Algo deu errado.
        </Typography>
        <Typography color="text.secondary">
          Tente recarregar a página. Se o problema continuar, entre em contato
          com o suporte.
        </Typography>
        <Box>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            size="large"
          >
            Recarregar
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
