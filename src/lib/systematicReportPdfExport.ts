import { apiClient } from "./apiClient";
import { buildDistributorInfoPayload } from "./companyInfo";

export const exportSystematicReportPDF = async (
  payload: {
    type?: string;
    status?: string;
    registrar?: string;
    investorId?: string;
    investorLabel?: string;
    groupBy?: string;
  },
  distributorInfo?: any,
): Promise<void> => {
  try {
    const finalDistributorInfo = { ...buildDistributorInfoPayload(), ...(distributorInfo || {}) };

    const body = {
      ...payload,
      distributor_info: Object.keys(finalDistributorInfo).length > 0 ? finalDistributorInfo : undefined,
    };

    const { blob } = await apiClient.postForFile('/sips/systematic-report/export', body);

    const rawName = payload.investorLabel && payload.investorLabel !== "All Investors" ? payload.investorLabel : "All_Investors";
    const safeName = rawName
      .toLowerCase()
      .split(" ")
      .map((w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join("_")
      .replace(/[^a-zA-Z0-9_]/gi, "");

    const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const filename = `${safeName}_Systematic-Report_${today}.pdf`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export Systematic Transactions report:', error);
    throw error;
  }
};
