import { apiClient } from "./apiClient";

export const exportTransactionReport = async (
  investorId: string,
  investorName: string,
  distributorInfo?: any,
): Promise<void> => {
  try {
    const storedLogo = typeof window !== 'undefined' 
      ? (localStorage.getItem('company-logo-dis') || localStorage.getItem('company-logo-inv')) 
      : null;
      
    let finalDistributorInfo = distributorInfo || {};
    if (storedLogo) {
      finalDistributorInfo = { ...finalDistributorInfo, logoBase64: storedLogo };
    }

    const payload = Object.keys(finalDistributorInfo).length > 0 ? { distributor_info: finalDistributorInfo } : {};
    const blob = await apiClient.postBlob(
      `/investors/${investorId}/transactions/export`,
      payload
    );

    const rawName = investorName || "Investor";
    const safeName = rawName
      .toLowerCase()
      .split(" ")
      .map((w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join("_")
      .replace(/[^a-zA-Z0-9_]/gi, "");

    const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    const filename = `${safeName}_Transactions-Report_${today}.pdf`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export Transactions report:", error);
    throw error;
  }
};
