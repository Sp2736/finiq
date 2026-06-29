import { apiClient } from "./apiClient";

/**
 * Sends portfolio data to the backend for PDF generation.
 * This offloads heavy jsPDF/autoTable operations from the client browser.
 */
export const generatePortfolioValuationPDF = async (
  clientData: any, // Accepts the raw Finiq API JSON payload
  distributorInfo?: any,
) => {
  try {
    const blob = await apiClient.postBlob("/investors/holdings-export", {
      clientData,
      distributorInfo,
    });

    // Formulate the filename in exactly the same way as the backend controller
    const rawName =
      clientData.investor_name || clientData.clientName || "Investor";
    const investorNameFormatted = rawName
      .toLowerCase()
      .split(" ")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("_")
      .replace(/[^a-zA-Z0-9_]/gi, "");
    const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "_");
    const filename = `${investorNameFormatted}_Holdings_${today}.pdf`;

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export Holdings PDF report:", error);
  }
};
