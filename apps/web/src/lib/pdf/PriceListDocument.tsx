import { Fragment } from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatBRL } from "@/lib/formatters/currency";
import { PDF_COLORS, PDF_FONTS, PDF_SIZES } from "@/lib/pdf/theme";
import type {
  LabInfoForPdf,
  PriceListDocumentProps,
  PriceRow as PriceRowType,
} from "@/lib/pdf/types";

const BORDER = `${PDF_SIZES.borderWidth}pt solid ${PDF_COLORS.border}`;

const styles = StyleSheet.create({
  page: {
    padding: PDF_SIZES.page.padding,
    fontFamily: PDF_FONTS.sans,
    color: PDF_COLORS.text,
    fontSize: PDF_SIZES.row.fontSize,
  },
  table: {
    borderTop: BORDER,
    borderLeft: BORDER,
  },
  rowBase: {
    flexDirection: "row",
    borderRight: BORDER,
    borderBottom: BORDER,
  },
  labNameCell: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: PDF_SIZES.rowHorizontalPadding,
    backgroundColor: PDF_COLORS.headerBg,
    alignItems: "center",
    justifyContent: "center",
  },
  labNameText: {
    fontFamily: PDF_FONTS.serif,
    fontSize: PDF_SIZES.labName.fontSize,
  },
  labMetaCell: {
    flex: 1,
    paddingVertical: PDF_SIZES.rowVerticalPadding,
    paddingHorizontal: PDF_SIZES.rowHorizontalPadding,
    backgroundColor: PDF_COLORS.headerBg,
    alignItems: "center",
    justifyContent: "center",
  },
  labMetaText: {
    fontSize: PDF_SIZES.labMeta.fontSize,
  },
  labContactRow: {
    flexDirection: "row",
    flex: 1,
    backgroundColor: PDF_COLORS.headerBg,
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  categoryHeaderCell: {
    flex: 1,
    paddingVertical: PDF_SIZES.rowVerticalPadding,
    paddingHorizontal: PDF_SIZES.rowHorizontalPadding,
    backgroundColor: PDF_COLORS.headerBg,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryHeaderText: {
    fontFamily: PDF_FONTS.sansBold,
    fontSize: PDF_SIZES.categoryHeader.fontSize,
  },
  serviceNameCell: {
    flex: 1,
    paddingVertical: PDF_SIZES.rowVerticalPadding,
    paddingHorizontal: PDF_SIZES.rowHorizontalPadding,
    justifyContent: "center",
    borderRight: BORDER,
  },
  servicePriceCell: {
    width: PDF_SIZES.priceColumnWidth,
    paddingVertical: PDF_SIZES.rowVerticalPadding,
    paddingHorizontal: PDF_SIZES.rowHorizontalPadding,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  observationCell: {
    flex: 1,
    paddingVertical: PDF_SIZES.rowVerticalPadding,
    paddingHorizontal: PDF_SIZES.rowHorizontalPadding,
    justifyContent: "center",
  },
  pageNumber: {
    position: "absolute",
    bottom: 12,
    right: PDF_SIZES.page.padding,
    color: PDF_COLORS.footerText,
    fontSize: PDF_SIZES.footerPage.fontSize,
  },
});

function LabHeader({ labInfo }: { labInfo: LabInfoForPdf }) {
  const techLine = [
    labInfo.responsibleTechnician
      ? `Técnico responsável: ${labInfo.responsibleTechnician}`
      : null,
    labInfo.responsibleTechnicianCro
      ? `CRO ${labInfo.responsibleTechnicianCro}`
      : null,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <View fixed>
      <View style={styles.rowBase}>
        <View style={styles.labNameCell}>
          <Text style={styles.labNameText}>{labInfo.name}</Text>
        </View>
      </View>
      {techLine ? (
        <View style={styles.rowBase}>
          <View style={styles.labMetaCell}>
            <Text style={styles.labMetaText}>{techLine}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.rowBase}>
        <View style={styles.labContactRow}>
          {labInfo.phone ? (
            <Text style={styles.labMetaText}>tel. {labInfo.phone}</Text>
          ) : null}
          {labInfo.email ? (
            <Text style={styles.labMetaText}>e-mail: {labInfo.email}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function CategoryHeader({ name }: { name: string }) {
  return (
    <View style={styles.rowBase}>
      <View style={styles.categoryHeaderCell}>
        <Text style={styles.categoryHeaderText}>{name}</Text>
      </View>
    </View>
  );
}

function PriceRow({ row }: { row: PriceRowType }) {
  return (
    <View style={styles.rowBase} wrap={false}>
      <View style={styles.serviceNameCell}>
        <Text>{row.name}</Text>
      </View>
      <View style={styles.servicePriceCell}>
        <Text>{formatBRL(row.price)}</Text>
      </View>
    </View>
  );
}

function ObservationRow({ text }: { text: string }) {
  return (
    <View style={styles.rowBase} wrap={false}>
      <View style={styles.observationCell}>
        <Text>{text}</Text>
      </View>
    </View>
  );
}

export function PriceListDocument({
  labInfo,
  sections,
  observations,
}: PriceListDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.table}>
          <LabHeader labInfo={labInfo} />
          {sections.map((section) => (
            <Fragment key={section.categoryName}>
              <CategoryHeader name={section.categoryName} />
              {section.rows.map((row) => (
                <PriceRow key={row.id} row={row} />
              ))}
            </Fragment>
          ))}
          {observations.length > 0 ? (
            <>
              <CategoryHeader name="Observações" />
              {observations.map((obs, i) => (
                <ObservationRow key={`obs-${i}`} text={obs} />
              ))}
            </>
          ) : null}
        </View>
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${pageNumber}/${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
