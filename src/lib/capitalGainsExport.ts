import { apiClient } from './apiClient';

export const exportCapitalGains = async (
  format: 'pdf' | 'excel',
  investorId: string,
  investorName: string,
  fromDate: string,
  toDate: string,
  periodLabel: string,
  distributorInfo: any,
) => {
  const storedLogo = typeof window !== 'undefined' 
    ? (localStorage.getItem('company-logo-dis') || localStorage.getItem('company-logo-inv')) 
    : null;
    
  let finalDistributorInfo = distributorInfo || {};
  if (storedLogo) {
    finalDistributorInfo = { ...finalDistributorInfo, logoBase64: storedLogo };
  }

  const blob = await apiClient.postBlob('/capital-gains/export', {
    investor_id: investorId,
    from_date: fromDate,
    to_date: toDate,
    period_label: periodLabel,
    format,
    distributor_info: finalDistributorInfo
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Safe filename handling
  const safeName = (investorName || 'Investor').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/gi, '');
  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9_-]/gi, '-');
  a.download = `${safeName}_Capital-Gains-Report_${safePeriod}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};