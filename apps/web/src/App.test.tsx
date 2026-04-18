import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router";
import App from "@/App";
import theme from "@/theme";

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>{ui}</BrowserRouter>
    </ThemeProvider>
  );
}

describe("App", () => {
  it("renders the hello world page", () => {
    renderWithProviders(<App />);
    expect(screen.getByText("OdontoArte")).toBeInTheDocument();
    expect(
      screen.getByText("Sistema de Gestão de Laboratório de Prótese")
    ).toBeInTheDocument();
  });
});
