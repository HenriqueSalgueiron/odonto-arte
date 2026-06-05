import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { z } from "zod/v4";
import {
  getLabInfoQueryKey,
  usePutLabInfo,
  type GetLabInfoQueryResponse,
} from "@/generated";
import { useLabInfo } from "@/hooks/useLabInfo";
import { useNotification } from "@/components/NotificationProvider";
import { RHFPhoneField, RHFTextField } from "@/components/form";
import { maskBRPhone, unmaskPhone } from "@/lib/formatters/phone";

const formSchema = z.object({
  responsibleTechnician: z
    .string()
    .trim()
    .min(1, "Campo obrigatório")
    .max(120, "Máximo 120 caracteres"),
  responsibleTechnicianCro: z
    .string()
    .trim()
    .min(1, "Campo obrigatório")
    .max(40, "Máximo 40 caracteres"),
  phone: z
    .string()
    .trim()
    .min(1, "Campo obrigatório")
    .refine((v) => unmaskPhone(v).length >= 10, {
      message: "Telefone inválido",
    }),
  email: z
    .string()
    .trim()
    .min(1, "Campo obrigatório")
    .max(254, "Máximo 254 caracteres")
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Email inválido",
    }),
});

type FormValues = z.infer<typeof formSchema>;

function defaultsFor(data: GetLabInfoQueryResponse | undefined): FormValues {
  return {
    responsibleTechnician: data?.responsibleTechnician ?? "",
    responsibleTechnicianCro: data?.responsibleTechnicianCro ?? "",
    phone: data?.phone ? maskBRPhone(data.phone) : "",
    email: data?.email ?? "",
  };
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotification();
  const { data, isLoading } = useLabInfo();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFor(data),
  });

  useEffect(() => {
    if (data) reset(defaultsFor(data));
  }, [data, reset]);

  const updateMutation = usePutLabInfo();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        data: {
          responsibleTechnician: values.responsibleTechnician.trim(),
          responsibleTechnicianCro: values.responsibleTechnicianCro.trim(),
          phone: unmaskPhone(values.phone),
          email: values.email.trim(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getLabInfoQueryKey() });
      notify({ severity: "success", message: "Configurações salvas" });
    } catch {
      notify({ severity: "error", message: "Erro ao salvar configurações" });
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 560 }}>
      <Typography variant="h4" component="h1">
        Configurações do laboratório
      </Typography>

      <form onSubmit={onSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Nome do laboratório"
            value={data?.name ?? "OdontoArte"}
            disabled
            fullWidth
            helperText="O nome não é editável"
          />
          <RHFTextField
            required
            control={control}
            name="responsibleTechnician"
            label="Técnico responsável"
            fullWidth
          />
          <RHFTextField
            required
            control={control}
            name="responsibleTechnicianCro"
            label="CRO do técnico"
            fullWidth
          />
          <RHFPhoneField
            required
            control={control}
            name="phone"
            label="Telefone"
            fullWidth
          />
          <RHFTextField
            required
            control={control}
            name="email"
            label="Email"
            type="email"
            fullWidth
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !isDirty}
            >
              Salvar
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
}

export default SettingsPage;
