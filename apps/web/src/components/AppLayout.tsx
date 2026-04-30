import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { to: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Serviços" },
  { to: "/dentists", label: "Dentistas" },
  { to: "/settings", label: "Configurações" },
];

function isActiveRoute(currentPath: string, target: string): boolean {
  if (target === "/") return currentPath === "/";
  return currentPath === target || currentPath.startsWith(`${target}/`);
}

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          {isMobile ? (
            <IconButton
              color="inherit"
              edge="start"
              aria-label="abrir menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          ) : null}

          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{
              color: "inherit",
              textDecoration: "none",
              flexGrow: isMobile ? 1 : 0,
              mr: isMobile ? 0 : 4,
            }}
          >
            OdontoArte
          </Typography>

          {!isMobile ? (
            <Box sx={{ display: "flex", gap: 1, flexGrow: 1 }}>
              {NAV_ITEMS.map((item) => {
                const active = isActiveRoute(location.pathname, item.to);
                return (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    color="inherit"
                    sx={{
                      fontWeight: active ? 700 : 400,
                      borderBottom: active
                        ? "2px solid currentColor"
                        : "2px solid transparent",
                      borderRadius: 0,
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          ) : null}

          {!isMobile ? (
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Sair
            </Button>
          ) : (
            <IconButton
              color="inherit"
              aria-label="sair"
              onClick={handleLogout}
            >
              <LogoutIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 240 }} role="navigation">
          <List>
            {NAV_ITEMS.map((item) => {
              const active = isActiveRoute(location.pathname, item.to);
              return (
                <ListItem key={item.to} disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to={item.to}
                    selected={active}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemText primary="Sair" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Container component="main" sx={{ flexGrow: 1, py: { xs: 2, sm: 4 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
