import { useReducer, useRef, useState } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  Box,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useQueryClient } from "@tanstack/react-query";
import {
  getCategoriesQueryKey,
  getServicesQueryKey,
  postCategoriesMutationRequestSchema,
  useDeleteCategoriesId,
  useGetCategories,
  usePostCategories,
  usePutCategoriesId,
} from "@/generated";
import type { GetCategories200 } from "@/generated";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useNotification } from "@/components/NotificationProvider";

type Category = GetCategories200["items"][number];

type CategorySelectFieldProps<T extends FieldValues> = {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  fullWidth?: boolean;
  disabled?: boolean;
};

const RESERVED_NAME_LOWER = "diversos";

type Mode =
  | { kind: "idle" }
  | { kind: "creating"; name: string; error: string | null }
  | { kind: "editing"; id: string; name: string; error: string | null };

type ModeAction =
  | { type: "reset" }
  | { type: "startCreate" }
  | { type: "startEdit"; category: Category }
  | { type: "setName"; name: string }
  | { type: "setError"; error: string };

function modeReducer(state: Mode, action: ModeAction): Mode {
  switch (action.type) {
    case "reset":
      return { kind: "idle" };
    case "startCreate":
      return { kind: "creating", name: "", error: null };
    case "startEdit":
      return {
        kind: "editing",
        id: action.category.id,
        name: action.category.name,
        error: null,
      };
    case "setName":
      if (state.kind === "idle") return state;
      return { ...state, name: action.name, error: null };
    case "setError":
      if (state.kind === "idle") return state;
      return { ...state, error: action.error };
  }
}

// Mín/máx do nome vêm da spec OpenAPI via Kubb. Se o backend mudar, regenerar
// atualiza essa validação automaticamente. O check de "Diversos" e o de
// duplicidade ficam locais — o primeiro é um `refine` do Zod que não sobrevive
// ao roundtrip OpenAPI; o segundo depende do estado runtime da lista.
function validateName(name: string, others: Category[]): string | null {
  const trimmed = name.trim();
  const parsed = postCategoriesMutationRequestSchema.safeParse({
    name: trimmed,
  });
  if (!parsed.success) {
    const code = parsed.error.issues[0]?.code;
    if (code === "too_small") return "Nome obrigatório";
    if (code === "too_big") return "Nome muito longo";
    return "Nome inválido";
  }
  if (trimmed.toLowerCase() === RESERVED_NAME_LOWER) {
    return 'Nome reservado para o grupo virtual "Diversos"';
  }
  if (others.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return "Já existe uma categoria com esse nome";
  }
  return null;
}

function buildDeleteMessage(category: Category): string {
  const { serviceCount: n, name } = category;
  if (n === 0) return `Excluir a categoria "${name}"?`;
  const noun = n === 1 ? "serviço" : "serviços";
  const pronoun = n === 1 ? "Ele ficará" : "Eles ficarão";
  return `A categoria "${name}" está em ${n} ${noun}. ${pronoun} sem categoria. Continuar?`;
}

type InlineNameInputProps = {
  value: string;
  error: string | null;
  pending: boolean;
  ariaLabel: string;
  submitLabel: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

function InlineNameInput({
  value,
  error,
  pending,
  ariaLabel,
  submitLabel,
  placeholder,
  onChange,
  onSubmit,
  onCancel,
}: InlineNameInputProps) {
  return (
    <Box sx={{ px: 2, py: 1 }} onKeyDown={(e) => e.stopPropagation()}>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          autoFocus
          fullWidth
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={Boolean(error)}
          helperText={error ?? undefined}
          inputProps={{ "aria-label": ariaLabel }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
        <IconButton
          size="small"
          aria-label={submitLabel}
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            onSubmit();
          }}
        >
          <CheckIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Cancelar"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}

export function CategorySelectField<T extends FieldValues>({
  name,
  control,
  label = "Categoria",
  fullWidth,
  disabled,
}: CategorySelectFieldProps<T>) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, dispatch] = useReducer(modeReducer, { kind: "idle" });
  const [confirmingDelete, setConfirmingDelete] = useState<Category | null>(
    null,
  );

  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const { data } = useGetCategories();
  const categories = data?.items ?? [];

  const createMutation = usePostCategories();
  const updateMutation = usePutCategoriesId();
  const deleteMutation = useDeleteCategoriesId();

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getServicesQueryKey() }),
    ]);

  const handleClose = () => {
    setOpen(false);
    dispatch({ type: "reset" });
  };

  const submitEdit = async () => {
    if (mode.kind !== "editing") return;
    const err = validateName(
      mode.name,
      categories.filter((c) => c.id !== mode.id),
    );
    if (err) {
      dispatch({ type: "setError", error: err });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: mode.id,
        data: { name: mode.name.trim() },
      });
      await invalidateAll();
      notify({ severity: "success", message: "Categoria atualizada" });
      dispatch({ type: "reset" });
    } catch {
      dispatch({ type: "setError", error: "Erro ao salvar categoria" });
    }
  };

  const submitCreate = async (onSelect: (id: string) => void) => {
    if (mode.kind !== "creating") return;
    const err = validateName(mode.name, categories);
    if (err) {
      dispatch({ type: "setError", error: err });
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        data: { name: mode.name.trim() },
      });
      await invalidateAll();
      notify({ severity: "success", message: "Categoria criada" });
      dispatch({ type: "reset" });
      onSelect(created.id);
    } catch {
      dispatch({ type: "setError", error: "Erro ao criar categoria" });
    }
  };

  const submitDelete = async (onClear: (deletedId: string) => void) => {
    if (!confirmingDelete) return;
    const deletedId = confirmingDelete.id;
    try {
      await deleteMutation.mutateAsync({ id: deletedId });
      await invalidateAll();
      notify({ severity: "success", message: "Categoria removida" });
      setConfirmingDelete(null);
      onClear(deletedId);
    } catch {
      notify({ severity: "error", message: "Erro ao remover categoria" });
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const value = (field.value ?? null) as string | null;
        const selected =
          value !== null ? categories.find((c) => c.id === value) : undefined;
        const displayLabel = selected?.name ?? "Sem categoria";

        const selectId = (id: string | null) => {
          field.onChange(id);
          handleClose();
        };

        return (
          <Box>
            <TextField
              ref={anchorRef}
              label={label}
              value={displayLabel}
              fullWidth={fullWidth}
              disabled={disabled}
              error={Boolean(error)}
              helperText={error?.message}
              onClick={() => {
                if (!disabled) setOpen(true);
              }}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: <ArrowDropDownIcon color="action" />,
                  inputProps: {
                    "aria-label": label,
                    "aria-haspopup": "listbox",
                  },
                },
              }}
              sx={{ "& input": { cursor: "pointer" } }}
              onBlur={field.onBlur}
            />

            <Menu
              anchorEl={anchorRef.current}
              open={open}
              onClose={handleClose}
              slotProps={{
                paper: {
                  sx: { width: anchorRef.current?.offsetWidth ?? "auto" },
                },
                list: { "aria-label": "Categorias" },
              }}
            >
              <MenuItem
                onClick={() => selectId(null)}
                selected={value === null}
              >
                <ListItemText
                  primary={
                    <Typography color="text.secondary">Sem categoria</Typography>
                  }
                />
              </MenuItem>

              {categories.length > 0 && <Divider />}

              {categories.map((cat) =>
                mode.kind === "editing" && mode.id === cat.id ? (
                  <InlineNameInput
                    key={cat.id}
                    value={mode.name}
                    error={mode.error}
                    pending={updateMutation.isPending}
                    ariaLabel="Renomear categoria"
                    submitLabel="Salvar nome"
                    onChange={(name) => dispatch({ type: "setName", name })}
                    onSubmit={() => void submitEdit()}
                    onCancel={() => dispatch({ type: "reset" })}
                  />
                ) : (
                  <MenuItem
                    key={cat.id}
                    selected={value === cat.id}
                    onClick={() => selectId(cat.id)}
                  >
                    <ListItemText primary={cat.name} sx={{ pr: 1 }} />
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Renomear">
                        <IconButton
                          size="small"
                          aria-label={`Renomear ${cat.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: "startEdit", category: cat });
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          aria-label={`Excluir ${cat.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmingDelete(cat);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </MenuItem>
                ),
              )}

              <Divider />

              {mode.kind === "creating" ? (
                <InlineNameInput
                  value={mode.name}
                  error={mode.error}
                  pending={createMutation.isPending}
                  ariaLabel="Nova categoria"
                  submitLabel="Criar categoria"
                  placeholder="Nome da categoria"
                  onChange={(name) => dispatch({ type: "setName", name })}
                  onSubmit={() => void submitCreate(selectId)}
                  onCancel={() => dispatch({ type: "reset" })}
                />
              ) : (
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "startCreate" });
                  }}
                >
                  <AddIcon fontSize="small" sx={{ mr: 1 }} />
                  <ListItemText primary="Nova categoria" />
                </MenuItem>
              )}
            </Menu>

            <ConfirmDialog
              open={confirmingDelete !== null}
              title="Excluir categoria"
              message={
                confirmingDelete ? buildDeleteMessage(confirmingDelete) : ""
              }
              confirmLabel="Excluir"
              confirmColor="error"
              loading={deleteMutation.isPending}
              onClose={() => setConfirmingDelete(null)}
              onConfirm={() =>
                void submitDelete((deletedId) => {
                  if (value === deletedId) field.onChange(null);
                })
              }
            />
          </Box>
        );
      }}
    />
  );
}
