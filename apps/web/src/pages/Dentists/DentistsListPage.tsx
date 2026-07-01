import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControlLabel,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { stickyActionsCell } from "@/components/stickyActionsCell";
import { StickyActionsTableContainer } from "@/components/StickyActionsTableContainer";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteDentistsId,
  useGetDentists,
  getDentistsQueryKey,
} from "@/generated";
import type { GetDentists200 } from "@/generated";
import { maskBRPhone } from "@/lib/formatters/phone";
import { useNotification } from "@/components/NotificationProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DentistFormDialog } from "@/pages/Dentists/DentistFormDialog";

type Dentist = GetDentists200["items"][number];

export function DentistsListPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Dentist | undefined>(undefined);
  const [confirming, setConfirming] = useState<Dentist | null>(null);

  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useGetDentists(
    showInactive ? { includeInactive: "true" } : undefined,
  );

  const deleteMutation = useDeleteDentistsId({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getDentistsQueryKey() });
        notify({ severity: "success", message: "Dentista desativado" });
        setConfirming(null);
      },
      onError: () => {
        notify({ severity: "error", message: "Erro ao desativar dentista" });
      },
    },
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => d.name.toLowerCase().includes(q));
  }, [items, query]);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (dentist: Dentist) => {
    setEditing(dentist);
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
          Dentistas
        </Typography>
        <Button variant="contained" onClick={openCreate}>
          Novo dentista
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
        <Alert severity="error">Erro ao carregar dentistas.</Alert>
      ) : (
        <StickyActionsTableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  CRO
                </TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  Email
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" sx={stickyActionsCell}>
                  Ações
                </TableCell>
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
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                        <Skeleton />
                      </TableCell>
                      <TableCell>
                        <Skeleton />
                      </TableCell>
                      <TableCell sx={stickyActionsCell}>
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
                          : "Nenhum dentista cadastrado"}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}

              {filtered.map((dentist) => (
                <TableRow
                  key={dentist.id}
                  sx={dentist.active ? undefined : { opacity: 0.6 }}
                >
                  <TableCell>{dentist.name}</TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    {dentist.cro ?? "—"}
                  </TableCell>
                  <TableCell>
                    {dentist.phone ? maskBRPhone(dentist.phone) : "—"}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    {dentist.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    {dentist.active ? (
                      <Chip label="Ativo" size="small" color="success" />
                    ) : (
                      <Chip label="Inativo" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={stickyActionsCell}>
                    <RowActionsMenu
                      ariaLabel={`Mais ações para ${dentist.name}`}
                      items={[
                        ...(dentist.active
                          ? [
                              {
                                label: "Preços",
                                icon: <AttachMoneyIcon fontSize="small" />,
                                onClick: () =>
                                  navigate(`/dentists/${dentist.id}/prices`),
                              },
                            ]
                          : []),
                        {
                          label: "Editar",
                          icon: <EditIcon fontSize="small" />,
                          onClick: () => openEdit(dentist),
                        },
                        {
                          label: "Desativar",
                          icon: <DeleteIcon fontSize="small" />,
                          onClick: () => setConfirming(dentist),
                          color: "error",
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StickyActionsTableContainer>
      )}

      <DentistFormDialog
        open={formOpen}
        mode={editing ? "edit" : "create"}
        initial={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={confirming !== null}
        title="Desativar dentista"
        message="Esta ação desativa o dentista. Você pode reativá-lo depois."
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

export default DentistsListPage;
