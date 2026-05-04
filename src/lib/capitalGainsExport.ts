import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS  (finance-grade: Navy / Steel-Blue / White palette)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  navy:        [15,  40,  80]  as [number, number, number], // #0F2850 – primary brand
  navyMid:     [25,  65,  120] as [number, number, number], // #19417E – section headers
  steel:       [52,  100, 163] as [number, number, number], // #3464A3 – sub-headers
  steelLight:  [220, 232, 247] as [number, number, number], // #DCE8F7 – light fill
  accent:      [0,   122, 204] as [number, number, number], // #007ACC – highlights
  positive:    [14,  120, 80]  as [number, number, number], // #0E7850 – gains
  negative:    [180, 35,  35]  as [number, number, number], // #B42323 – losses
  white:       [255, 255, 255] as [number, number, number],
  offWhite:    [248, 250, 253] as [number, number, number], // #F8FAFD
  border:      [200, 215, 235] as [number, number, number], // light blue-grey border
  textPrimary: [18,  25,  40]  as [number, number, number], // near-black
  textMuted:   [100, 115, 140] as [number, number, number], // muted grey-blue
  rowAlt:      [245, 248, 254] as [number, number, number], // alternating row tint
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (num: any): string => {
  const val = Number(num);
  return isNaN(val) ? '0.00' : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (d: any): string => {
  if (!d || d === 'N/A') return '—';
  try { return new Date(d).toLocaleDateString('en-GB'); } catch { return '—'; }
};

const plColor = (val: number): [number, number, number] =>
  val >= 0 ? C.positive : C.negative;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
export const exportCapitalGains = (
  format: 'pdf' | 'excel',
  data: any,
  fy: string,
  distributorInfo: any,
) => {
  if (format === 'excel') {
    generateExcel(data, fy);
  } else {
    generatePDF(data, fy, distributorInfo);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  EXCEL GENERATOR
// ═════════════════════════════════════════════════════════════════════════════
const generateExcel = (data: any, fy: string) => {
  const wb = XLSX.utils.book_new();

  // ── Transactions sheet ───────────────────────────────────────────────────
  const txHeaders = [
    'Fund Name', 'Folio', 'Asset Class',
    'Sell Date', 'Holding Days', 'Transaction Type',
    'Sell NAV', 'Sell Amount', 'STT & Others',
    'Pur. Date', 'Pur. NAV', 'Net Pur. Amount', 'Stamp Duty',
    'Cost of Acquisition', 'Short Term P&L', 'Long Term P&L',
  ];

  const txRows = data.mutualFunds.flatMap((mf: any) =>
    mf.transactions.map((tx: any) => [
      mf.fundName, mf.folioNo, mf.assetClass,
      fmtDate(tx.sellDate), tx.holdingDays, tx.transactionType,
      tx.sellNav, tx.sellAmount, tx.sttAndOthers,
      fmtDate(tx.purchaseDate), tx.purchaseNav, tx.netPurchaseAmount,
      tx.stampDuty, tx.costAcquisition, tx.shortTermPL, tx.longTermPL,
    ]),
  );

  const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  // Column widths
  wsTx['!cols'] = [
    { wch: 40 }, { wch: 16 }, { wch: 12 },
    { wch: 12 }, { wch: 13 }, { wch: 16 },
    { wch: 10 }, { wch: 13 }, { wch: 12 },
    { wch: 12 }, { wch: 10 }, { wch: 15 },
    { wch: 11 }, { wch: 18 }, { wch: 15 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

  // ── Summary sheet ────────────────────────────────────────────────────────
  const summaryRows = [
    [`Capital Gains Summary — FY ${fy.replace('-', ' - ')}`],
    [],
    ['Investor Name', data.investorDetails.name],
    ['PAN', data.investorDetails.pan],
    ['Report Date', new Date().toLocaleDateString('en-GB')],
    [],
    ['', 'Short Term (₹)', 'Long Term (₹)', 'Total (₹)'],
    [
      'Capital Gains',
      data.capitalGainSummary.shortTerm,
      data.capitalGainSummary.longTerm,
      data.capitalGainSummary.total,
    ],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  XLSX.writeFile(
    wb,
    `Capital_Gains_${data.investorDetails.name.replace(/[^a-z0-9]/gi, '_')}_${fy}.xlsx`,
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  PDF GENERATOR  (landscape A4)
// ═════════════════════════════════════════════════════════════════════════════
const generatePDF = (data: any, fy: string, distributorInfo: any) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const inv   = data.investorDetails;
  const PW    = doc.internal.pageSize.getWidth();   // 297
  const PH    = doc.internal.pageSize.getHeight();  // 210
  const ML    = 12;   // margin-left
  const MR    = 12;   // margin-right
  const CW    = PW - ML - MR;  // content width
  let Y       = 0;

  // ── PAGE BREAK HELPER ───────────────────────────────────────────────────
  const needsPage = (h: number) => {
    if (Y + h > PH - 18) {
      doc.addPage();
      drawPageBorder();
      Y = 16;
      return true;
    }
    return false;
  };

  // ── PAGE BORDER (subtle) ────────────────────────────────────────────────
  const drawPageBorder = () => {
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.rect(7, 7, PW - 14, PH - 14);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  HEADER BAND  (full-width navy bar)
  // ─────────────────────────────────────────────────────────────────────────
  const drawHeader = () => {
    const HEADER_H = 22;

    // Navy background bar
    doc.setFillColor(...C.navy);
    doc.rect(0, 0, PW, HEADER_H, 'F');

    // ── LOGO REGION ──────────────────────────────────────────────────────
    // TODO: Replace the placeholder rectangle below with your actual company logo.
    //       To add a logo image, use:
    //         doc.addImage(logoBase64, 'PNG', 10, 3, 22, 16);
    //       where logoBase64 is your image encoded as a base64 string.
    //       Recommended size: ~22mm wide, ~16mm tall, with transparent/white background.
    // ─────────────────────────────────────────────────────────────────────
    doc.setFillColor(255, 255, 255, 30); // translucent white placeholder
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.rect(10, 3, 24, 16);
    doc.setFontSize(5.5);
    doc.setTextColor(200, 215, 235);
    doc.text('LOGO HERE', 22, 12, { align: 'center' });
    // ─────────────────────────────────────────────────────────────────────

    // Distributor name (centre-ish)
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text(distributorInfo.name, PW / 2, 10, { align: 'center' });

    // Sub-line
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.steelLight);
    const subLine = `${distributorInfo.address}  |  ${distributorInfo.email}  |  ${distributorInfo.phone}`;
    doc.text(subLine, PW / 2, 15, { align: 'center' });

    // Report title (right side)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.steelLight);
    doc.text('Capital Gain Detail Report', PW - MR, 10, { align: 'right' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const reportMeta = `FY: ${fy.replace('-', ' – ')}  |  Generated: ${new Date().toLocaleDateString('en-GB')}`;
    doc.text(reportMeta, PW - MR, 15, { align: 'right' });

    Y = HEADER_H + 2;
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  INVESTOR INFO BAND
  // ─────────────────────────────────────────────────────────────────────────
  const drawInvestorBand = () => {
    const BAND_H = 18;
    doc.setFillColor(...C.steelLight);
    doc.rect(ML, Y, CW, BAND_H, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, BAND_H);

    // Left column
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.navy);
    doc.text(`${inv.name.toUpperCase()}`, ML + 4, Y + 5.5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textPrimary);
    doc.text(`PAN: ${inv.pan}`, ML + 4, Y + 10);
    doc.text(`${inv.address}`, ML + 4, Y + 14.5);

    // Right column
    doc.setFontSize(7.5);
    doc.setTextColor(...C.textPrimary);
    doc.text(`Mobile: ${inv.mobile}`, PW - MR - 4, Y + 6, { align: 'right' });
    doc.text(`Email: ${inv.email}`, PW - MR - 4, Y + 10.5, { align: 'right' });

    Y += BAND_H + 5;
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  SECTION GROUP TITLE  (e.g. "EQUITY FUNDS")
  // ─────────────────────────────────────────────────────────────────────────
  const drawGroupTitle = (title: string) => {
    needsPage(12);
    doc.setFillColor(...C.navyMid);
    doc.rect(ML, Y, CW, 8, 'F');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text(title, ML + 4, Y + 5.5);

    Y += 10;
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  FUND HEADER CARD  (individual fund info row)
  // ─────────────────────────────────────────────────────────────────────────
  const drawFundCard = (mf: any, idx: number) => {
    needsPage(12);
    doc.setFillColor(...C.offWhite);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.rect(ML, Y, CW, 10, 'FD');

    // Left accent stripe
    doc.setFillColor(...C.steel);
    doc.rect(ML, Y, 2, 10, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.navy);
    doc.text(`${idx + 1}. ${mf.fundName}`, ML + 5, Y + 4);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textMuted);
    doc.text(
      `Folio: ${mf.folioNo}  |  ISIN: ${mf.isin}  |  Asset Class: ${mf.assetClass}`,
      ML + 5, Y + 8,
    );

    Y += 11;
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  FUND TRANSACTION TABLE
  // ─────────────────────────────────────────────────────────────────────────
  const drawFundTable = (mf: any) => {
    let totalSell = 0, totalPur = 0, totalST = 0, totalLT = 0;

    const rows = mf.transactions.map((tx: any, i: number) => {
      totalSell += Number(tx.sellAmount  || 0);
      totalPur  += Number(tx.netPurchaseAmount || 0);
      totalST   += Number(tx.shortTermPL || 0);
      totalLT   += Number(tx.longTermPL  || 0);

      const stVal = Number(tx.shortTermPL || 0);
      const ltVal = Number(tx.longTermPL  || 0);

      return [
        fmtDate(tx.sellDate),
        tx.holdingDays ?? '—',
        tx.transactionType || 'Redemption',
        fmt(tx.sellNav),
        fmt(tx.sellAmount),
        fmt(tx.sttAndOthers),
        fmtDate(tx.purchaseDate),
        'Fresh',
        fmt(tx.purchaseNav),
        fmt(tx.netPurchaseAmount),
        fmt(tx.stampDuty),
        fmt(tx.costAcquisition),
        fmt(stVal),
        fmt(ltVal),
      ];
    });

    // Total row
    rows.push([
      { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' as const, fillColor: C.steelLight, textColor: C.navy } },
      { content: fmt(totalSell), styles: { fontStyle: 'bold', halign: 'right' as const, fillColor: C.steelLight, textColor: C.navy } },
      { content: '', styles: { fillColor: C.steelLight } },
      { content: '', colSpan: 3, styles: { fillColor: C.steelLight } },
      { content: fmt(totalPur), styles: { fontStyle: 'bold', halign: 'right' as const, fillColor: C.steelLight, textColor: C.navy } },
      { content: '', styles: { fillColor: C.steelLight } },
      { content: '', styles: { fillColor: C.steelLight } },
      { content: fmt(totalST), styles: { fontStyle: 'bold', halign: 'right' as const, fillColor: C.steelLight, textColor: totalST >= 0 ? C.positive : C.negative } },
      { content: fmt(totalLT), styles: { fontStyle: 'bold', halign: 'right' as const, fillColor: C.steelLight, textColor: totalLT >= 0 ? C.positive : C.negative } },
    ]);

    autoTable(doc, {
      startY: Y,
      margin: { left: ML, right: MR },
      head: [
        // Tier-1 super-header
        [
          { content: 'Withdrawal', colSpan: 6, styles: { halign: 'center', fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 7 } },
          { content: 'Corresponding Subscription', colSpan: 5, styles: { halign: 'center', fillColor: C.navyMid, textColor: C.white, fontStyle: 'bold', fontSize: 7 } },
          { content: 'Grandfathered Value (31-01-2018)', colSpan: 1, styles: { halign: 'center', fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 6.5 } },
          { content: 'Profit & Loss', colSpan: 2, styles: { halign: 'center', fillColor: C.navyMid, textColor: C.white, fontStyle: 'bold', fontSize: 7 } },
        ],
        // Tier-2 column headers
        [
          'Sell Date', 'Hold\nDays', 'Txn\nType', 'Sell\nNAV', 'Sell\nAmt', 'STT &\nOthers',
          'Pur.\nDate', 'Txn\nType', 'Pur.\nNAV', 'Net Pur.\nAmt', 'Stamp\nDuty',
          'Cost\nAcqn.',
          'Short\nTerm', 'Long\nTerm',
        ],
      ],
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 6.5,
        cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
        lineColor: C.border,
        lineWidth: 0.15,
        textColor: C.textPrimary,
        font: 'helvetica',
      },
      headStyles: {
        textColor: C.white,
        halign: 'center',
        valign: 'middle',
        fontStyle: 'bold',
        fillColor: C.steel,  // fallback; overridden by cell-level styles above
        minCellHeight: 6,
      },
      alternateRowStyles: { fillColor: C.rowAlt },
      columnStyles: {
        0:  { halign: 'center' },
        1:  { halign: 'center' },
        2:  { halign: 'center' },
        3:  { halign: 'right' },
        4:  { halign: 'right' },
        5:  { halign: 'right' },
        6:  { halign: 'center' },
        7:  { halign: 'center' },
        8:  { halign: 'right' },
        9:  { halign: 'right' },
        10: { halign: 'right' },
        11: { halign: 'right' },
        12: { halign: 'right' },
        13: { halign: 'right' },
      },
      // Colour P&L cells dynamically
      didParseCell: (hookData) => {
        const { section, column, cell, row } = hookData;
        if (section === 'body' && row.index < rows.length - 1) {
          if (column.index === 12 || column.index === 13) {
            const rawVal = Number(String(cell.raw).replace(/,/g, ''));
            if (!isNaN(rawVal)) {
              cell.styles.textColor = rawVal >= 0 ? C.positive : C.negative;
            }
          }
        }
      },
    });

    Y = (doc as any).lastAutoTable.finalY + 6;
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  SUMMARY TABLE
  // ─────────────────────────────────────────────────────────────────────────
  const drawSummaryTable = () => {
    needsPage(50);

    // Section label
    doc.setFillColor(...C.navy);
    doc.rect(ML, Y, CW, 8, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text('Mutual Funds — Period-Wise Capital Gain Summary', ML + 4, Y + 5.5);
    Y += 10;

    autoTable(doc, {
      startY: Y,
      margin: { left: ML, right: MR },
      head: [
        [
          { content: 'Investor Name', rowSpan: 2, styles: { valign: 'middle', fillColor: C.navy, textColor: C.white } },
          { content: 'Type', rowSpan: 2, styles: { valign: 'middle', fillColor: C.navy, textColor: C.white } },
          { content: 'Short Term', colSpan: 3, styles: { halign: 'center', fillColor: C.navyMid, textColor: C.white } },
          { content: 'Long Term', colSpan: 4, styles: { halign: 'center', fillColor: C.steel, textColor: C.white } },
        ],
        [
          // Short Term sub-cols
          { content: 'Buy Value', styles: { fillColor: C.navyMid, textColor: C.white } },
          { content: 'Sell Value', styles: { fillColor: C.navyMid, textColor: C.white } },
          { content: 'P&L', styles: { fillColor: C.navyMid, textColor: C.white } },
          // Long Term sub-cols
          { content: 'Buy Value', styles: { fillColor: C.steel, textColor: C.white } },
          { content: 'Sell Value', styles: { fillColor: C.steel, textColor: C.white } },
          { content: 'Cost Acqn.', styles: { fillColor: C.steel, textColor: C.white } },
          { content: 'P&L', styles: { fillColor: C.steel, textColor: C.white } },
        ],
      ],
      body: [[
        inv.name,
        'Purchase on/after 31-Jan-2018',
        fmt(data.capitalGainSummary.shortTerm),   // buy value (approx)
        fmt(data.capitalGainSummary.shortTerm),   // sell value placeholder
        fmt(data.capitalGainSummary.shortTerm),
        fmt(data.capitalGainSummary.longTerm),    // buy value placeholder
        fmt(data.capitalGainSummary.longTerm),    // sell value placeholder
        '0.00',
        fmt(data.capitalGainSummary.longTerm),
      ]],
      theme: 'grid',
      styles: { fontSize: 7, halign: 'right', cellPadding: 2, lineColor: C.border, lineWidth: 0.15 },
      headStyles: { fontStyle: 'bold', fontSize: 7, halign: 'center', valign: 'middle' },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'left' },
      },
    });

    Y = (doc as any).lastAutoTable.finalY + 8;
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  TAXES TABLE (optional – matches reference report page 2)
  // ─────────────────────────────────────────────────────────────────────────
  const drawTaxesTable = () => {
    needsPage(40);

    doc.setFillColor(...C.navy);
    doc.rect(ML, Y, CW, 8, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text(`Mutual Funds Other Taxes Details — FY ${fy.replace('-', ' – ')}`, ML + 4, Y + 5.5);
    Y += 10;

    autoTable(doc, {
      startY: Y,
      margin: { left: ML, right: MR },
      head: [[
        { content: 'Investor Name', rowSpan: 2, styles: { valign: 'middle', fillColor: C.navy, textColor: C.white } },
        { content: 'Type', rowSpan: 2, styles: { valign: 'middle', fillColor: C.navy, textColor: C.white } },
        { content: 'Short Term — Quarter-wise', colSpan: 5, styles: { halign: 'center', fillColor: C.navyMid, textColor: C.white } },
        { content: 'Long Term — Quarter-wise', colSpan: 5, styles: { halign: 'center', fillColor: C.steel, textColor: C.white } },
        { content: 'Total', rowSpan: 2, styles: { valign: 'middle', halign: 'center', fillColor: C.navy, textColor: C.white } },
      ], [
        'Upto 15-6', '16-6 to 15-9', '16-9 to 15-12', '16-12 to 15-3', '16-3 to 31-3',
        'Upto 15-6', '16-6 to 15-9', '16-9 to 15-12', '16-12 to 15-3', '16-3 to 31-3',
      ]],
      body: [[
        inv.name,
        'Purchase on/after 31-Jan-2018',
        '0.00', fmt(data.capitalGainSummary.shortTerm), '0.00', '0.00', '0.00',
        '0.00', '0.00', '0.00', '0.00', '0.00',
        fmt(data.capitalGainSummary.shortTerm + data.capitalGainSummary.longTerm),
      ]],
      theme: 'grid',
      styles: { fontSize: 6.5, halign: 'right', cellPadding: 1.8, lineColor: C.border, lineWidth: 0.15 },
      headStyles: { fontStyle: 'bold', fontSize: 6.5, halign: 'center', valign: 'middle' },
      columnStyles: { 0: { halign: 'left' }, 1: { halign: 'left' } },
    });

    Y = (doc as any).lastAutoTable.finalY + 8;
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  PAGE FOOTER  (page number + disclaimer)
  // ─────────────────────────────────────────────────────────────────────────
  const drawFooters = () => {
    const total = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);

      // Footer bar
      doc.setFillColor(...C.navy);
      doc.rect(0, PH - 13, PW, 13, 'F');

      // Disclaimer text
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(190, 210, 240);
      const disclaimer =
        'Disclaimer: We are not tax consultants and nor do we provide any tax or legal advice. ' +
        'Please consult your own tax or professional advisors for any tax or legal matter. ' +
        'The Company or its employees accept no responsibility for any loss suffered as a result of information contained in this report.';
      const lines = doc.splitTextToSize(disclaimer, PW - 40);
      doc.text(lines, ML, PH - 8.5);

      // Page number (right)
      doc.setFontSize(7);
      doc.setTextColor(...C.steelLight);
      doc.text(`Page ${i} of ${total}`, PW - MR, PH - 7, { align: 'right' });

      // Page border
      drawPageBorder();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  ASSEMBLE DOCUMENT
  // ─────────────────────────────────────────────────────────────────────────

  // Page 1
  drawPageBorder();
  drawHeader();
  drawInvestorBand();

  // Group & render funds
  const equityFunds = data.mutualFunds.filter(
    (mf: any) => String(mf.assetClass).toLowerCase().includes('equity'),
  );
  const debtFunds = data.mutualFunds.filter(
    (mf: any) => String(mf.assetClass).toLowerCase().includes('debt'),
  );
  const otherFunds = data.mutualFunds.filter(
    (mf: any) =>
      !String(mf.assetClass).toLowerCase().includes('equity') &&
      !String(mf.assetClass).toLowerCase().includes('debt'),
  );

  const renderGroup = (title: string, funds: any[]) => {
    if (funds.length === 0) return;
    drawGroupTitle(title);
    funds.forEach((mf, i) => {
      drawFundCard(mf, i);
      drawFundTable(mf);
    });
  };

  renderGroup('EQUITY FUNDS', equityFunds);
  renderGroup('DEBT FUNDS', debtFunds);
  if (otherFunds.length > 0) renderGroup('OTHER FUNDS', otherFunds);

  // Summary page
  doc.addPage();
  drawPageBorder();
  drawHeader();
  Y = 26;
  drawSummaryTable();
  drawTaxesTable();

  // ── STAMP DUTY / STT CHARGES TABLE ─────────────────────────────────────
  // TODO: If your backend returns a per-fund charges breakdown, map it here.
  //       Currently this table is omitted. To add it, uncomment the block
  //       below and populate `chargeRows` from your data source.
  //
  // const chargeRows = data.mutualFunds.map((mf: any) => [
  //   inv.name, mf.fundName, mf.folioNo,
  //   fmt(mf.stampDutyTotal), fmt(mf.sttTotal), '0.00',
  // ]);
  //
  // autoTable(doc, {
  //   startY: Y,
  //   margin: { left: ML, right: MR },
  //   head: [['Investor Name', 'Fund Name', 'Folio Number', 'Stamp Duty', 'STT & Others', 'TDS & Other Charges']],
  //   body: chargeRows,
  //   theme: 'grid',
  //   styles: { fontSize: 7 },
  //   headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold' },
  // });
  // Y = (doc as any).lastAutoTable.finalY + 8;
  // ─────────────────────────────────────────────────────────────────────────

  // Footers on every page (must be last)
  drawFooters();

  doc.save(
    `Capital_Gains_${inv.name.replace(/[^a-z0-9]/gi, '_')}_${fy}.pdf`,
  );
};