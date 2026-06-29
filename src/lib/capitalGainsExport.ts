// sp2736/finiq/finiq-2ba764ad0d5cf7fe572754beaf16ddabd9624c29/src/lib/capitalGainsExport.ts

import { apiClient } from './apiClient';

/**
 * Sends report layout data to the backend and handles the resulting file download.
 * Formatting and styling are strictly delegated to the backend for performance.
 */
export const exportCapitalGains = async (
  format: 'pdf' | 'excel',
  data: any,
  fy: string,
  distributorInfo: any,
) => {
  try {
    const blob = await apiClient.postBlob('/capital-gains/export', {
      format,
      data,
      fy,
      distributorInfo
    });

    // Format the filename beautifully: e.g. Capital_Gains_John_Doe_2025-26.pdf
    const investorNameFormatted = data.investorDetails?.name
      ? data.investorDetails.name
          .toLowerCase()
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('_')
          .replace(/[^a-zA-Z0-9_]/gi, '')
      : 'Investor';
    const filename = `Capital_Gains_${investorNameFormatted}_${fy}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Failed to export Capital Gains report:', error);
  }
};