import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to format currency safely
const formatCurrency = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Pure jsPDF Pie Chart Drawer (Dependency-Free, Gapless)
const drawPieSlice = (
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: number[],
) => {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.setDrawColor(color[0], color[1], color[2]); // Match stroke to fill
  doc.setLineWidth(0.5);

  const segments = 60; // High smoothness
  const angleStep = (endAngle - startAngle) / segments;

  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + i * angleStep;
    // Add a microscopic overlap (0.01) to completely eliminate PDF anti-aliasing rendering gaps
    const a2 = startAngle + (i + 1) * angleStep + 0.01;

    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy + radius * Math.sin(a2);

    // "FD" = Fill and Draw stroke (prevents white hairlines)
    doc.triangle(cx, cy, x1, y1, x2, y2, "FD");
  }
};

export const generatePortfolioValuationPDF = (
  clientData: any, // Accepts the raw Finiq API JSON payload
  distributorInfo?: any,
) => {
  const doc = new jsPDF("landscape", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const today = new Date().toLocaleDateString("en-GB");
  const time = new Date().toLocaleTimeString("en-GB");

  let pageCount = 1;

  // ─── HELPER: PAGE HEADER ───
  const drawPageHeader = () => {
    // 1. Smart Logo Insertion
    if (
      distributorInfo?.logoBase64 &&
      distributorInfo.logoBase64.trim() !== ""
    ) {
      try {
        // Dynamically add logo if present (Format, X, Y, Width, Height)
        doc.addImage(
          distributorInfo.logoBase64,
          "PNG",
          40,
          30,
          120,
          50,
          "",
          "FAST",
        );
      } catch (err) {
        console.warn("Could not render logo to PDF:", err);
      }
    }

    // 2. Report Meta Data (Right-Aligned)
    doc.setTextColor(100, 116, 139); // text-slate-500
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`NAV As on Date: ${today}`, pageWidth - 40, 45, {
      align: "right",
    });
    doc.text(`Report As On Date: ${today}`, pageWidth - 40, 60, {
      align: "right",
    });
    doc.text(`Run Date: ${today} ${time}`, pageWidth - 40, 75, {
      align: "right",
    });

    // 3. Client Details block
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // text-slate-900
    doc.text("Portfolio Holdings Report", 40, 115);

    const clientName =
      clientData.investor_name || clientData.clientName || "Investor";
    const pan = clientData.pan || "N/A";

    doc.setFontSize(10);
    doc.text(`Name: ${clientName} (${pan})`, 40, 135);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const email =
      clientData.email || clientData.funds?.[0]?.email || "Not Provided";
    const mobile =
      clientData.mobile || clientData.funds?.[0]?.mobile || "Not Provided";

    doc.text(`Mobile No: ${mobile}`, 40, 150);
    doc.text(`Email: ${email}`, 40, 165);
  };

  // ─── PAGE 1: DETAILED HOLDINGS TABLE ───
  drawPageHeader();

  const tableColumn = [
    "Fund Name\nISIN/Folio No.",
    "Pur. Date\nAvg. Days",
    "Principal Amount\nInvested Capital",
    "Curr. Value\nUnits",
    "Curr. Nav\nAvg. Nav",
    "Div. Payout", // Added Column
    "Unrealised\nUnrealised LT\nUnrealised ST",
    "Realised\nRealised LT\nRealised ST",
    "Net P&L", // Added Column
    "RED/SWP\nS-Out/STP", // Reformatted
    "Today's P&L\nToday's P&L%",
    "XIRR%\nABS%",
  ];

  const tableRows: any[] = [];

  let totalPrincipal = 0;
  let totalCurrent = 0;
  let totalDividend = 0; // Track Dividend
  let totalUnrealST = 0;
  let totalUnrealLT = 0;
  let totalRealST = 0;
  let totalRealLT = 0;
  let totalNetPnl = 0; // Track Net P&L
  let totalToday = 0;

  const fundsList = clientData.funds || [];

  fundsList.forEach((fund: any) => {
    const investedCapital = fund.total_capital ?? fund.invested_capital ?? 0;
    const currentValue = fund.current_value ?? 0;
    const uST = fund.unrealised_gains_st || 0;
    const uLT = fund.unrealised_gains_lt || 0;
    const rST = fund.realised_gains_st || 0;
    const rLT = fund.realised_gains_lt || 0;
    const availableUnits = fund.available_units ?? 0;
    const currentNAV = fund.current_nav ?? 0;
    const avgNav = fund.avg_nav ?? 0;
    const avgDays = fund.avg_days ?? 0;

    // Extracted missing variables
    const dividendPayout = fund.dividend_payout ?? fund.dividendPayout ?? 0;
    const netPnl = fund.net_pnl ?? fund.netPL ?? 0;
    const redSwp = fund.redemption_swp_switch_stp ?? 0;

    const todaysPnl = fund.todays_pnl ?? 0;
    const todaysPnlPct = fund.todays_pnl_percent ?? 0;
    const xirr = fund.xirr_percent ?? 0;
    const abs = fund.abs_percent ?? 0;

    let purchaseDate = "N/A";
    if (fund.purchase_date) {
      try {
        purchaseDate = new Date(fund.purchase_date).toLocaleDateString("en-GB");
      } catch (e) {
        purchaseDate = fund.purchase_date;
      }
    }

    totalPrincipal += investedCapital;
    totalCurrent += currentValue;
    totalDividend += dividendPayout;
    totalUnrealST += uST;
    totalUnrealLT += uLT;
    totalRealST += rST;
    totalRealLT += rLT;
    totalNetPnl += netPnl;
    totalToday += todaysPnl;

    const totalUnreal = uST + uLT;
    const totalReal = rST + rLT;

    tableRows.push([
      `${fund.fund_name || "Unknown Fund"}\n${fund.folio_number || "N/A"}`,
      `${purchaseDate}\n${avgDays}`,
      `${formatCurrency(investedCapital)}\n${formatCurrency(investedCapital)}`,
      `${formatCurrency(currentValue)}\n${availableUnits.toFixed(3)}`,
      `${currentNAV}\n${avgNav}`,
      `${formatCurrency(dividendPayout)}`, // Populated Div Payout
      `${formatCurrency(totalUnreal)}\n${formatCurrency(uLT)}\n${formatCurrency(uST)}`,
      `${formatCurrency(totalReal)}\n${formatCurrency(rLT)}\n${formatCurrency(rST)}`,
      `${formatCurrency(netPnl)}`, // Populated Net P&L
      `${formatCurrency(redSwp)}/0.00\n0.00/0.00`, // Formatted exactly as requested
      `${formatCurrency(todaysPnl)}\n${todaysPnlPct.toFixed(2)}`,
      `${xirr.toFixed(2)}\n${abs.toFixed(2)}`,
    ]);
  });

  const grandUnrealised = totalUnrealST + totalUnrealLT;
  const grandRealised = totalRealST + totalRealLT;

  // Footer Totals Row
  tableRows.push([
    "MUTUAL FUNDS TOTAL",
    "",
    formatCurrency(totalPrincipal),
    formatCurrency(totalCurrent),
    "",
    formatCurrency(totalDividend),
    `${formatCurrency(grandUnrealised)}\n${formatCurrency(totalUnrealLT)}\n${formatCurrency(totalUnrealST)}`,
    `${formatCurrency(grandRealised)}\n${formatCurrency(totalRealLT)}\n${formatCurrency(totalRealST)}`,
    formatCurrency(totalNetPnl),
    "0.00/0.00\n0.00/0.00",
    `${formatCurrency(totalToday)}\n`,
    `${clientData.xirr_percent?.toFixed(2) || "0.00"}\n${clientData.abs_percent?.toFixed(2) || "0.00"}`,
  ]);

  autoTable(doc, {
    startY: 195, // Shifted slightly down to account for address line
    head: [tableColumn],
    body: tableRows,
    theme: "striped",
    styles: {
      fontSize: 6.5, // Shrunk to 6.5 to accommodate 12 columns gracefully
      cellPadding: 4,
      textColor: [51, 65, 85], // text-slate-700
      lineColor: [226, 232, 240], // border-slate-200
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [79, 70, 229], // Finiq Deep Indigo (distributor-600)
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "right",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 140 }, // Adjusted to give space to new columns
      1: { halign: "center", cellWidth: 50 }, // Adjusted
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "right" },
      9: { halign: "right" },
      10: { halign: "right" },
      11: { halign: "right" },
    },
    willDrawCell: function (data) {
      // Highlight the final totals row with Finiq themes
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [238, 242, 255]; // Soft Indigo Background
        data.cell.styles.textColor = [15, 23, 42]; // Slate 900
      }
    },
    didDrawPage: function (data) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Page No ${pageCount} of 3`, pageWidth / 2, pageHeight - 20, {
        align: "center",
      });
      pageCount++;
    },
  });

  // ─── PAGE 2: SUMMARY ───
  doc.addPage();
  drawPageHeader();

  const summaryColumn = [
    "Avg. Days - MF\nOnly",
    "Invested Capital",
    "Curr. Value",
    "Div. Payout",
    "Unrealised LT\nUnrealised ST",
    "Realised LT\nRealised ST",
    "Net P&L",
    "Today's P&L%",
    "ABS%",
  ];

  const avgDaysPortfolio =
    fundsList.length > 0
      ? Math.round(
          fundsList.reduce(
            (acc: number, curr: any) => acc + (curr.avg_days || 0),
            0,
          ) / fundsList.length,
        )
      : 0;

  const summaryRows = [
    [
      avgDaysPortfolio.toString(),
      formatCurrency(totalPrincipal),
      formatCurrency(totalCurrent),
      formatCurrency(totalDividend), // Fed actual dynamic data
      `${formatCurrency(totalUnrealLT)}\n${formatCurrency(totalUnrealST)}`,
      `${formatCurrency(totalRealLT)}\n${formatCurrency(totalRealST)}`,
      formatCurrency(totalNetPnl), // Fed actual dynamic data
      clientData.todays_pnl_percent?.toFixed(2) || "0.00",
      clientData.abs_percent?.toFixed(2) || "0.00",
    ],
  ];

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`TOTAL - ${clientData.investor_name || "Investor"}`, 40, 199);

  autoTable(doc, {
    startY: 205,
    head: [summaryColumn],
    body: summaryRows,
    theme: "plain",
    styles: {
      fontSize: 8,
      cellPadding: 5,
      halign: "right",
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [79, 70, 229], // Finiq Deep Indigo
      textColor: [255, 255, 255],
      fontStyle: "bold",
      lineWidth: 0,
    },
    columnStyles: {
      0: { halign: "center" },
    },
  });

  // ─── PAGE 3: ASSET & CLIENT ALLOCATION CHARTS ───
  doc.addPage();
  drawPageHeader();

  // 1. ASSET ALLOCATION
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("ASSET ALLOCATION", 40, 200);

  let equityVal = 0;
  let debtVal = 0;
  let hybridVal = 0;

  fundsList.forEach((f: any) => {
    const name = (f.fund_name || "").toLowerCase();
    if (
      name.includes("debt") ||
      name.includes("liquid") ||
      name.includes("bond")
    ) {
      debtVal += f.current_value || 0;
    } else if (
      name.includes("hybrid") ||
      name.includes("asset allocation") ||
      name.includes("advantage")
    ) {
      hybridVal += f.current_value || 0;
    } else {
      equityVal += f.current_value || 0;
    }
  });

  const totalChartVal = equityVal + debtVal + hybridVal || 1;
  const eqPct = equityVal / totalChartVal;
  const debtPct = debtVal / totalChartVal;
  const hyPct = hybridVal / totalChartVal;

  const cx = 150;
  const cy1 = 280;
  const radius = 60;

  // Sleek Finiq Chart Palette

  const eqColor = [79, 70, 229]; // Indigo
  const hyColor = [16, 185, 129]; // Emerald Green
  const dbColor = [245, 158, 11]; // Amber

  // const eqColor = [109, 40, 217]; // Deep Purple
  // const hyColor = [6, 182, 212]; // Cyan
  // const dbColor = [217, 119, 6]; // Amber

  // const eqColor = [15, 23, 42]; // Deep Navy
  // const hyColor = [37, 99, 235]; // Financial Blue
  // const dbColor = [245, 158, 11]; // Market Amber

  // const eqColor = [79, 70, 229]; // Indigo
  // const hyColor = [14, 165, 233]; // Sky Blue
  // const dbColor = [249, 115, 22]; // Soft Orange

  // const eqColor = [0, 92, 175]; // Accessible Blue
  // const hyColor = [230, 159, 0]; // Orange
  // const dbColor = [88, 89, 91]; // Neutral Gray

  let currentAngle = -Math.PI / 2;

  if (eqPct > 0) {
    const angle = eqPct * 2 * Math.PI;
    drawPieSlice(
      doc,
      cx,
      cy1,
      radius,
      currentAngle,
      currentAngle + angle,
      eqColor,
    );
    currentAngle += angle;
  }
  if (hyPct > 0) {
    const angle = hyPct * 2 * Math.PI;
    drawPieSlice(
      doc,
      cx,
      cy1,
      radius,
      currentAngle,
      currentAngle + angle,
      hyColor,
    );
    currentAngle += angle;
  }
  if (debtPct > 0) {
    const angle = debtPct * 2 * Math.PI;
    drawPieSlice(
      doc,
      cx,
      cy1,
      radius,
      currentAngle,
      currentAngle + angle,
      dbColor,
    );
  }

  // Draw Asset Legends
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  let legendY = 250;
  if (eqPct > 0) {
    doc.setFillColor(eqColor[0], eqColor[1], eqColor[2]);
    doc.rect(300, legendY, 10, 10, "F");
    doc.text(`Equity: ${(eqPct * 100).toFixed(2)}%`, 315, legendY + 8);
  }
  if (hyPct > 0) {
    doc.setFillColor(hyColor[0], hyColor[1], hyColor[2]);
    doc.rect(420, legendY, 10, 10, "F");
    doc.text(`Hybrid: ${(hyPct * 100).toFixed(2)}%`, 435, legendY + 8);
  }
  if (debtPct > 0) {
    doc.setFillColor(dbColor[0], dbColor[1], dbColor[2]);
    doc.rect(540, legendY, 10, 10, "F");
    doc.text(`Debt: ${(debtPct * 100).toFixed(2)}%`, 555, legendY + 8);
  }

  // 2. CLIENT ALLOCATION
  const cy2 = 450;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("CLIENT ALLOCATION", 40, 370);

  // Draw Client Pie (100% full circle)
  doc.setFillColor(eqColor[0], eqColor[1], eqColor[2]);
  doc.setDrawColor(eqColor[0], eqColor[1], eqColor[2]);
  doc.circle(cx, cy2, radius, "FD");

  // Draw Client Legend
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.rect(300, cy2 - 20, 10, 10, "F");
  doc.text(`${clientData.investor_name || "Investor"}: 100.00%`, 315, cy2 - 12);

  // ─── 5. SAVE PDF ───
  const filename = `${(clientData.investor_name || "Investor").replace(/\s+/g, "_")}_Holdings_${today.replace(/\//g, "_")}.pdf`;
  doc.save(filename);
};
