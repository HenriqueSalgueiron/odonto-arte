import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControlLabel,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteServicesId,
  useGetServices,
  getServicesQueryKey,
} from "@/generated";
import type { GetServices200 } from "@/generated";
import { formatBRL } from "@/lib/formatters/currency";
import { useNotification } from "@/components/NotificationProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ServiceFormDialog } from "@/pages/Services/ServiceFormDialog";

type Service = GetServices200["items"][number];

export function ServicesListPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | undefined>(undefined);
  const [confirming, setConfirming] = useState<Service | null>(null);

  const { notify } = useNotification();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useGetServices(
    showInactive ? { includeInactive: "true" } : undefined,
  );

  const deleteMutation = useDeleteServicesId({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getServicesQueryKey() });
        notify({ severity: "success", message: "Serviço desativado" });
        setConfirming(null);
      },
      onError: () => {
        notify({ severity: "error", message: "Erro ao desativar serviço" });
      },
    },
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => s.name.toLowerCase().includes(q));
  }, [items, query]);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (service: Service) => {
    setEditing(service);
    setFormOpen(true);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" component="h1">
          Serviços
        </Typography>
        <Button variant="contained" onClick={openCreate}>
          Novo serviço
        </Button>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        sx={{ mb: 2 }}
      >
        <TextField
          label="Buscar por nome"
          size="small"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <FormControlLabel
          control={
            <Switch
              checked={showInactive}
              onChange={(_, checked) => setShowInactive(checked)}
            />
          }
          label="Mostrar inativos"
        />
      </Stack>

      {isError ? (
        <Alert severity="error">Erro ao carregar serviços.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  Descrição
                </TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  Categoria
                </TableCell>
                <TableCell>Preço</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                        <Skeleton />
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ))
                : null}

              {!isLoading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <Typography color="text.secondary">
                        {query
                          ? `Nenhum resultado para «${query}»`
                          : "Nenhum serviço cadastrado"}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}

              {filtered.map((service) => (
                <TableRow
                  key={service.id}
                  sx={service.active ? undefined : { opacity: 0.6 }}
                >
                  <TableCell>{service.name}</TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    {service.description ?? "—"}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    {service.category ? (
                      <Chip
                        label={service.category.name}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatBRL(service.price)}</TableCell>
                  <TableCell>
                    {service.active ? (
                      <Chip label="Ativo" size="small" color="success" />
                    ) : (
                      <Chip label="Inativo" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={`Editar ${service.name}`}
                      onClick={() => openEdit(service)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label={`Excluir ${service.name}`}
                      onClick={() => setConfirming(service)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ServiceFormDialog
        open={formOpen}
        mode={editing ? "edit" : "create"}
        initial={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={confirming !== null}
        title="Desativar serviço"
        message="Esta ação desativa o serviço. Você pode reativá-lo depois."
        confirmLabel="Desativar"
        confirmColor="error"
        loading={deleteMutation.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) {
            deleteMutation.mutate({ id: confirming.id });
          }
        }}
      />
    </Container>
  );
}

export default ServicesListPage;
