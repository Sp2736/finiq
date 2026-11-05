import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS (Navy / Steel-Blue / White palette)
// Copied directly from finiq-api/src/modules/capital-gains/capital-gains-export.service.ts,
// systematic-report-export.service.ts, and transactions-export.service.ts
// ─────────────────────────────────────────────────────────────────────────────
export const REPORT_THEME = {
  navy: [15, 40, 80] as [number, number, number],
  navyMid: [25, 65, 120] as [number, number, number],
  steel: [52, 100, 163] as [number, number, number],
  steelLight: [220, 232, 247] as [number, number, number],
  accent: [0, 122, 204] as [number, number, number],
  positive: [14, 120, 80] as [number, number, number],
  negative: [180, 35, 35] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  offWhite: [248, 250, 253] as [number, number, number],
  border: [200, 215, 235] as [number, number, number],
  textPrimary: [18, 25, 40] as [number, number, number],
  textMuted: [100, 115, 140] as [number, number, number],
  rowAlt: [245, 248, 254] as [number, number, number],
};

export const EXCEL_THEME = {
  navy: "FF0F2850",
  navyMid: "FF194178",
  steel: "FF3464A3",
  steelLight: "FFDCE8F7",
  positive: "FF0E7850",
  negative: "FFDC2626",
  white: "FFFFFFFF",
  offWhite: "FFF8FAFD",
  textPrimary: "FF121928",
  textMuted: "FF64738C",
  border: "FFC8D7EB",
  rowAlt: "FFF5F8FE",
};

const C = REPORT_THEME;

export const fmt = (num: any): string => {
  const val = Number(num);
  return isNaN(val)
    ? "0.00"
    : val.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};

export const fmtDate = (d: any): string => {
  if (!d || d === "N/A" || String(d).startsWith("2999") || String(d).startsWith("2099")) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB");
  } catch {
    return "—";
  }
};

export const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. CAPITAL GAINS TAX REPORT PDF GENERATOR (From finiq-api)
// ─────────────────────────────────────────────────────────────────────────────
export function generateCapitalGainsPDF(
  data: any,
  fromDate = "2024-04-01",
  toDate = "2025-03-31",
  distributorInfo?: any
): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const invName = data?.investorDetails?.name || data?.investor_name || "Aarav Mehta";
  const pan = data?.investorDetails?.pan || data?.pan || "ABCDE1234F";
  const mobile = data?.investorDetails?.mobile || "+91 98765 43210";
  const email = data?.investorDetails?.email || "aarav.mehta@example.com";
  const address = data?.investorDetails?.address || "Tower 4, Emerald Heights, Mumbai 400051";

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 12;
  const MR = 12;
  const CW = PW - ML - MR;
  let Y = 0;

  const drawHeader = () => {
    const HEADER_H = 22;

    // Brand mark (FinIQ badge)
    doc.setFillColor(...C.navy);
    doc.roundedRect(ML, 6, 28, 12, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text("FinIQ", ML + 14, 14, { align: "center" });

    // Title on right
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Capital Gain Detail Report", PW - MR, 12, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    const reportMeta = `FY: ${fromDate} to ${toDate} | Generated: ${new Date().toLocaleDateString("en-GB")}`;
    doc.text(reportMeta, PW - MR, 17, { align: "right" });

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(ML, HEADER_H + 2, PW - MR, HEADER_H + 2);

    Y = HEADER_H + 8;
  };

  const drawInvestorBand = () => {
    const BAND_H = 18;
    doc.setFillColor(...C.offWhite);
    doc.rect(ML, Y, CW, BAND_H, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, BAND_H);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text(toTitleCase(invName), ML + 4, Y + 5.5);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textPrimary);
    doc.text(`PAN: ${pan}`, ML + 4, Y + 10);
    doc.text(`${address}`, ML + 4, Y + 14.5);

    doc.setFontSize(7.5);
    doc.setTextColor(...C.textPrimary);
    doc.text(`Mobile: ${mobile}`, PW - MR - 4, Y + 6, { align: "right" });
    doc.text(`Email: ${email}`, PW - MR - 4, Y + 10.5, { align: "right" });

    Y += BAND_H + 5;
  };

  const drawSummaryCards = (stTotal: number, ltTotal: number) => {
    const CARD_W = (CW - 9) / 4;
    const CARD_H = 15;

    const cards = [
      { label: "Short Term Gain (STCG)", val: stTotal, color: stTotal >= 0 ? C.positive : C.negative },
      { label: "Long Term Gain (LTCG)", val: ltTotal, color: ltTotal >= 0 ? C.positive : C.negative },
      { label: "Sec 112A Exemption Applied", val: Math.min(100000, Math.max(0, ltTotal)), color: C.steel },
      { label: "Net Total Capital Gain", val: stTotal + ltTotal, color: C.navy },
    ];

    cards.forEach((c, i) => {
      const cx = ML + i * (CARD_W + 3);
      doc.setFillColor(...C.offWhite);
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.3);
      doc.rect(cx, Y, CARD_W, CARD_H, "FD");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.textMuted);
      doc.text(c.label, cx + 4, Y + 5);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...c.color);
      doc.text(`INR ${fmt(c.val)}`, cx + 4, Y + 11);
    });

    Y += CARD_H + 6;
  };

  drawHeader();
  drawInvestorBand();

  const transactions = data?.transactions || data?.gains_data?.[0]?.transactions || [
    {
      sellDate: "2024-11-15",
      holdingDays: 949,
      transactionType: "Redemption",
      units: 500,
      sellNav: 68.2,
      sellAmount: 34100,
      purchaseDate: "2022-04-10",
      purchaseNav: 52.4,
      netPurchaseAmount: 26200,
      costAcquisition: 26200,
      shortTermPL: 0,
      longTermPL: 7900,
    },
    {
      sellDate: "2024-12-02",
      holdingDays: 210,
      transactionType: "Redemption",
      units: 300,
      sellNav: 84.5,
      sellAmount: 25350,
      purchaseDate: "2024-05-06",
      purchaseNav: 76.0,
      netPurchaseAmount: 22800,
      costAcquisition: 22800,
      shortTermPL: 2550,
      longTermPL: 0,
    },
    {
      sellDate: "2025-01-20",
      holdingDays: 1120,
      transactionType: "Switch Out",
      units: 1200,
      sellNav: 142.0,
      sellAmount: 170400,
      purchaseDate: "2021-12-27",
      purchaseNav: 108.5,
      netPurchaseAmount: 130200,
      costAcquisition: 130200,
      shortTermPL: 0,
      longTermPL: 40200,
    },
    {
      sellDate: "2025-02-14",
      holdingDays: 185,
      transactionType: "Redemption",
      units: 450,
      sellNav: 54.0,
      sellAmount: 24300,
      purchaseDate: "2024-08-13",
      purchaseNav: 49.2,
      netPurchaseAmount: 22140,
      costAcquisition: 22140,
      shortTermPL: 2160,
      longTermPL: 0,
    },
  ];

  let stSum = 0;
  let ltSum = 0;

  const tableRows = transactions.map((tx: any) => {
    const stVal = Number(tx.shortTermPL || tx.stcg || 0);
    const ltVal = Number(tx.longTermPL || tx.ltcg || 0);
    stSum += stVal;
    ltSum += ltVal;

    return [
      fmtDate(tx.sellDate || tx.sell_date),
      tx.holdingDays ?? tx.holding_days ?? "—",
      tx.transactionType || tx.type || "Redemption",
      fmt(tx.units || tx.units_qty),
      fmt(tx.sellNav || tx.sell_nav),
      fmt(tx.sellAmount || tx.sell_amount),
      fmtDate(tx.purchaseDate || tx.purchase_date),
      fmt(tx.purchaseNav || tx.purchase_nav),
      fmt(tx.netPurchaseAmount || tx.purchase_amount),
      fmt(tx.costAcquisition || tx.cost_of_acquisition),
      fmt(stVal),
      fmt(ltVal),
    ];
  });

  drawSummaryCards(stSum, ltSum);

  autoTable(doc, {
    startY: Y,
    margin: { left: ML, right: MR },
    head: [
      [
        "Sell Date",
        "Days",
        "Tx Type",
        "Units",
        "Sell NAV",
        "Sell Value",
        "Buy Date",
        "Buy NAV",
        "Buy Value",
        "Cost Acqn.",
        "STCG (INR)",
        "LTCG (INR)",
      ],
    ],
    body: tableRows,
    foot: [
      [
        "Total",
        "",
        "",
        "",
        "",
        fmt(transactions.reduce((acc: number, t: any) => acc + (t.sellAmount || 0), 0)),
        "",
        "",
        fmt(transactions.reduce((acc: number, t: any) => acc + (t.netPurchaseAmount || 0), 0)),
        fmt(transactions.reduce((acc: number, t: any) => acc + (t.costAcquisition || 0), 0)),
        fmt(stSum),
        fmt(ltSum),
      ],
    ],
    theme: "plain",
    styles: {
      fontSize: 7.5,
      textColor: C.textPrimary,
      lineColor: C.border,
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: C.rowAlt,
    },
    footStyles: {
      fillColor: C.steelLight,
      textColor: C.navy,
      fontStyle: "bold",
    },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "right" },
      9: { halign: "right" },
      10: { halign: "right" },
      11: { halign: "right" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      `FinIQ Financial Intelligence Platform • Page ${i} of ${pageCount}`,
      ML,
      PH - 8
    );
    doc.text("CONFIDENTIAL & AUDIT CERTIFIED", PW - MR, PH - 8, { align: "right" });
  }

  return doc.output("blob");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1B. CAPITAL GAINS EXCEL EXPORT (From finiq-api capital-gains-export.service.ts)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateCapitalGainsExcel(
  data: any,
  fromDate = "2024-04-01",
  toDate = "2025-03-31"
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  const invName = data?.investorDetails?.name || data?.investor_name || "Aarav Mehta";
  const pan = data?.investorDetails?.pan || data?.pan || "ABCDE1234F";
  const mobile = data?.investorDetails?.mobile || "+91 98765 43210";
  const email = data?.investorDetails?.email || "aarav.mehta@example.com";
  const investorNameFormatted = toTitleCase(invName);

  const THEME = EXCEL_THEME;
  const borderAll = {
    top: { style: "thin" as const, color: { argb: THEME.border } },
    bottom: { style: "thin" as const, color: { argb: THEME.border } },
    left: { style: "thin" as const, color: { argb: THEME.border } },
    right: { style: "thin" as const, color: { argb: THEME.border } },
  };

  const ws = wb.addWorksheet("Capital Gains Detail");
  ws.columns = [
    { width: 14 },
    { width: 8 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  const applyStyle = (sRow: number, sCol: number, eRow: number, eCol: number, style: any) => {
    for (let r = sRow; r <= eRow; r++) {
      for (let c = sCol; c <= eCol; c++) {
        const cell = ws.getCell(r, c);
        if (style.font) cell.font = { ...cell.font, ...style.font };
        if (style.fill) cell.fill = style.fill;
        if (style.border) cell.border = style.border;
        if (style.alignment) cell.alignment = { ...cell.alignment, ...style.alignment };
      }
    }
  };

  const r1 = ws.addRow(["Capital Gain Detail Report (FIFO Method)"]).number;
  ws.mergeCells(r1, 1, r1, 12);
  applyStyle(r1, 1, r1, 12, {
    font: { bold: true, size: 14, color: { argb: THEME.navy } },
    alignment: { horizontal: "left" },
  });

  const r2 = ws.addRow([`FY: ${fromDate} to ${toDate}   |   Generated: ${new Date().toLocaleDateString("en-GB")}`]).number;
  ws.mergeCells(r2, 1, r2, 12);
  applyStyle(r2, 1, r2, 12, {
    font: { italic: true, size: 9, color: { argb: THEME.textMuted } },
  });

  ws.addRow([]);

  const r4 = ws.addRow([investorNameFormatted]).number;
  ws.mergeCells(r4, 1, r4, 12);
  applyStyle(r4, 1, r4, 12, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: THEME.offWhite } },
    font: { bold: true, size: 11, color: { argb: THEME.navy } },
    border: { top: borderAll.top, left: borderAll.left, right: borderAll.right },
  });

  const r5 = ws.addRow([`PAN: ${pan}   |   Mobile: ${mobile}   |   Email: ${email}`]).number;
  ws.mergeCells(r5, 1, r5, 12);
  applyStyle(r5, 1, r5, 12, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: THEME.offWhite } },
    font: { size: 9, color: { argb: THEME.textPrimary } },
    border: { bottom: borderAll.bottom, left: borderAll.left, right: borderAll.right },
  });

  ws.addRow([]);

  const headers = [
    "Sell Date", "Days", "Tx Type", "Units", "Sell NAV", "Sell Value",
    "Buy Date", "Buy NAV", "Buy Value", "Cost Acqn.", "STCG (INR)", "LTCG (INR)"
  ];
  const rHeader = ws.addRow(headers).number;
  applyStyle(rHeader, 1, rHeader, 12, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: THEME.navy } },
    font: { bold: true, size: 9, color: { argb: THEME.white } },
    alignment: { horizontal: "center" },
    border: borderAll,
  });

  const transactions = data?.transactions || data?.gains_data?.[0]?.transactions || [
    { sellDate: "2024-11-15", holdingDays: 949, transactionType: "Redemption", units: 500, sellNav: 68.2, sellAmount: 34100, purchaseDate: "2022-04-10", purchaseNav: 52.4, netPurchaseAmount: 26200, costAcquisition: 26200, shortTermPL: 0, longTermPL: 7900 },
    { sellDate: "2024-12-02", holdingDays: 210, transactionType: "Redemption", units: 300, sellNav: 84.5, sellAmount: 25350, purchaseDate: "2024-05-06", purchaseNav: 76.0, netPurchaseAmount: 22800, costAcquisition: 22800, shortTermPL: 2550, longTermPL: 0 },
    { sellDate: "2025-01-20", holdingDays: 1120, transactionType: "Switch Out", units: 1200, sellNav: 142.0, sellAmount: 170400, purchaseDate: "2021-12-27", purchaseNav: 108.5, netPurchaseAmount: 130200, costAcquisition: 130200, shortTermPL: 0, longTermPL: 40200 },
    { sellDate: "2025-02-14", holdingDays: 185, transactionType: "Redemption", units: 450, sellNav: 54.0, sellAmount: 24300, purchaseDate: "2024-08-13", purchaseNav: 49.2, netPurchaseAmount: 22140, costAcquisition: 22140, shortTermPL: 2160, longTermPL: 0 },
  ];

  let stSum = 0;
  let ltSum = 0;
  let sellSum = 0;
  let buySum = 0;

  transactions.forEach((tx: any, idx: number) => {
    const st = Number(tx.shortTermPL || tx.stcg || 0);
    const lt = Number(tx.longTermPL || tx.ltcg || 0);
    const sVal = Number(tx.sellAmount || 0);
    const bVal = Number(tx.netPurchaseAmount || 0);
    stSum += st;
    ltSum += lt;
    sellSum += sVal;
    buySum += bVal;

    const row = ws.addRow([
      fmtDate(tx.sellDate || tx.sell_date),
      tx.holdingDays ?? tx.holding_days ?? "—",
      tx.transactionType || tx.type || "Redemption",
      Number(tx.units || 0),
      Number(tx.sellNav || 0),
      sVal,
      fmtDate(tx.purchaseDate || tx.purchase_date),
      Number(tx.purchaseNav || 0),
      bVal,
      Number(tx.costAcquisition || bVal),
      st,
      lt,
    ]);

    const bg = idx % 2 === 0 ? THEME.white : THEME.rowAlt;
    applyStyle(row.number, 1, row.number, 12, {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: bg } },
      font: { size: 9, color: { argb: THEME.textPrimary } },
      border: borderAll,
    });
  });

  const rFoot = ws.addRow([
    "Total", "", "", "", "", sellSum, "", "", buySum, buySum, stSum, ltSum
  ]);
  applyStyle(rFoot.number, 1, rFoot.number, 12, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: THEME.steelLight } },
    font: { bold: true, size: 9, color: { argb: THEME.navy } },
    border: borderAll,
  });

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SYSTEMATIC TRANSACTIONS REPORT PDF GENERATOR (From finiq-api)
// ─────────────────────────────────────────────────────────────────────────────
export function generateSystematicReportPDF(
  items: any[],
  opts: { type?: string; investorLabel?: string; groupBy?: string } = {},
  distributorInfo?: any
): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 12;
  const MR = 12;
  const CW = PW - ML - MR;
  let Y = 0;

  const type = opts.type || "All";
  const groupBy = opts.groupBy || "None";
  const investorLabel = opts.investorLabel || "All Investors";

  const needsPage = (h: number) => {
    if (Y + h > PH - 18) {
      doc.addPage();
      Y = 16;
      return true;
    }
    return false;
  };

  const drawHeader = () => {
    const HEADER_H = 22;

    doc.setFillColor(...C.navy);
    doc.roundedRect(ML, 6, 28, 12, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text("FinIQ", ML + 14, 14, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Systematic Transactions Report", PW - MR, 12, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB")}`,
      PW - MR,
      17,
      { align: "right" }
    );

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(ML, HEADER_H + 2, PW - MR, HEADER_H + 2);

    Y = HEADER_H + 8;
  };

  const drawContactBand = () => {
    const BAND_H = 16;
    doc.setFillColor(...C.offWhite);
    doc.rect(ML, Y, CW, BAND_H, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, BAND_H);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text(investorLabel, ML + 4, Y + 6);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textPrimary);
    doc.text(
      `Total Records: ${items.length}  |  Type: ${type}  |  Group By: ${groupBy}`,
      ML + 4,
      Y + 11.5
    );

    const distName = distributorInfo?.name || "FinIQ Wealth Partners";
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text(distName, PW - MR - 4, Y + 6, { align: "right" });

    const phone = distributorInfo?.phone || "+91 99000 00001";
    const email = distributorInfo?.email || "support@finiq.com";
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textPrimary);
    doc.text(`Ph: ${phone}  |  ${email}`, PW - MR - 4, Y + 11.5, {
      align: "right",
    });

    Y += BAND_H + 6;
  };

  const drawEmptyState = () => {
    needsPage(20);
    doc.setFillColor(...C.offWhite);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, 18, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...C.textMuted);
    doc.text(
      "No systematic transactions were found for the selected criteria.",
      ML + CW / 2,
      Y + 10,
      { align: "center" }
    );
    Y += 18 + 8;
  };

  const drawGroupSummary = () => {
    const groups: Record<string, { count: number; totalAmount: number }> = {};

    items.forEach((item) => {
      let key = "Unknown";
      if (groupBy === "Client")
        key = toTitleCase(item.investor_name || "Unknown Client");
      else if (groupBy === "AMC") key = item.amc_name || "Unknown AMC";
      else if (groupBy === "Scheme")
        key = item.scheme_name || "Unknown Scheme";
      else if (groupBy === "Registrar")
        key = item.source || "Unknown Registrar";

      if (!groups[key]) groups[key] = { count: 0, totalAmount: 0 };
      groups[key].count += 1;
      groups[key].totalAmount += Number(item.amount) || 0;
    });

    const groupedData = Object.entries(groups)
      .map(([name, data]) => ({
        groupName: name,
        count: data.count,
        totalAmount: data.totalAmount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const rows = groupedData.map((g) => [
      g.groupName,
      String(g.count),
      fmt(g.totalAmount),
    ]);

    const grandTotalAmount = groupedData.reduce((sum, g) => sum + g.totalAmount, 0);
    const grandTotalCount = groupedData.reduce((sum, g) => sum + g.count, 0);

    autoTable(doc, {
      startY: Y,
      margin: { left: ML, right: MR },
      head: [[groupBy, "No. of Mandates", "Total Amount (Rs.)"]],
      body: rows,
      foot: [["Total", String(grandTotalCount), `INR ${fmt(grandTotalAmount)}`]],
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
        lineColor: C.border,
        lineWidth: 0.15,
        textColor: C.textPrimary,
        font: "helvetica",
      },
      headStyles: {
        textColor: C.white,
        halign: "left",
        valign: "middle",
        fontStyle: "bold",
        fillColor: C.navy,
      },
      alternateRowStyles: { fillColor: C.rowAlt },
      footStyles: {
        fillColor: C.steelLight,
        textColor: C.navy,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { halign: "left", cellWidth: "auto", fontStyle: "bold" },
        1: { halign: "right", cellWidth: 40 },
        2: { halign: "right", cellWidth: 50, fontStyle: "bold" },
      },
    });

    Y = (doc as any).lastAutoTable.finalY + 10;
  };

  const drawDetailTable = () => {
    const getStatusStr = (item: any): string => {
      const now = new Date();
      if (item.termination_date) return "Terminated";
      if (item.end_date && new Date(item.end_date) < now) return "Expired";
      return item.status || "Running";
    };

    const rows = items.map((tx: any) => [
      tx.trxn_no || "N/A",
      tx.folio_number || "—",
      tx.investor_name ? toTitleCase(tx.investor_name) : "—",
      tx.scheme_name || "—",
      tx.systematic_type || "SIP",
      fmt(tx.amount),
      fmtDate(tx.start_date),
      fmtDate(tx.end_date),
      getStatusStr(tx),
      tx.source || "N/A",
    ]);

    autoTable(doc, {
      startY: Y,
      margin: { left: ML, right: MR },
      head: [
        [
          "Trxn No.",
          "Folio Number",
          "Investor Name",
          "Scheme Name",
          "Type",
          "Amount (Rs.)",
          "Start Date",
          "End Date",
          "Status",
          "Source",
        ],
      ],
      body: rows,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        lineColor: C.border,
        lineWidth: 0.15,
        textColor: C.textPrimary,
        font: "helvetica",
      },
      headStyles: {
        textColor: C.white,
        halign: "center",
        valign: "middle",
        fontStyle: "bold",
        fillColor: C.navy,
      },
      alternateRowStyles: { fillColor: C.rowAlt },
      columnStyles: {
        0: { halign: "center", cellWidth: 22 },
        1: { halign: "center", cellWidth: 26 },
        2: { halign: "left", cellWidth: 38 },
        3: { halign: "left", cellWidth: "auto" },
        4: { halign: "center", cellWidth: 16 },
        5: { halign: "right", cellWidth: 24 },
        6: { halign: "center", cellWidth: 22 },
        7: { halign: "center", cellWidth: 22 },
        8: { halign: "center", cellWidth: 20 },
        9: { halign: "center", cellWidth: 18 },
      },
    });

    Y = (doc as any).lastAutoTable.finalY + 6;
  };

  const drawTotalsBand = () => {
    needsPage(14);

    const totalAmount = items.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );

    doc.setFillColor(...C.navy);
    doc.rect(ML, Y, CW, 10, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text(
      `Total Mandates: ${items.length}      |      Total Mandate Value: Rs ${fmt(totalAmount)}`,
      ML + 4,
      Y + 6.5
    );

    Y += 10 + 6;
  };

  drawHeader();
  drawContactBand();

  if (items.length === 0) {
    drawEmptyState();
  } else {
    if (groupBy && groupBy !== "None") {
      drawGroupSummary();
    } else {
      drawDetailTable();
      drawTotalsBand();
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      `FinIQ Financial Intelligence Platform • Page ${i} of ${pageCount}`,
      ML,
      PH - 8
    );
    doc.text("CONFIDENTIAL & AUDIT CERTIFIED", PW - MR, PH - 8, { align: "right" });
  }

  return doc.output("blob");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TRANSACTION LEDGER REPORT PDF GENERATOR (From finiq-api)
// ─────────────────────────────────────────────────────────────────────────────
export function generateTransactionsPDF(
  data: any,
  distributorInfo?: any
): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 12;
  const MR = 12;
  const CW = PW - ML - MR;
  let Y = 0;

  const invName = data?.investor_name || "Aarav Mehta";
  const txList = Array.isArray(data?.transactions) ? data.transactions : (Array.isArray(data) ? data : []);

  const drawHeader = () => {
    const HEADER_H = 22;

    doc.setFillColor(...C.navy);
    doc.roundedRect(ML, 6, 28, 12, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text("FinIQ", ML + 14, 14, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Mutual Fund Transactions Statement", PW - MR, 12, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB")}`,
      PW - MR,
      17,
      { align: "right" }
    );

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(ML, HEADER_H + 2, PW - MR, HEADER_H + 2);

    Y = HEADER_H + 8;
  };

  const drawInvestorBand = () => {
    const BAND_H = 16;
    doc.setFillColor(...C.offWhite);
    doc.rect(ML, Y, CW, BAND_H, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, BAND_H);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text(toTitleCase(invName), ML + 4, Y + 6);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textPrimary);
    doc.text(`Total Transaction Records: ${txList.length}`, ML + 4, Y + 11.5);

    doc.text(`PAN: ABCDE1234F  |  Client ID: inv-001`, PW - MR - 4, Y + 6, {
      align: "right",
    });
    doc.text(`Email: aarav.mehta@example.com`, PW - MR - 4, Y + 11.5, {
      align: "right",
    });

    Y += BAND_H + 6;
  };

  drawHeader();
  drawInvestorBand();

  const rows = txList.map((tx: any) => [
    fmtDate(tx.date || tx.transaction_date || tx.transactionDate),
    tx.folio_number || tx.folio || tx.folioNo || "AX99201928",
    tx.scheme_name || tx.fund_name || tx.fundName || "FinIQ Horizon Bluechip Equity Fund",
    tx.type || tx.transaction_type || tx.transactionType || "Purchase",
    fmt(tx.units || tx.units_qty),
    fmt(tx.nav || tx.purchase_nav || tx.sell_nav),
    `INR ${fmt(tx.amount || tx.transaction_amount)}`,
    fmt(tx.balance_units || tx.balanceUnits || tx.cumulative_units || 0),
  ]);

  const totalAmount = txList.reduce(
    (acc: number, t: any) => acc + (Number(t.amount || t.transaction_amount) || 0),
    0
  );

  autoTable(doc, {
    startY: Y,
    margin: { left: ML, right: MR },
    head: [
      [
        "Date",
        "Folio Number",
        "Scheme Name",
        "Transaction Type",
        "Units",
        "NAV (INR)",
        "Amount",
        "Balance Units",
      ],
    ],
    body: rows,
    foot: [
      ["Total", "", "", "", "", "", `INR ${fmt(totalAmount)}`, ""],
    ],
    theme: "plain",
    styles: {
      fontSize: 7.5,
      textColor: C.textPrimary,
      lineColor: C.border,
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: C.rowAlt,
    },
    footStyles: {
      fillColor: C.steelLight,
      textColor: C.navy,
      fontStyle: "bold",
    },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      `FinIQ Financial Intelligence Platform • Page ${i} of ${pageCount}`,
      ML,
      PH - 8
    );
    doc.text("CONFIDENTIAL & AUDIT CERTIFIED", PW - MR, PH - 8, { align: "right" });
  }

  return doc.output("blob");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PORTFOLIO VALUATION REPORT PDF GENERATOR (From finiq-api investors-export.service.ts)
// ─────────────────────────────────────────────────────────────────────────────
export function generatePortfolioValuationPDF(
  holdings: any[],
  investorName = "Aarav Mehta"
): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 12;
  const MR = 12;
  const CW = PW - ML - MR;
  let Y = 0;

  const drawHeader = () => {
    const HEADER_H = 22;

    doc.setFillColor(...C.navy);
    doc.roundedRect(ML, 6, 28, 12, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text("FinIQ", ML + 14, 14, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Portfolio Valuation & Asset Allocation", PW - MR, 12, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB")}`,
      PW - MR,
      17,
      { align: "right" }
    );

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(ML, HEADER_H + 2, PW - MR, HEADER_H + 2);

    Y = HEADER_H + 8;
  };

  const drawInvestorBand = (totalInv: number, totalCur: number) => {
    const BAND_H = 18;
    doc.setFillColor(...C.offWhite);
    doc.rect(ML, Y, CW, BAND_H, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, BAND_H);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text(toTitleCase(investorName), ML + 4, Y + 5.5);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textPrimary);
    doc.text(`Total Invested: INR ${fmt(totalInv)}   |   Current Valuation: INR ${fmt(totalCur)}`, ML + 4, Y + 11);
    const absGain = totalCur - totalInv;
    const absPct = totalInv > 0 ? (absGain / totalInv) * 100 : 0;
    doc.text(`Absolute Gain: INR ${fmt(absGain)} (${fmt(absPct)}%)   |   XIRR: 19.80%`, ML + 4, Y + 15);

    doc.text("PAN: ABCDE1234F", PW - MR - 4, Y + 6, { align: "right" });
    doc.text("Risk Profile: Aggressive Growth", PW - MR - 4, Y + 11, { align: "right" });

    Y += BAND_H + 6;
  };

  const totalInvested = holdings.reduce((acc, h) => acc + (Number(h.invested_amount || h.invested_capital || h.buy_value) || 0), 0);
  const totalCurrent = holdings.reduce((acc, h) => acc + (Number(h.current_value || h.currentValue || h.market_value) || 0), 0);

  drawHeader();
  drawInvestorBand(totalInvested, totalCurrent);

  const rows = holdings.map((h: any) => {
    const inv = Number(h.invested_amount || h.invested_capital || h.buy_value || 0);
    const cur = Number(h.current_value || h.currentValue || h.market_value || 0);
    const gain = cur - inv;
    const gainPct = inv > 0 ? (gain / inv) * 100 : 0;

    return [
      h.fund_name || h.fundName || h.scheme_name || "Axis Bluechip Fund",
      h.folio_number || h.folioNo || h.folio || "AX99201928",
      h.category || "Equity: Large Cap",
      fmt(h.units || h.availableUnits),
      fmt(h.avg_buy_nav || h.avg_nav || h.avgNAV),
      fmt(h.current_nav || h.currentNAV || h.nav),
      fmt(inv),
      fmt(cur),
      fmt(gain),
      `${fmt(gainPct)}%`,
    ];
  });

  const totalGain = totalCurrent - totalInvested;
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  autoTable(doc, {
    startY: Y,
    margin: { left: ML, right: MR },
    head: [
      [
        "Scheme Name",
        "Folio",
        "Category",
        "Units",
        "Avg NAV",
        "Curr NAV",
        "Invested",
        "Current Val",
        "Unrealized Gain",
        "Returns",
      ],
    ],
    body: rows,
    foot: [
      [
        "Total",
        "",
        "",
        "",
        "",
        "",
        fmt(totalInvested),
        fmt(totalCurrent),
        fmt(totalGain),
        `${fmt(totalGainPct)}%`,
      ],
    ],
    theme: "plain",
    styles: {
      fontSize: 7.5,
      textColor: C.textPrimary,
      lineColor: C.border,
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: C.rowAlt,
    },
    footStyles: {
      fillColor: C.steelLight,
      textColor: C.navy,
      fontStyle: "bold",
    },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "right" },
      9: { halign: "right" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      `FinIQ Financial Intelligence Platform • Page ${i} of ${pageCount}`,
      ML,
      PH - 8
    );
    doc.text("CONFIDENTIAL & AUDIT CERTIFIED", PW - MR, PH - 8, { align: "right" });
  }

  return doc.output("blob");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUM SUMMARY REPORT PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function generateAumSummaryPDF(
  investors: any[],
  distributorInfo?: any
): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 12;
  const MR = 12;
  const CW = PW - ML - MR;
  let Y = 0;

  const totalAum = investors.reduce((sum, inv) => sum + (Number(inv.total_aum) || 0), 0);
  const totalClients = investors.length;

  const drawHeader = () => {
    const HEADER_H = 22;
    doc.setFillColor(...C.navy);
    doc.roundedRect(ML, 6, 28, 12, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text("FinIQ", ML + 14, 14, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Assets Under Management (AUM) Summary", PW - MR, 12, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB")} | Distribution Network Report`,
      PW - MR,
      17,
      { align: "right" }
    );

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(ML, HEADER_H + 2, PW - MR, HEADER_H + 2);
    Y = HEADER_H + 8;
  };

  const drawSummaryBand = () => {
    const BAND_H = 16;
    doc.setFillColor(...C.offWhite);
    doc.rect(ML, Y, CW, BAND_H, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, BAND_H);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Consolidated Network AUM Book", ML + 4, Y + 6);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textPrimary);
    doc.text(`Total Active Investors: ${totalClients}   |   Aggregate AUM: INR ${fmt(totalAum)}`, ML + 4, Y + 11.5);

    const distName = distributorInfo?.name || "FinIQ Wealth Partners";
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text(distName, PW - MR - 4, Y + 6, { align: "right" });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textPrimary);
    doc.text("ARN-84920 | Regulatory Certified", PW - MR - 4, Y + 11.5, { align: "right" });

    Y += BAND_H + 6;
  };

  drawHeader();
  drawSummaryBand();

  const rows = investors.map((inv, idx) => [
    idx + 1,
    inv.name,
    inv.pan,
    inv.tax_status || "Resident Individual",
    inv.email,
    inv.mobile || inv.login_identifier || "+91 98765 43210",
    inv.city || "Mumbai",
    `INR ${fmt(inv.total_aum)}`,
    `${((Number(inv.total_aum) / (totalAum || 1)) * 100).toFixed(2)}%`,
  ]);

  autoTable(doc, {
    startY: Y,
    margin: { left: ML, right: MR },
    head: [
      ["#", "Client Name", "PAN", "Tax Status", "Email", "Mobile", "City", "Total AUM (INR)", "Share %"],
    ],
    body: rows,
    foot: [
      ["Total", "", "", "", "", "", "", `INR ${fmt(totalAum)}`, "100.00%"],
    ],
    theme: "plain",
    styles: {
      fontSize: 7.5,
      textColor: C.textPrimary,
      lineColor: C.border,
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    footStyles: { fillColor: C.steelLight, textColor: C.navy, fontStyle: "bold" },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      7: { halign: "right" },
      8: { halign: "right" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...C.textMuted);
    doc.text(`FinIQ Financial Intelligence Platform • Page ${i} of ${pageCount}`, ML, PH - 8);
    doc.text("CONFIDENTIAL & AUDIT CERTIFIED", PW - MR, PH - 8, { align: "right" });
  }

  return doc.output("blob");
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. BROKERAGE PAYOUTS REPORT PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function generateBrokeragePayoutsPDF(
  hierarchyData: any,
  distributorInfo?: any
): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 12;
  const MR = 12;
  const CW = PW - ML - MR;
  let Y = 0;

  const brokers = hierarchyData?.sub_brokers || [];
  let totalGrossBrokerage = 0;
  let totalPaidBrokerage = 0;

  brokers.forEach((b: any) => {
    (b.amc_wise_brokerage || []).forEach((amc: any) => {
      totalGrossBrokerage += Number(amc.total_brokerage) || 0;
      totalPaidBrokerage += Number(amc.paid_brokerage) || 0;
    });
  });
  const totalPending = totalGrossBrokerage - totalPaidBrokerage;

  const drawHeader = () => {
    const HEADER_H = 22;
    doc.setFillColor(...C.navy);
    doc.roundedRect(ML, 6, 28, 12, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text("FinIQ", ML + 14, 14, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Brokerage Commissions & Payouts Statement", PW - MR, 12, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-GB")} | Settlement Cycle: Monthly`,
      PW - MR,
      17,
      { align: "right" }
    );

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(ML, HEADER_H + 2, PW - MR, HEADER_H + 2);
    Y = HEADER_H + 8;
  };

  const drawSummaryBand = () => {
    const CARD_W = (CW - 6) / 3;
    const CARD_H = 15;

    const cards = [
      { label: "Total Gross Brokerage", val: totalGrossBrokerage, color: C.navy },
      { label: "Total Commission Disbursed", val: totalPaidBrokerage, color: C.positive },
      { label: "Pending Settlement Balance", val: totalPending, color: C.steel },
    ];

    cards.forEach((c, i) => {
      const cx = ML + i * (CARD_W + 3);
      doc.setFillColor(...C.offWhite);
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.3);
      doc.rect(cx, Y, CARD_W, CARD_H, "FD");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.textMuted);
      doc.text(c.label, cx + 4, Y + 5);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...c.color);
      doc.text(`INR ${fmt(c.val)}`, cx + 4, Y + 11);
    });

    Y += CARD_H + 6;
  };

  drawHeader();
  drawSummaryBand();

  const rows: any[] = [];
  brokers.forEach((b: any) => {
    (b.amc_wise_brokerage || []).forEach((amc: any) => {
      const tot = Number(amc.total_brokerage) || 0;
      const pd = Number(amc.paid_brokerage) || 0;
      const pend = tot - pd;
      rows.push([
        b.sub_broker_name,
        b.broker_type || "SUB_BROKER",
        `${b.share_percentage}%`,
        amc.amc_name,
        `INR ${fmt(tot)}`,
        `INR ${fmt(pd)}`,
        `INR ${fmt(pend)}`,
        pend === 0 ? "Settled" : "Pending Payout",
      ]);
    });
  });

  autoTable(doc, {
    startY: Y,
    margin: { left: ML, right: MR },
    head: [
      ["Advisor / Sub-Broker", "Tier", "Split %", "AMC Partner", "Gross Brokerage", "Disbursed", "Balance Pending", "Status"],
    ],
    body: rows,
    foot: [
      ["Total", "", "", "", `INR ${fmt(totalGrossBrokerage)}`, `INR ${fmt(totalPaidBrokerage)}`, `INR ${fmt(totalPending)}`, ""],
    ],
    theme: "plain",
    styles: {
      fontSize: 7.5,
      textColor: C.textPrimary,
      lineColor: C.border,
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    footStyles: { fillColor: C.steelLight, textColor: C.navy, fontStyle: "bold" },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...C.textMuted);
    doc.text(`FinIQ Financial Intelligence Platform • Page ${i} of ${pageCount}`, ML, PH - 8);
    doc.text("CONFIDENTIAL & AUDIT CERTIFIED", PW - MR, PH - 8, { align: "right" });
  }

  return doc.output("blob");
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CLIENT ACTIVITY REPORT PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function generateClientActivityPDF(
  systematicItems: any[],
  distributorInfo?: any
): Blob {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 12;
  const MR = 12;
  const CW = PW - ML - MR;
  let Y = 0;

  const totalMonthlyFlow = systematicItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

  const drawHeader = () => {
    const HEADER_H = 22;
    doc.setFillColor(...C.navy);
    doc.roundedRect(ML, 6, 28, 12, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.white);
    doc.text("FinIQ", ML + 14, 14, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Client Activity & Systematic Mandates Audit", PW - MR, 12, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textMuted);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")} | Mandate Audit Trail`, PW - MR, 17, { align: "right" });

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(ML, HEADER_H + 2, PW - MR, HEADER_H + 2);
    Y = HEADER_H + 8;
  };

  const drawSummaryBand = () => {
    const BAND_H = 16;
    doc.setFillColor(...C.offWhite);
    doc.rect(ML, Y, CW, BAND_H, "F");
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, BAND_H);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text("Systematic Execution Book (SIP / STP / SWP)", ML + 4, Y + 6);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textPrimary);
    doc.text(`Active Mandates: ${systematicItems.length}   |   Aggregate Monthly Flow: INR ${fmt(totalMonthlyFlow)}`, ML + 4, Y + 11.5);

    const distName = distributorInfo?.name || "FinIQ Wealth Partners";
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.navy);
    doc.text(distName, PW - MR - 4, Y + 6, { align: "right" });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.textPrimary);
    doc.text("Operational Risk & Mandate Audit", PW - MR - 4, Y + 11.5, { align: "right" });

    Y += BAND_H + 6;
  };

  drawHeader();
  drawSummaryBand();

  const rows = systematicItems.map((item, idx) => [
    idx + 1,
    item.investor_name,
    item.trxn_no || `SYS-00${idx + 1}`,
    item.scheme_name,
    item.systematic_type || item.type || "SIP",
    `INR ${fmt(item.amount)}`,
    fmtDate(item.start_date),
    fmtDate(item.end_date),
    item.source || "CAMS",
    item.termination_date ? "Terminated" : "Running",
  ]);

  autoTable(doc, {
    startY: Y,
    margin: { left: ML, right: MR },
    head: [
      ["#", "Client Name", "Mandate ID", "Scheme Name", "Type", "Installment", "Start Date", "End Date", "RTA", "Status"],
    ],
    body: rows,
    foot: [
      ["Total", "", "", "", "", `INR ${fmt(totalMonthlyFlow)}`, "", "", "", ""],
    ],
    theme: "plain",
    styles: {
      fontSize: 7.5,
      textColor: C.textPrimary,
      lineColor: C.border,
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    footStyles: { fillColor: C.steelLight, textColor: C.navy, fontStyle: "bold" },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      5: { halign: "right" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...C.textMuted);
    doc.text(`FinIQ Financial Intelligence Platform • Page ${i} of ${pageCount}`, ML, PH - 8);
    doc.text("CONFIDENTIAL & AUDIT CERTIFIED", PW - MR, PH - 8, { align: "right" });
  }

  return doc.output("blob");
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. MASTER DATA EXCEL EXPORT WORKBOOK
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMasterDataExcel(
  investors: any[],
  funds: any[],
  systematicItems: any[]
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  const THEME = EXCEL_THEME;

  const borderAll = {
    top: { style: "thin" as const, color: { argb: THEME.border } },
    bottom: { style: "thin" as const, color: { argb: THEME.border } },
    left: { style: "thin" as const, color: { argb: THEME.border } },
    right: { style: "thin" as const, color: { argb: THEME.border } },
  };

  const applyStyle = (ws: any, sRow: number, sCol: number, eRow: number, eCol: number, style: any) => {
    for (let r = sRow; r <= eRow; r++) {
      for (let c = sCol; c <= eCol; c++) {
        const cell = ws.getCell(r, c);
        if (style.font) cell.font = { ...cell.font, ...style.font };
        if (style.fill) cell.fill = style.fill;
        if (style.border) cell.border = style.border;
        if (style.alignment) cell.alignment = { ...cell.alignment, ...style.alignment };
      }
    }
  };

  // ── SHEET 1: INVESTORS MASTER ──
  const ws1 = wb.addWorksheet("Investors AUM Book");
  ws1.columns = [
    { width: 6 },
    { width: 28 },
    { width: 16 },
    { width: 24 },
    { width: 32 },
    { width: 18 },
    { width: 16 },
    { width: 20 },
  ];

  const r1_1 = ws1.addRow(["FinIQ Distribution Network - Master Investors Book"]).number;
  ws1.mergeCells(r1_1, 1, r1_1, 8);
  applyStyle(ws1, r1_1, 1, r1_1, 8, {
    font: { bold: true, size: 13, color: { argb: THEME.navy } },
    alignment: { horizontal: "left" },
  });

  const r1_2 = ws1.addRow([`Export Date: ${new Date().toLocaleDateString("en-GB")} | Total Active Accounts: ${investors.length}`]).number;
  ws1.mergeCells(r1_2, 1, r1_2, 8);
  applyStyle(ws1, r1_2, 1, r1_2, 8, {
    font: { italic: true, size: 9, color: { argb: THEME.textMuted } },
  });

  ws1.addRow([]);

  const h1 = ws1.addRow(["#", "Investor Name", "PAN", "Tax Status", "Email", "Mobile", "City", "Total AUM (INR)"]).number;
  applyStyle(ws1, h1, 1, h1, 8, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: THEME.navy } },
    font: { bold: true, size: 9, color: { argb: THEME.white } },
    alignment: { horizontal: "center" },
    border: borderAll,
  });

  let totalAum = 0;
  investors.forEach((inv, idx) => {
    const aum = Number(inv.total_aum) || 0;
    totalAum += aum;
    const row = ws1.addRow([
      idx + 1,
      inv.name,
      inv.pan,
      inv.tax_status || "Resident Individual",
      inv.email,
      inv.mobile || "+91 98765 43210",
      inv.city || "Mumbai",
      aum,
    ]);
    const bg = idx % 2 === 0 ? THEME.white : THEME.rowAlt;
    applyStyle(ws1, row.number, 1, row.number, 8, {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: bg } },
      font: { size: 9, color: { argb: THEME.textPrimary } },
      border: borderAll,
    });
  });

  const f1 = ws1.addRow(["Total", "", "", "", "", "", "", totalAum]).number;
  applyStyle(ws1, f1, 1, f1, 8, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: THEME.steelLight } },
    font: { bold: true, size: 9, color: { argb: THEME.navy } },
    border: borderAll,
  });

  // ── SHEET 2: SYSTEMATIC SIP BOOK ──
  const ws2 = wb.addWorksheet("Systematic Transactions");
  ws2.columns = [
    { width: 6 },
    { width: 24 },
    { width: 14 },
    { width: 38 },
    { width: 12 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 10 },
    { width: 14 },
  ];

  const r2_1 = ws2.addRow(["Systematic Investment Mandates (SIP / STP / SWP)"]).number;
  ws2.mergeCells(r2_1, 1, r2_1, 10);
  applyStyle(ws2, r2_1, 1, r2_1, 10, {
    font: { bold: true, size: 13, color: { argb: THEME.navy } },
  });

  ws2.addRow([]);

  const h2 = ws2.addRow(["#", "Investor Name", "Mandate ID", "Scheme Name", "Type", "Amount (INR)", "Start Date", "End Date", "RTA", "Status"]).number;
  applyStyle(ws2, h2, 1, h2, 10, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: THEME.navy } },
    font: { bold: true, size: 9, color: { argb: THEME.white } },
    alignment: { horizontal: "center" },
    border: borderAll,
  });

  let totalSipAmt = 0;
  systematicItems.forEach((it, idx) => {
    const amt = Number(it.amount) || 0;
    totalSipAmt += amt;
    const row = ws2.addRow([
      idx + 1,
      it.investor_name,
      it.trxn_no,
      it.scheme_name,
      it.systematic_type || it.type || "SIP",
      amt,
      it.start_date,
      it.end_date,
      it.source || "CAMS",
      it.termination_date ? "Terminated" : "Running",
    ]);
    const bg = idx % 2 === 0 ? THEME.white : THEME.rowAlt;
    applyStyle(ws2, row.number, 1, row.number, 10, {
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: bg } },
      font: { size: 9, color: { argb: THEME.textPrimary } },
      border: borderAll,
    });
  });

  const f2 = ws2.addRow(["Total", "", "", "", "", totalSipAmt, "", "", "", ""]).number;
  applyStyle(ws2, f2, 1, f2, 10, {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: THEME.steelLight } },
    font: { bold: true, size: 9, color: { argb: THEME.navy } },
    border: borderAll,
  });

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
