import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { DIVERSOS_NAME } from "@/lib/pdf/theme";

type CategoryItem = { id: string; name: string };

type Props = {
  items: CategoryItem[];
  onChange: (next: string[]) => void;
};

function SortableRow({ id, name }: CategoryItem) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        mb: 0.5,
        bgcolor: "background.paper",
      }}
      {...attributes}
      {...listeners}
    >
      <ListItemIcon sx={{ minWidth: 36, cursor: "grab" }}>
        <DragIndicatorIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={name} />
    </ListItem>
  );
}

export function CategoryOrderList({ items, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map((c) => c.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <List dense disablePadding>
          {items.map((c) => (
            <SortableRow key={c.id} id={c.id} name={c.name} />
          ))}
        </List>
      </SortableContext>
      <ListItem
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          mt: 0.5,
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          <LockOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={DIVERSOS_NAME}
          secondary={
            <Typography variant="caption" color="text.secondary">
              Sempre no final
            </Typography>
          }
        />
      </ListItem>
    </DndContext>
  );
}
