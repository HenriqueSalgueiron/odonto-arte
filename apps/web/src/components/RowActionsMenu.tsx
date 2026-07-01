import { useState, type ReactNode, type MouseEvent } from "react";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export type RowActionItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  color?: "inherit" | "primary" | "error" | "warning" | "info" | "success";
  divider?: boolean;
};

type RowActionsMenuProps = {
  /** Texto pro aria-label do botão dos 3 pontinhos. Ex: "Mais ações para João" */
  ariaLabel: string;
  items: RowActionItem[];
};

/**
 * Botão de "mais ações" (⋮) que abre um menu com a lista de ações. Substitui
 * múltiplos IconButtons inline numa coluna de tabela quando o espaço é
 * apertado (ex: mobile).
 */
export function RowActionsMenu({ ariaLabel, items }: RowActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item: RowActionItem) => {
    handleClose();
    item.onClick();
  };

  return (
    <>
      <IconButton
        aria-label={ariaLabel}
        aria-controls={open ? "row-actions-menu" : undefined}
        aria-haspopup="menu"
        aria-expanded={open || undefined}
        onClick={handleOpen}
        size="small"
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="row-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => handleItemClick(item)}
            divider={item.divider}
            sx={item.color ? { color: `${item.color}.main` } : undefined}
          >
            {item.icon ? (
              <ListItemIcon
                sx={item.color ? { color: `${item.color}.main` } : undefined}
              >
                {item.icon}
              </ListItemIcon>
            ) : null}
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
