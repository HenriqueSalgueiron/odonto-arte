import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router";
import {
  useGetCategories,
  useGetDentistsDentistidPrices,
  useGetServices,
  usePutExportTemplate,
  getExportTemplateQueryKey,
} from "@/generated";
import { useQueryClient } from "@tanstack/react-query";
import { useLabInfo } from "@/hooks/useLabInfo";
import { useExportTemplate } from "@/hooks/useExportTemplate";
import { useNotification } from "@/components/NotificationProvider";
import { CategoryOrderList } from "@/components/ExportPdfDialog/CategoryOrderList";
import { ObservationsList } from "@/components/ExportPdfDialog/ObservationsList";
import { buildSectionsByCategory } from "@/lib/pdf/buildSections";
import { pdfFilename } from "@/lib/pdf/filename";
import { downloadPdf } from "@/lib/pdf/downloadPdf";
import { PriceListDocument } from "@/lib/pdf/PriceListDocument";
import type { ServiceForExport } from "@/lib/pdf/types";

type Props = {
  open: boolean;
  onClose: () => void;
  dentistId?: string;
};

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return items.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function reconcileOrder(
  savedOrder: string[],
  categories: { id: string; name: string }[],
): string[] {
  const validIds = new Set(categories.map((c) => c.id));
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const id of savedOrder) {
    if (validIds.has(id) && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  const remaining = sortByName(categories.filter((c) => !seen.has(c.id))).map(
    (c) => c.id,
  );
  return [...ordered, ...remaining];
}

export function ExportPdfDialog({ open, onClose, dentistId }: Props) {
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const labInfoQuery = useLabInfo();
  const templateQuery = useExportTemplate();
  const categoriesQuery = useGetCategories();
  const servicesQuery = useGetServices();
  const pricesQuery = useGetDentistsDentistidPrices(dentistId ?? "", {
    query: { enabled: Boolean(dentistId) },
  });
  const putTemplate = usePutExportTemplate();

  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [localObservations, setLocalObservations] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const categories = categoriesQuery.data?.items ?? [];
  const services = servicesQuery.data?.items ?? [];
  const labInfo = labInfoQuery.data;
  const template = templateQuery.data;

  useEffect(() => {
    if (!open || !template || !categoriesQuery.data) return;
    setLocalOrder(reconcileOrder(template.categoryOrder, categories));
    setLocalObservations(template.observations.slice());
  }, [open, template, categoriesQuery.data, categories]);

  const orderedItems = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    return localOrder.flatMap((id) => {
      const cat = byId.get(id);
      return cat ? [cat] : [];
    });
  }, [localOrder, categories]);

  const isLoading =
    labInfoQuery.isLoading ||
    templateQuery.isLoading ||
    categoriesQuery.isLoading ||
    servicesQuery.isLoading ||
    (dentistId ? pricesQuery.isLoading : false);

  async function handleExport() {
    if (!labInfo || !template || !categoriesQuery.data || !servicesQuery.data) {
      return;
    }
    if (dentistId && !pricesQuery.data) return;

    const cleanObservations = localObservations
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    const validIds = new Set(categories.map((c) => c.id));
    const cleanOrder = localOrder.filter((id) => validIds.has(id));

    const savedSnapshot = JSON.stringify({
      categoryOrder: template.categoryOrder,
      observations: template.observations,
    });
    const localSnapshot = JSON.stringify({
      categoryOrder: cleanOrder,
      observations: cleanObservations,
    });

    setIsExporting(true);
    try {
      if (savedSnapshot !== localSnapshot) {
        await putTemplate.mutateAsync({
          data: {
            categoryOrder: cleanOrder,
            observations: cleanObservations,
          },
        });
        await queryClient.invalidateQueries({
          queryKey: getExportTemplateQueryKey(),
        });
      }

      const priceMap = new Map<string, number>(
        (pricesQuery.data?.items ?? []).map((p) => [p.serviceId, p.effectivePrice]),
      );
      const resolved: ServiceForExport[] = services.map((s) => ({
        id: s.id,
        name: s.name,
        categoryId: s.category?.id ?? null,
        price: dentistId ? (priceMap.get(s.id) ?? s.price) : s.price,
      }));

      const sections = buildSectionsByCategory(resolved, categories, cleanOrder);

      const doc = (
        <PriceListDocument
          labInfo={labInfo}
          sections={sections}
          observations={cleanObservations}
        />
      );
      await downloadPdf(doc, pdfFilename(new Date()));
      onClose();
    } catch (error) {
      console.error("ExportPdfDialog: falha ao gerar PDF", error);
      notify({ severity: "error", message: "Erro ao gerar o PDF" });
    } finally {
      setIsExporting(false);
    }
  }

  const isConfigured = labInfoQuery.isConfigured;

  return (
    <Dialog
      open={open}
      onClose={isExporting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Exportar PDF</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : !isConfigured ? (
          <Alert severity="warning">
            Configure as informações do laboratório antes de exportar.
            <Box mt={1}>
              <Button
                component={RouterLink}
                to="/settings"
                onClick={onClose}
                size="small"
                variant="outlined"
              >
                Ir para configurações
              </Button>
            </Box>
          </Alert>
        ) : (
          <Stack spacing={3}>
            {dentistId ? (
              <Alert severity="info">
                Este PDF é visualmente idêntico à tabela geral. Os preços
                exibidos são os efetivos deste dentista — se ele não tem preços
                personalizados, o resultado será igual ao da exportação geral.
              </Alert>
            ) : null}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Ordem das categorias
              </Typography>
              <CategoryOrderList
                items={orderedItems}
                onChange={setLocalOrder}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Observações
              </Typography>
              <ObservationsList
                items={localObservations}
                onChange={setLocalObservations}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancelar
        </Button>
        {isConfigured ? (
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={isLoading || isExporting}
          >
            {isExporting ? "Gerando..." : "Exportar"}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
