import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router";
import { postAuthLoginMutationRequestSchema } from "@/generated";
import type { PostAuthLoginMutationRequest } from "@/generated";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod/v4";

type LoginForm = PostAuthLoginMutationRequest;

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, loginError, isLoggingIn } = useAuth();

  const loginSchema = postAuthLoginMutationRequestSchema.extend({
    email: z.email("Email inválido").min(1, "Email é obrigatório"),
    password: z.string().min(1, "Senha é obrigatória"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (loginError) {
      setError("root", { message: "Email ou senha inválidos" });
    } else {
      clearErrors("root");
    }
  }, [loginError, setError, clearErrors]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login(data);
      navigate("/", { replace: true });
    } catch {
      // erro tratado pelo loginError do hook
    }
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
          component="form"
          onSubmit={onSubmit}
          noValidate
        >
          <Typography variant="h5" component="h1" align="center">
            OdontoArte
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Entre com seu email e senha
          </Typography>

          {errors.root?.message ? (
            <Alert severity="error">{errors.root.message}</Alert>
          ) : null}

          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register("email")}
          />

          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            {...register("password")}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Entrando..." : "Entrar"}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;
