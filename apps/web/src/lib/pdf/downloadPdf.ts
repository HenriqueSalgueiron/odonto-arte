import type { ReactElement } from "react";
import { pdf, DocumentProps } from "@react-pdf/renderer";

export async function downloadPdf(
  doc: ReactElement<DocumentProps>,
  filename: string,
): Promise<void> {
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
