import { useCallback, useEffect, useRef, useState } from "react";
import { TableContainer, type TableContainerProps } from "@mui/material";

type Props = TableContainerProps;

/**
 * Wrapper em volta de <TableContainer> que detecta overflow horizontal e seta
 * o atributo `data-actions-overflow="true"` quando há conteúdo escondido à
 * direita. O <stickyActionsCell> usa esse atributo pra mostrar/esconder a
 * sombra da coluna sticky de ações.
 *
 * "Tem conteúdo escondido à direita" significa:
 *   scrollLeft + clientWidth < scrollWidth  (com tolerância pra arredondamento)
 *
 * Escuta scroll do próprio elemento + resize (ResizeObserver) pra recalcular
 * quando a viewport muda de tamanho (rotação de tela, redimensionamento, etc).
 */
export function StickyActionsTableContainer(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Tolerância de 1px pra evitar oscilação em rounding sub-pixel.
    setHasOverflow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  return (
    <TableContainer
      ref={ref}
      data-actions-overflow={hasOverflow ? "true" : undefined}
      {...props}
    />
  );
}
