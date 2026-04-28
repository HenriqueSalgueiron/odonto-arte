import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod/v4";
import {
  usePostServices,
  usePutServicesId,
  getServicesQueryKey,
} from "@/generated";
import type { GetServices200 } from "@/generated";
import { parseBRLInput } from "@/lib/formatters/currency";
import { useNotification } from "@/components/NotificationProvider";

type Service = GetServices200["items"][number];

type ServiceFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Service;
  onClose: () => void;
};

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(120, "Máximo 120 caracteres"),
  description: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
  priceInput: z.string().refine(
    (v) => {
      const n = parseBRLInput(v);
      return n !== null && n >= 0;
    },
    { message: "Preço inválido" },
  ),
  active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

function defaultsFor(initial: Service | undefined): FormValues {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    priceInput:
      initial !== undefined
        ? initial.price.toFixed(2).replace(".", ",")
        : "",
    active: initial?.active ?? true,
  };
}

export function ServiceFormDialog({
  open,
  mode,
  initial,
  onClose,
}: ServiceFormDialogProps) {
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFor(initial),
  });

  useEffect(() => {
    if (open) reset(defaultsFor(initial));
  }, [open, initial, reset]);

  const createMutation = usePostServices();
  const updateMutation = usePutServicesId();

  const onSubmit = handleSubmit(async (values) => {
    const price = parseBRLInput(values.priceInput) ?? 0;
    const description =
      values.description && values.description.length > 0
        ? values.description
        : null;

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          data: { name: values.name, description, price },
        });
        notify({ severity: "success", message: "Serviço criado" });
      } else if (initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          data: {
            name: values.name,
            description,
            price,
            active: values.active,
          },
        });
        notify({ severity: "success", message: "Serviço atualizado" });
      }
      await queryClient.invalidateQueries({ queryKey: getServicesQueryKey() });
      onClose();
    } catch {
      notify({ severity: "error", message: "Erro ao salvar serviço" });
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>
          {mode === "create" ? "Novo serviço" : "Editar serviço"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome"
              autoFocus
              fullWidth
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register("name")}
            />
            <TextField
              label="Descrição"
              multiline
              minRows={2}
              fullWidth
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              {...register("description")}
            />
            <TextField
              label="Preço"
              fullWidth
              inputMode="decimal"
              error={Boolean(errors.priceInput)}
              helperText={
                errors.priceInput?.message ??
                "Use vírgula para centavos (ex: 250,00)"
              }
              {...register("priceInput")}
            />
            {mode === "edit" ? (
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(_, checked) => field.onChange(checked)}
                      />
                    }
                    label="Ativo"
                  />
                )}
              />
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
