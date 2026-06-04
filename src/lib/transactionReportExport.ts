import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface Transaction {
  transaction_date: string;
  transaction_type: string;
  fund_description: string;
  folio_number: string;
  isin: string;
  amount: number;
  nav: number;
  units: number;
  current_amount: number;
  rta: string;
}

export interface TransactionReportData {
  investor_name: string;
  mobile_no: string;
  email: string;
  transactions: Transaction[];
}

const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export const generateTransactionReportPDF = (
  data: TransactionReportData,
  distributorInfo?: {
    name: string;
    email: string;
    phone: string;
    logoBase64?: string;
  },
) => {
  const doc = new jsPDF("landscape");

  // Strict ethical finance palette: Blue, Black, White
  const primaryBlue = "#003366";
  const black = "#000000";
  const white = "#FFFFFF";

  const formattedName = toTitleCase(data.investor_name);

  let currentY = 20;

  // 1. Conditionally Render Logo
  if (distributorInfo?.logoBase64) {
    try {
      // Dimensions (40x15) can be adjusted to match your specific logo aspect ratio
      doc.addImage(distributorInfo.logoBase64, "PNG", 14, 12, 40, 15);
      currentY = 40; // Push text down to leave space for the logo
    } catch (error) {
      console.warn("Could not render logo in PDF", error);
    }
  }

  // 2. Construct the Document Header
  doc.setFontSize(18);
  doc.setTextColor(primaryBlue);
  doc.text("Transaction Report", 14, currentY);
  currentY += 8;

  // 3. Construct the Investor Profile Subtitle
  doc.setFontSize(11);
  doc.setTextColor(black);
  doc.text(`Investor: ${formattedName}`, 14, currentY);
  currentY += 6;
  doc.text(`Email: ${data.email || "N/A"}`, 14, currentY);
  currentY += 6;
  doc.text(`Mobile: ${data.mobile_no || "N/A"}`, 14, currentY);
  currentY += 10;

  // 4. Map the JSON transactions array
  const tableRows = data.transactions.map((txn) => [
    new Date(txn.transaction_date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    txn.transaction_type,
    txn.fund_description,
    txn.folio_number,
    `Rs. ${txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    txn.nav.toFixed(4),
    txn.units.toFixed(3),
    `Rs. ${txn.current_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    txn.rta,
  ]);

  const tableColumns = [
    "Date",
    "Type",
    "Fund Description",
    "Folio Number",
    "Amount",
    "NAV",
    "Units",
    "Current Amount",
    "RTA",
  ];

  // 5. Render the data table dynamically below the header
  autoTable(doc, {
    startY: currentY,
    head: [tableColumns],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: primaryBlue,
      textColor: white,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      textColor: black,
      lineColor: primaryBlue,
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: "#F4F7FB",
    },
  });

  const fileName = `${formattedName.replace(/\s+/g, "_")}_Transaction_Report.pdf`;
  doc.save(fileName);
};
