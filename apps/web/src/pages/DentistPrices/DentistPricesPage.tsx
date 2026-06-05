import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Link,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useQueryClient } from "@tanstack/react-query";
import {
  getDentistsDentistidPricesQueryKey,
  useDeleteDentistsDentistidPricesServiceid,
  useGetDentistsDentistidPrices,
  useGetDentistsId,
} from "@/generated";
import type { GetDentistsDentistidPrices200 } from "@/generated";
import { formatBRL } from "@/lib/formatters/currency";
import { useNotification } from "@/components/NotificationProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DentistPriceFormDialog } from "@/pages/DentistPrices/DentistPriceFormDialog";
import { ExportPdfDialog } from "@/components/ExportPdfDialog/ExportPdfDialog";

type PriceRow = GetDentistsDentistidPrices200["items"][number];

export function DentistPricesPage() {
  const { id } = useParams<{ id: string }>();
  const dentistId = id ?? "";

  const [editing, setEditing] = useState<PriceRow | null>(null);
  const [confirming, setConfirming] = useState<PriceRow | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const { notify } = useNotification();
  const queryClient = useQueryClient();

  const dentistQuery = useGetDentistsId(dentistId);
  const pricesQuery = useGetDentistsDentistidPrices(dentistId);

  const removeMutation = useDeleteDentistsDentistidPricesServiceid({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getDentistsDentistidPricesQueryKey(dentistId),
        });
        notify({ severity: "success", message: "Preço específico removido" });
        setConfirming(null);
      },
      onError: () => {
        notify({ severity: "error", message: "Erro ao remover preço" });
      },
    },
  });

  const items = pricesQuery.data?.items ?? [];
  const isLoading = dentistQuery.isLoading || pricesQuery.isLoading;
  const isError = dentistQuery.isError || pricesQuery.isError;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/dentists"
          underline="hover"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            width: "fit-content",
          }}
        >
          <ArrowBackIcon fontSize="small" />
          Voltar para dentistas
        </Link>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" component="h1">
              Preços por dentista
            </Typography>
            {dentistQuery.data ? (
              <Typography variant="subtitle1" color="text.secondary">
                {dentistQuery.data.name}
              </Typography>
            ) : null}
          </Box>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => setExportOpen(true)}
          >
            Exportar PDF
          </Button>
        </Stack>
      </Stack>

      {isError ? (
        <Alert severity="error">Erro ao carregar preços do dentista.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Serviço</TableCell>
                <TableCell align="right">Preço-tabela</TableCell>
                <TableCell align="right">Preço específico</TableCell>
                <TableCell align="right">Preço efetivo</TableCell>
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
                      <TableCell>
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

              {!isLoading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <Typography color="text.secondary">
                        Nenhum serviço ativo cadastrado.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}

              {items.map((row) => {
                const hasOverride = row.specificPrice !== null;
                const setLabel = hasOverride
                  ? `Editar preço de ${row.serviceName}`
                  : `Definir preço de ${row.serviceName}`;
                return (
                  <TableRow key={row.serviceId}>
                    <TableCell>{row.serviceName}</TableCell>
                    <TableCell align="right">
                      {formatBRL(row.tablePrice)}
                    </TableCell>
                    <TableCell align="right">
                      {hasOverride
                        ? formatBRL(row.specificPrice as number)
                        : "—"}
                    </TableCell>
                    <TableCell align="right">
                      {formatBRL(row.effectivePrice)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={setLabel}
                        onClick={() => setEditing(row)}
                      >
                        <EditIcon />
                      </IconButton>
                      {hasOverride ? (
                        <IconButton
                          aria-label={`Remover preço específico de ${row.serviceName}`}
                          onClick={() => setConfirming(row)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button component={RouterLink} to="/dentists">
          Voltar
        </Button>
      </Stack>

      {editing ? (
        <DentistPriceFormDialog
          open={editing !== null}
          dentistId={dentistId}
          serviceId={editing.serviceId}
          serviceName={editing.serviceName}
          tablePrice={editing.tablePrice}
          initialSpecificPrice={editing.specificPrice}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <ExportPdfDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        dentistId={dentistId}
      />

      <ConfirmDialog
        open={confirming !== null}
        title="Remover preço específico"
        message="O dentista volta a usar o preço-tabela deste serviço."
        confirmLabel="Remover"
        confirmColor="error"
        loading={removeMutation.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) {
            removeMutation.mutate({
              dentistId,
              serviceId: confirming.serviceId,
            });
          }
        }}
      />
    </Container>
  );
}

export default DentistPricesPage;
