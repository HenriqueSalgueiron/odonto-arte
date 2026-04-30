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
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod/v4";
import {
  getDentistsDentistidPricesQueryKey,
  usePutDentistsDentistidPricesServiceid,
} from "@/generated";
import { formatBRL, maskBRL, parseBRLInput } from "@/lib/formatters/currency";
import { RHFCurrencyField } from "@/components/form";
import { useNotification } from "@/components/NotificationProvider";

type DentistPriceFormDialogProps = {
  open: boolean;
  dentistId: string;
  serviceId: string;
  serviceName: string;
  tablePrice: number;
  initialSpecificPrice: number | null;
  onClose: () => void;
};

const formSchema = z.object({
  price: z
    .string()
    .trim()
    .min(1, "Informe um preço")
    .refine((v) => {
      const n = parseBRLInput(v);
      return n !== null && n >= 0;
    }, "Preço inválido"),
});

type FormValues = z.infer<typeof formSchema>;

function defaultsFor(initialSpecificPrice: number | null): FormValues {
  return {
    price: initialSpecificPrice !== null ? maskBRL(String(Math.round(initialSpecificPrice * 100))) : "",
  };
}

export function DentistPriceFormDialog({
  open,
  dentistId,
  serviceId,
  serviceName,
  tablePrice,
  initialSpecificPrice,
  onClose,
}: DentistPriceFormDialogProps) {
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFor(initialSpecificPrice),
  });

  useEffect(() => {
    if (open) reset(defaultsFor(initialSpecificPrice));
  }, [open, initialSpecificPrice, reset]);

  const setMutation = usePutDentistsDentistidPricesServiceid();

  const onSubmit = handleSubmit(async (values) => {
    const price = parseBRLInput(values.price);
    if (price === null) return;
    try {
      await setMutation.mutateAsync({
        dentistId,
        serviceId,
        data: { price },
      });
      await queryClient.invalidateQueries({
        queryKey: getDentistsDentistidPricesQueryKey(dentistId),
      });
      notify({ severity: "success", message: "Preço específico salvo" });
      onClose();
    } catch {
      notify({ severity: "error", message: "Erro ao salvar preço" });
    }
  });

  const mode = initialSpecificPrice === null ? "create" : "edit";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>
          {mode === "create" ? "Definir preço específico" : "Editar preço específico"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Serviço
              </Typography>
              <Typography variant="body1">{serviceName}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Preço-tabela
              </Typography>
              <Typography variant="body1">{formatBRL(tablePrice)}</Typography>
            </Stack>
            <RHFCurrencyField
              control={control}
              name="price"
              label="Novo preço"
              autoFocus
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
