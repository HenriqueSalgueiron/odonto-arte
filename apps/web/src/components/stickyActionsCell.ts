import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Estilo pra coluna de ações ficar "fixa" no canto direito quando a tabela
 * ganha scroll horizontal. Aplica em <TableCell> do <TableHead> e do
 * <TableBody>.
 *
 * A sombra na borda esquerda só aparece quando o TableContainer pai tem o
 * atributo `data-actions-overflow="true"`, que é setado pelo
 * <StickyActionsTableContainer> quando detecta conteúdo escondido à direita.
 * Assim:
 *   - Tabela inteira cabe → sem sombra (não tem conteúdo escondido).
 *   - Tabela com overflow + scroll no início → sombra (tem coisa pra direita).
 *   - Scroll até o fim → sem sombra (nada mais escondido).
 */
export const stickyActionsCell: SxProps<Theme> = {
  position: "sticky",
  right: 0,
  backgroundColor: "background.paper",
  zIndex: 1,
  transition: "box-shadow 120ms ease-out",
  '[data-actions-overflow="true"] &': {
    // Sombra forte o suficiente pra comunicar "tem conteúdo escondido" mesmo
    // por cima do background branco das células atrás. Negativos: vai escuro
    // primeiro (-12 offset), depois desfaz com blur grande e spread neg.
    boxShadow: "-12px 0 16px -6px rgba(0,0,0,0.35)",
  },
};
