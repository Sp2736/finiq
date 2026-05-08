import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS  (finance-grade: Navy / Steel-Blue / White palette)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  navy:        [15,  40,  80]  as [number, number, number], 
  navyMid:     [25,  65,  120] as [number, number, number], 
  steel:       [52,  100, 163] as [number, number, number], 
  steelLight:  [220, 232, 247] as [number, number, number], 
  accent:      [0,   122, 204] as [number, number, number], 
  positive:    [14,  120, 80]  as [number, number, number], 
  negative:    [180, 35,  35]  as [number, number, number], 
  white:       [255, 255, 255] as [number, number, number],
  offWhite:    [248, 250, 253] as [number, number, number], 
  border:      [200, 215, 235] as [number, number, number], 
  textPrimary: [18,  25,  40]  as [number, number, number], 
  textMuted:   [100, 115, 140] as [number, number, number], 
  rowAlt:      [245, 248, 254] as [number, number, number], 
};

const fmt = (num: any): string => {
  const val = Number(num);
  return isNaN(val) ? '0.00' : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (d: any): string => {
  if (!d || d === 'N/A') return '—';
  try { return new Date(d).toLocaleDateString('en-GB'); } catch { return '—'; }
};

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
  const inv = data.investorDetails;

  // Dedicated HEX Theme for Excel cell styling (Compatible with xlsx-js-style)
  const THEME = {
    navy: "0F2850",
    navyMid: "194178",
    steel: "3464A3",
    steelLight: "DCE8F7",
    positive: "0E7850",
    negative: "DC2626", // Bright Red for Disclaimer
    white: "FFFFFF",
    offWhite: "F8FAFD",
    textPrimary: "121928",
    textMuted: "64738C"
  };

  const borderAll = {
    top: { style: "thin", color: { rgb: "C8D7EB" } },
    bottom: { style: "thin", color: { rgb: "C8D7EB" } },
    left: { style: "thin", color: { rgb: "C8D7EB" } },
    right: { style: "thin", color: { rgb: "C8D7EB" } }
  };

  const createSheet = (sheetName: string, funds: any[], isEquity: boolean) => {
    const sheetData: any[] = [];
    const merges: XLSX.Range[] = [];
    const stylesMap: { r: number; c: number; s: any }[] = [];
    
    const setS = (rowIdx: number, colIdx: number, style: any) => {
      stylesMap.push({ r: rowIdx, c: colIdx, s: style });
    };

    let r = 0; // Row Tracker

    // --- Header & Report Metadata (Right Aligned) ---
    sheetData.push(['Capital Gain Detail Report', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    merges.push({ s: { r, c: 0 }, e: { r, c: 14 } });
    setS(r, 0, { font: { bold: true, sz: 14, color: { rgb: THEME.navy } }, alignment: { horizontal: "right" } });
    r++;

    const reportMeta = `FY: ${fy.replace('-', ' – ')}  |  Generated: ${new Date().toLocaleDateString('en-GB')}`;
    sheetData.push([reportMeta, '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    merges.push({ s: { r, c: 0 }, e: { r, c: 14 } });
    setS(r, 0, { font: { italic: true, sz: 10, color: { rgb: THEME.textMuted } }, alignment: { horizontal: "right" } });
    r++;

    sheetData.push([]); r++;

    // --- Investor Details Band ---
    sheetData.push([inv.name.toUpperCase(), '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    merges.push({ s: { r, c: 0 }, e: { r, c: 14 } });
    setS(r, 0, { fill: { fgColor: { rgb: THEME.offWhite } }, font: { bold: true, sz: 11, color: { rgb: THEME.navy } }, alignment: { horizontal: "left" }, border: { top: borderAll.top, left: borderAll.left, right: borderAll.right } });
    const invBandStartRow = r;
    r++;

    sheetData.push([`PAN: ${inv.pan}`, '', '', '', '', '', '', '', '', '', '', '', '', `Mobile: ${inv.mobile}`, '']);
    merges.push({ s: { r, c: 0 }, e: { r, c: 12 } });
    merges.push({ s: { r, c: 13 }, e: { r, c: 14 } });
    setS(r, 0, { fill: { fgColor: { rgb: THEME.offWhite } }, font: { sz: 9, color: { rgb: THEME.textPrimary } }, alignment: { horizontal: "left" }, border: { left: borderAll.left } });
    setS(r, 13, { fill: { fgColor: { rgb: THEME.offWhite } }, font: { sz: 9, color: { rgb: THEME.textPrimary } }, alignment: { horizontal: "right" }, border: { right: borderAll.right } });
    r++;

    sheetData.push([inv.address, '', '', '', '', '', '', '', '', '', '', '', '', `Email: ${inv.email}`, '']);
    merges.push({ s: { r, c: 0 }, e: { r, c: 12 } });
    merges.push({ s: { r, c: 13 }, e: { r, c: 14 } });
    setS(r, 0, { fill: { fgColor: { rgb: THEME.offWhite } }, font: { sz: 9, color: { rgb: THEME.textPrimary } }, alignment: { horizontal: "left" }, border: { bottom: borderAll.bottom, left: borderAll.left } });
    setS(r, 13, { fill: { fgColor: { rgb: THEME.offWhite } }, font: { sz: 9, color: { rgb: THEME.textPrimary } }, alignment: { horizontal: "right" }, border: { bottom: borderAll.bottom, right: borderAll.right } });
    r++;

    sheetData.push([]); r++;

    // --- Mutual Funds Section ---
    if (funds.length > 0) {
      sheetData.push(['Mutual Funds']);
      merges.push({ s: { r, c: 0 }, e: { r, c: 14 } });
      setS(r, 0, { fill: { fgColor: { rgb: THEME.navy } }, font: { bold: true, color: { rgb: THEME.white }, sz: 12 }, alignment: { horizontal: "left" } });
      r++;
      sheetData.push([]); r++;

      funds.forEach((mf: any) => {
        const fundTitle = `${mf.fundName} | Folio No: ${mf.folioNo} | ISIN: ${mf.isin} | Asset Class: ${mf.assetClass}`;
        sheetData.push([fundTitle]);
        merges.push({ s: { r, c: 0 }, e: { r, c: 14 } });
        for(let c = 0; c <= 14; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.steelLight } }, font: { bold: true, color: { rgb: THEME.navy } }, border: borderAll });
        r++;
        
        sheetData.push([
          'Withdrawal', '', '', '', '', '', '', 
          'Corresponding Subscription', '', '', '', '', 
          'Grandfathered Value', 
          'Profit & Loss', ''
        ]);
        merges.push({ s: { r, c: 0 }, e: { r, c: 6 } }); 
        merges.push({ s: { r, c: 7 }, e: { r, c: 11 } }); 
        merges.push({ s: { r, c: 13 }, e: { r, c: 14 } }); 
        
        for(let c = 0; c <= 6; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.navy } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
        for(let c = 7; c <= 11; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.navyMid } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
        setS(r, 12, { fill: { fgColor: { rgb: THEME.navy } }, font: { bold: true, color: { rgb: THEME.white }, sz: 9 }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: borderAll });
        for(let c = 13; c <= 14; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.navyMid } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
        r++;

        sheetData.push([
          'Sell Date', 'Hold Days', 'Trxn Type', 'Units/Qty', 'Sell NAV', 'Sell Amount', 'STT & Others', 
          'Pur. Date', 'Trxn Type', 'Pur. NAV', 'Net Pur. Amount', 'Stamp Duty', 
          'Cost Acqn.', 
          'Short Term', 'Long Term'
        ]);
        for(let c = 0; c <= 14; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.steel } }, font: { bold: true, color: { rgb: THEME.white }, sz: 9 }, alignment: { horizontal: "center", wrapText: true }, border: borderAll });
        r++;

        let totalSell = 0, totalPur = 0, totalST = 0, totalLT = 0;

        mf.transactions.forEach((tx: any, idx: number) => {
          totalSell += Number(tx.sellAmount || 0);
          totalPur += Number(tx.netPurchaseAmount || 0);
          totalST += Number(tx.shortTermPL || 0);
          totalLT += Number(tx.longTermPL || 0);

          sheetData.push([
            fmtDate(tx.sellDate), tx.holdingDays ?? '—', tx.transactionType || 'Redemption', tx.units, tx.sellNav, tx.sellAmount, tx.sttAndOthers,
            fmtDate(tx.purchaseDate), 'Fresh', tx.purchaseNav, tx.netPurchaseAmount, tx.stampDuty, tx.costAcquisition,
            tx.shortTermPL, tx.longTermPL
          ]);
          
          const rowColor = idx % 2 === 0 ? THEME.white : THEME.offWhite;
          for(let c = 0; c <= 14; c++) {
             let cellStyle: any = { fill: { fgColor: { rgb: rowColor } }, border: borderAll, alignment: { horizontal: (c >= 3 && c !== 7 && c !== 8 ? "right" : "center") } };
             
             if (c === 13 || c === 14) {
                const val = c === 13 ? tx.shortTermPL : tx.longTermPL;
                if (Number(val) > 0) cellStyle.font = { color: { rgb: THEME.positive }, bold: true };
                else if (Number(val) < 0) cellStyle.font = { color: { rgb: THEME.negative }, bold: true };
             }
             setS(r, c, cellStyle);
          }
          r++;
        });

        sheetData.push(['TOTAL', '', '', '', '', totalSell, '', '', '', '', totalPur, '', '', totalST, totalLT]);
        merges.push({ s: { r, c: 0 }, e: { r, c: 4 } });
        for(let c = 0; c <= 14; c++) {
          setS(r, c, { fill: { fgColor: { rgb: THEME.steelLight } }, font: { bold: true, color: { rgb: THEME.navy } }, alignment: { horizontal: (c >= 5 ? "right" : "center") }, border: borderAll });
        }
        r++;
        sheetData.push([]); r++;
      });
    }

    if (isEquity) {
      // ─────────────────────────────────────────────────────────────
      // TABLE 1: Period-Wise Capital Gain Summary
      // ─────────────────────────────────────────────────────────────
      sheetData.push(['Mutual Funds — Period-Wise Capital Gain Summary']);
      merges.push({ s: { r, c: 0 }, e: { r, c: 8 } });
      setS(r, 0, { fill: { fgColor: { rgb: THEME.navy } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "left" } });
      r++;

      sheetData.push([
        'Investor Name', 'Type', 
        'Short Term', '', '', 
        'Long Term', '', '', ''
      ]);
      merges.push({ s: { r, c: 0 }, e: { r: r + 1, c: 0 } }); // Investor Name
      merges.push({ s: { r, c: 1 }, e: { r: r + 1, c: 1 } }); // Type
      merges.push({ s: { r, c: 2 }, e: { r, c: 4 } }); // Short Term
      merges.push({ s: { r, c: 5 }, e: { r, c: 8 } }); // Long Term

      for(let c = 0; c <= 1; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.navy } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      for(let c = 2; c <= 4; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.navyMid } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      for(let c = 5; c <= 8; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.steel } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      r++;

      sheetData.push([
        '', '', 
        'Buy Value', 'Sell Value', 'P&L', 
        'Buy Value', 'Sell Value', 'Cost Acqn.', 'P&L'
      ]);
      for(let c = 2; c <= 4; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.navyMid } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      for(let c = 5; c <= 8; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.steel } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      
      // Preserve borders for merged empty cells underneath Investor Name & Type
      setS(r, 0, { border: borderAll });
      setS(r, 1, { border: borderAll });
      r++;

      sheetData.push([
        inv.name,
        'Purchase on/after 31-Jan-2018',
        data.capitalGainSummary.shortTerm,
        data.capitalGainSummary.shortTerm,
        data.capitalGainSummary.shortTerm,
        data.capitalGainSummary.longTerm,
        data.capitalGainSummary.longTerm,
        '0.00',
        data.capitalGainSummary.longTerm
      ]);
      for(let c = 0; c <= 8; c++) setS(r, c, { border: borderAll, alignment: { horizontal: c > 1 ? "right" : "left" } });
      r++;
      sheetData.push([]); r++;

      // ─────────────────────────────────────────────────────────────
      // TABLE 2: Other Taxes Details
      // ─────────────────────────────────────────────────────────────
      sheetData.push([`Mutual Funds Other Taxes Details — FY ${fy.replace('-', ' – ')}`]);
      merges.push({ s: { r, c: 0 }, e: { r, c: 12 } });
      setS(r, 0, { fill: { fgColor: { rgb: THEME.navy } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "left" } });
      r++;

      sheetData.push([
        'Investor Name', 'Type', 
        'Short Term — Quarter-wise', '', '', '', '', 
        'Long Term — Quarter-wise', '', '', '', '', 
        'Total'
      ]);
      merges.push({ s: { r, c: 0 }, e: { r: r + 1, c: 0 } });
      merges.push({ s: { r, c: 1 }, e: { r: r + 1, c: 1 } });
      merges.push({ s: { r, c: 2 }, e: { r, c: 6 } });
      merges.push({ s: { r, c: 7 }, e: { r, c: 11 } });
      merges.push({ s: { r, c: 12 }, e: { r: r + 1, c: 12 } });

      for(let c = 0; c <= 1; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.navy } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      for(let c = 2; c <= 6; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.navyMid } }, font: { bold: true, color: { rgb: THEME.white }, sz: 9 }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      for(let c = 7; c <= 11; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.steel } }, font: { bold: true, color: { rgb: THEME.white }, sz: 9 }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      setS(r, 12, { fill: { fgColor: { rgb: THEME.navy } }, font: { bold: true, color: { rgb: THEME.white } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      r++;

      sheetData.push([
        '', '', 
        'Upto 15-6', '16-6 to 15-9', '16-9 to 15-12', '16-12 to 15-3', '16-3 to 31-3',
        'Upto 15-6', '16-6 to 15-9', '16-9 to 15-12', '16-12 to 15-3', '16-3 to 31-3',
        ''
      ]);
      for(let c = 2; c <= 6; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.navyMid } }, font: { bold: true, color: { rgb: THEME.white }, sz: 9 }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      for(let c = 7; c <= 11; c++) setS(r, c, { fill: { fgColor: { rgb: THEME.steel } }, font: { bold: true, color: { rgb: THEME.white }, sz: 9 }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
      
      setS(r, 0, { border: borderAll });
      setS(r, 1, { border: borderAll });
      setS(r, 12, { border: borderAll });
      r++;

      sheetData.push([
        inv.name,
        'Purchase on/after 31-Jan-2018',
        '0.00', data.capitalGainSummary.shortTerm, '0.00', '0.00', '0.00',
        '0.00', '0.00', '0.00', '0.00', '0.00',
        data.capitalGainSummary.shortTerm + data.capitalGainSummary.longTerm
      ]);
      for(let c = 0; c <= 12; c++) setS(r, c, { border: borderAll, alignment: { horizontal: c > 1 ? "right" : "left" } });
      r++;
      sheetData.push([]); r++;
    }

    // --- Big Red Disclaimer ---
    sheetData.push([]); r++;
    const disclaimer = "Disclaimer:\nWe are not tax consultants and nor do we provide any tax or legal advice. You are requested to kindly consult your own tax or professional advisors for any tax or legal matter. The Company or its employees accept no responsibility for any loss suffered by any investor as a result of the information contained in this report.";
    sheetData.push([disclaimer]);
    merges.push({ s: { r, c: 0 }, e: { r, c: 14 } });
    setS(r, 0, { font: { bold: true, sz: 12, color: { rgb: THEME.negative } }, alignment: { wrapText: true, vertical: "center" } });
    const disclaimerRowIdx = r;
    r++;

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!merges'] = merges;
    ws['!cols'] = [
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, 
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][disclaimerRowIdx] = { hpt: 65 }; // Expand height for wrapped disclaimer

    stylesMap.forEach(({ r, c, s }) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' }; 
      ws[addr].s = s;
    });

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  const equityFunds = data.mutualFunds.filter((mf: any) => String(mf.assetClass).toLowerCase().includes('equity'));
  const otherFunds = data.mutualFunds.filter((mf: any) => !String(mf.assetClass).toLowerCase().includes('equity') && !String(mf.assetClass).toLowerCase().includes('debt'));
  if (otherFunds.length > 0) equityFunds.push(...otherFunds);
  
  const debtFunds = data.mutualFunds.filter((mf: any) => String(mf.assetClass).toLowerCase().includes('debt'));

  createSheet('Equity Detail', equityFunds, true);
  createSheet('Debt Detail', debtFunds, false);

  XLSX.writeFile(wb, `Capital_Gains_${data.investorDetails.name.replace(/[^a-z0-9]/gi, '_')}_${fy}.xlsx`);
};

// ═════════════════════════════════════════════════════════════════════════════
//  PDF GENERATOR  (landscape A4)
// ═════════════════════════════════════════════════════════════════════════════
const generatePDF = (data: any, fy: string, distributorInfo: any) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const inv   = data.investorDetails;
  const PW    = doc.internal.pageSize.getWidth();   
  const PH    = doc.internal.pageSize.getHeight();  
  const ML    = 12;   
  const MR    = 12;   
  const CW    = PW - ML - MR;  
  let Y       = 0;

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

    if (distributorInfo.logoBase64) {
      doc.addImage(distributorInfo.logoBase64, 'PNG', ML, 5, 24, 16);
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.navy);
    doc.text('Capital Gain Detail Report', PW - MR, 12, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textMuted);
    const reportMeta = `FY: ${fy.replace('-', ' – ')}  |  Generated: ${new Date().toLocaleDateString('en-GB')}`;
    doc.text(reportMeta, PW - MR, 17, { align: 'right' });

    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.line(ML, HEADER_H + 2, PW - MR, HEADER_H + 2);

    Y = HEADER_H + 8;
  };

  const drawInvestorBand = () => {
    const BAND_H = 18;
    doc.setFillColor(...C.offWhite);
    doc.rect(ML, Y, CW, BAND_H, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, BAND_H);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.navy);
    doc.text(`${inv.name.toUpperCase()}`, ML + 4, Y + 5.5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.textPrimary);
    doc.text(`PAN: ${inv.pan}`, ML + 4, Y + 10);
    doc.text(`${inv.address}`, ML + 4, Y + 14.5);

    doc.setFontSize(7.5);
    doc.setTextColor(...C.textPrimary);
    doc.text(`Mobile: ${inv.mobile}`, PW - MR - 4, Y + 6, { align: 'right' });
    doc.text(`Email: ${inv.email}`, PW - MR - 4, Y + 10.5, { align: 'right' });

    Y += BAND_H + 5;
  };

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

  const drawFundCard = (mf: any, idx: number) => {
    needsPage(12);
    doc.setFillColor(...C.offWhite);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.rect(ML, Y, CW, 10, 'FD');

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
        fmt(tx.units), 
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

    rows.push([
      { content: 'TOTAL', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' as const, fillColor: C.steelLight, textColor: C.navy } },
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
        [
          { content: 'Withdrawal', colSpan: 7, styles: { halign: 'center', fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 7 } },
          { content: 'Corresponding Subscription', colSpan: 5, styles: { halign: 'center', fillColor: C.navyMid, textColor: C.white, fontStyle: 'bold', fontSize: 7 } },
          { content: 'Grandfathered Value (31-01-2018)', colSpan: 1, styles: { halign: 'center', fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 6.5 } },
          { content: 'Profit & Loss', colSpan: 2, styles: { halign: 'center', fillColor: C.navyMid, textColor: C.white, fontStyle: 'bold', fontSize: 7 } },
        ],
        [
          'Sell Date', 'Hold\nDays', 'Txn\nType', 'Units', 'Sell\nNAV', 'Sell\nAmt', 'STT &\nOthers',
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
        fillColor: C.steel,  
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
        14: { halign: 'right' },
      },
      didParseCell: (hookData) => {
        const { section, column, cell, row } = hookData;
        if (section === 'body' && row.index < rows.length - 1) {
          if (column.index === 13 || column.index === 14) {
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

  const drawSummaryTable = () => {
    needsPage(50);

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
          { content: 'Buy Value', styles: { fillColor: C.navyMid, textColor: C.white } },
          { content: 'Sell Value', styles: { fillColor: C.navyMid, textColor: C.white } },
          { content: 'P&L', styles: { fillColor: C.navyMid, textColor: C.white } },
          { content: 'Buy Value', styles: { fillColor: C.steel, textColor: C.white } },
          { content: 'Sell Value', styles: { fillColor: C.steel, textColor: C.white } },
          { content: 'Cost Acqn.', styles: { fillColor: C.steel, textColor: C.white } },
          { content: 'P&L', styles: { fillColor: C.steel, textColor: C.white } },
        ],
      ],
      body: [[
        inv.name,
        'Purchase on/after 31-Jan-2018',
        fmt(data.capitalGainSummary.shortTerm),   
        fmt(data.capitalGainSummary.shortTerm),   
        fmt(data.capitalGainSummary.shortTerm),
        fmt(data.capitalGainSummary.longTerm),    
        fmt(data.capitalGainSummary.longTerm),    
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

    Y = (doc as any).lastAutoTable.finalY + 12; 
  };

  const drawFooters = () => {
    const total = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(...C.textMuted);
      doc.text(`Page ${i} of ${total}`, PW - MR, PH - 7, { align: 'right' });
    }
  };

  // Build the doc
  drawHeader();
  drawInvestorBand();

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

  renderGroup('EQUITY ASSETS', equityFunds);
  renderGroup('DEBT ASSETS', debtFunds);
  if (otherFunds.length > 0) renderGroup('OTHER ASSETS', otherFunds);

  doc.addPage();
  drawHeader();
  Y = 26;
  drawSummaryTable();
  drawTaxesTable();

  const disclaimerText = "Disclaimer:\nWe are not tax consultants and nor do we provide any tax or legal advice. You are requested to kindly consult your own tax or professional\nadvisors for any tax or legal matter. The Company or its employees accept no responsibility for any loss suffered by any investor as a result of\nthe information contained in this report.";
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); 
  const lines = doc.splitTextToSize(disclaimerText, CW);
  doc.text(lines, ML, Y);

  drawFooters();

  doc.save(
    `Capital_Gains_${inv.name.replace(/[^a-z0-9]/gi, '_')}_${fy}.pdf`,
  );
};