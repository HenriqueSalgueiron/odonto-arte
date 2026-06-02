import type { GetLabInfo200 } from "@/generated/types/lab-infoController/GetLabInfo";

export type LabInfoForPdf = GetLabInfo200;

export type ServiceForExport = {
  id: string;
  name: string;
  categoryId: string | null;
  price: number;
};

export type CategoryForExport = {
  id: string;
  name: string;
};

export type PriceRow = {
  id: string;
  name: string;
  price: number;
};

export type PriceSection = {
  categoryName: string;
  rows: PriceRow[];
};

export type PriceListDocumentProps = {
  labInfo: LabInfoForPdf;
  sections: PriceSection[];
  observations: string[];
};
