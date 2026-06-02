export const PDF_COLORS = {
  headerBg: "#E2EFDA",
  border: "#000000",
  text: "#000000",
  footerText: "#888888",
} as const;

export const PDF_FONTS = {
  serif: "Times-Roman",
  sans: "Helvetica",
  sansBold: "Helvetica-Bold",
} as const;

export const PDF_SIZES = {
  page: { padding: 32 },
  labName: { fontSize: 24 },
  labMeta: { fontSize: 9 },
  categoryHeader: { fontSize: 10 },
  row: { fontSize: 9 },
  footerPage: { fontSize: 8 },
  rowVerticalPadding: 4,
  rowHorizontalPadding: 6,
  priceColumnWidth: 90,
  borderWidth: 0.5,
} as const;

export const DIVERSOS_NAME = "Diversos";
