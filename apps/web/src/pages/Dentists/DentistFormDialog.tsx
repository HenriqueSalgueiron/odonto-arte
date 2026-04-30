import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod/v4";
import {
  usePostDentists,
  usePutDentistsId,
  getDentistsQueryKey,
} from "@/generated";
import type { GetDentists200 } from "@/generated";
import { maskBRPhone, unmaskPhone } from "@/lib/formatters/phone";
import { useNotification } from "@/components/NotificationProvider";
import {
  RHFPhoneField,
  RHFSwitch,
  RHFTextField,
} from "@/components/form";

type Dentist = GetDentists200["items"][number];

type DentistFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Dentist;
  onClose: () => void;
};

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(120, "Máximo 120 caracteres"),
  cro: z.string().trim().max(20, "Máximo 20 caracteres").optional(),
  phone: z.string().trim().max(20, "Telefone inválido").optional(),
  email: z
    .string()
    .trim()
    .max(254, "Máximo 254 caracteres")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Email inválido",
    })
    .optional(),
  notes: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function defaultsFor(initial: Dentist | undefined): FormValues {
  return {
    name: initial?.name ?? "",
    cro: initial?.cro ?? "",
    phone: initial?.phone ? maskBRPhone(initial.phone) : "",
    email: initial?.email ?? "",
    notes: initial?.notes ?? "",
    active: initial?.active ?? true,
  };
}

function emptyToNull(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function DentistFormDialog({
  open,
  mode,
  initial,
  onClose,
}: DentistFormDialogProps) {
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFor(initial),
  });

  useEffect(() => {
    if (open) reset(defaultsFor(initial));
  }, [open, initial, reset]);

  const createMutation = usePostDentists();
  const updateMutation = usePutDentistsId();

  const onSubmit = handleSubmit(async (values) => {
    const phoneDigits = values.phone ? unmaskPhone(values.phone) : "";
    const payload = {
      name: values.name,
      cro: emptyToNull(values.cro),
      phone: phoneDigits.length > 0 ? phoneDigits : null,
      email: emptyToNull(values.email),
      notes: emptyToNull(values.notes),
    };

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({ data: payload });
        notify({ severity: "success", message: "Dentista criado" });
      } else if (initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          data: { ...payload, active: values.active },
        });
        notify({ severity: "success", message: "Dentista atualizado" });
      }
      await queryClient.invalidateQueries({ queryKey: getDentistsQueryKey() });
      onClose();
    } catch {
      notify({ severity: "error", message: "Erro ao salvar dentista" });
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>
          {mode === "create" ? "Novo dentista" : "Editar dentista"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <RHFTextField
              control={control}
              name="name"
              label="Nome"
              autoFocus
              fullWidth
            />
            <RHFTextField control={control} name="cro" label="CRO" fullWidth />
            <RHFPhoneField
              control={control}
              name="phone"
              label="Telefone"
              fullWidth
            />
            <RHFTextField
              control={control}
              name="email"
              label="Email"
              type="email"
              fullWidth
            />
            <RHFTextField
              control={control}
              name="notes"
              label="Observações"
              multiline
              minRows={2}
              fullWidth
            />
            {mode === "edit" ? (
              <RHFSwitch control={control} name="active" label="Ativo" />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {mode === "create" ? "Criar" : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
