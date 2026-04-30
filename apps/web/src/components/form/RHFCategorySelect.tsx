import { useMemo, useRef, useState } from "react";
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
  useDeleteCategoriesId,
  useGetCategories,
  usePostCategories,
  usePutCategoriesId,
} from "@/generated";
import type { GetCategories200 } from "@/generated";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useNotification } from "@/components/NotificationProvider";

type Category = GetCategories200["items"][number];

type RHFCategorySelectProps<T extends FieldValues> = {
  name: FieldPath<T>;
  control: Control<T>;
  label?: string;
  fullWidth?: boolean;
  disabled?: boolean;
};

const RESERVED_NAME = "diversos";
const NAME_MAX = 80;

function validateName(name: string, others: Category[]): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Nome obrigatório";
  if (trimmed.length > NAME_MAX) return `Máximo ${NAME_MAX} caracteres`;
  if (trimmed.toLowerCase() === RESERVED_NAME) {
    return 'Nome reservado para o grupo virtual "Diversos"';
  }
  if (others.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return "Já existe uma categoria com esse nome";
  }
  return null;
}

export function RHFCategorySelect<T extends FieldValues>({
  name,
  control,
  label = "Categoria",
  fullWidth,
  disabled,
}: RHFCategorySelectProps<T>) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Category | null>(
    null,
  );

  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const { data, isLoading } = useGetCategories();
  const categories = useMemo<Category[]>(() => data?.items ?? [], [data]);

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getCategoriesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getServicesQueryKey() }),
    ]);
  };

  const createMutation = usePostCategories();
  const updateMutation = usePutCategoriesId();
  const deleteMutation = useDeleteCategoriesId();

  const closeAllInlineModes = () => {
    setEditingId(null);
    setEditingName("");
    setEditingError(null);
    setCreating(false);
    setNewName("");
    setNewError(null);
  };

  const handleClose = () => {
    setOpen(false);
    closeAllInlineModes();
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingError(null);
    setCreating(false);
  };

  const submitEdit = async (category: Category) => {
    const error = validateName(
      editingName,
      categories.filter((c) => c.id !== category.id),
    );
    if (error) {
      setEditingError(error);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        data: { name: editingName.trim() },
      });
      await invalidateAll();
      notify({ severity: "success", message: "Categoria atualizada" });
      setEditingId(null);
      setEditingName("");
      setEditingError(null);
    } catch {
      setEditingError("Erro ao salvar categoria");
    }
  };

  const startCreate = () => {
    setCreating(true);
    setNewName("");
    setNewError(null);
    setEditingId(null);
  };

  const submitCreate = async (
    onSelectCreated: (id: string) => void,
  ) => {
    const error = validateName(newName, categories);
    if (error) {
      setNewError(error);
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        data: { name: newName.trim() },
      });
      await invalidateAll();
      notify({ severity: "success", message: "Categoria criada" });
      setCreating(false);
      setNewName("");
      setNewError(null);
      onSelectCreated(created.id);
    } catch {
      setNewError("Erro ao criar categoria");
    }
  };

  const submitDelete = async () => {
    if (!confirmingDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: confirmingDelete.id });
      await invalidateAll();
      notify({ severity: "success", message: "Categoria removida" });
      setConfirmingDelete(null);
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
        const displayLabel = selected
          ? selected.name
          : isLoading
            ? "Carregando..."
            : "Sem categoria";

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
                editingId === cat.id ? (
                  <Box
                    key={cat.id}
                    sx={{ px: 2, py: 1 }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        autoFocus
                        fullWidth
                        value={editingName}
                        onChange={(e) => {
                          setEditingName(e.target.value);
                          setEditingError(null);
                        }}
                        error={Boolean(editingError)}
                        helperText={editingError ?? undefined}
                        inputProps={{ "aria-label": "Renomear categoria" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void submitEdit(cat);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            closeAllInlineModes();
                          }
                        }}
                      />
                      <IconButton
                        size="small"
                        aria-label="Salvar nome"
                        onClick={(e) => {
                          e.stopPropagation();
                          void submitEdit(cat);
                        }}
                        disabled={updateMutation.isPending}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Cancelar"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeAllInlineModes();
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
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
                            startEdit(cat);
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

              {creating ? (
                <Box
                  sx={{ px: 2, py: 1 }}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      autoFocus
                      fullWidth
                      placeholder="Nome da categoria"
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        setNewError(null);
                      }}
                      error={Boolean(newError)}
                      helperText={newError ?? undefined}
                      inputProps={{ "aria-label": "Nova categoria" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void submitCreate((id) => selectId(id));
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          closeAllInlineModes();
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      aria-label="Criar categoria"
                      onClick={(e) => {
                        e.stopPropagation();
                        void submitCreate((id) => selectId(id));
                      }}
                      disabled={createMutation.isPending}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Cancelar criação"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeAllInlineModes();
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              ) : (
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    startCreate();
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
                confirmingDelete
                  ? confirmingDelete.serviceCount === 0
                    ? `Excluir a categoria "${confirmingDelete.name}"?`
                    : `A categoria "${confirmingDelete.name}" está em ${confirmingDelete.serviceCount} ${
                        confirmingDelete.serviceCount === 1
                          ? "serviço"
                          : "serviços"
                      }. ${
                        confirmingDelete.serviceCount === 1
                          ? "Ele ficará sem categoria."
                          : "Eles ficarão sem categoria."
                      } Continuar?`
                  : ""
              }
              confirmLabel="Excluir"
              confirmColor="error"
              loading={deleteMutation.isPending}
              onClose={() => setConfirmingDelete(null)}
              onConfirm={submitDelete}
            />
          </Box>
        );
      }}
    />
  );
}
