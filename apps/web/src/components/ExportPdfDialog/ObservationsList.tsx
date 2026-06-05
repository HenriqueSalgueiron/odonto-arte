import { Button, IconButton, Stack, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  items: string[];
  onChange: (next: string[]) => void;
};

export function ObservationsList({ items, onChange }: Props) {
  function setItem(index: number, value: string) {
    const next = items.slice();
    next[index] = value;
    onChange(next);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, ""]);
  }

  return (
    <Stack spacing={1}>
      {items.map((text, i) => (
        <Stack direction="row" spacing={1} key={i} alignItems="center">
          <TextField
            value={text}
            onChange={(e) => setItem(i, e.target.value)}
            size="small"
            fullWidth
            inputProps={{ "aria-label": `Observação ${i + 1}` }}
          />
          <IconButton
            aria-label={`Remover observação ${i + 1}`}
            onClick={() => removeItem(i)}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      <Button
        startIcon={<AddIcon />}
        onClick={addItem}
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        Adicionar observação
      </Button>
    </Stack>
  );
}
