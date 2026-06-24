import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import theme from "@/theme";
import { queryClient } from "@/lib/queryClient";
import { NotificationProvider } from "@/components/NotificationProvider";
import { SentryFallback } from "@/components/SentryFallback";

// Sentry: inicializa antes da árvore React montar. Pulado se VITE_SENTRY_DSN
// não está setado (default em dev). Em prod (Vercel) é setado como env.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    // Sem performance monitoring (decisão da Etapa 15).
    tracesSampleRate: 0,
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={SentryFallback}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NotificationProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
