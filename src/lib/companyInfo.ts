export interface StoredCompanyInfo {
  name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
}

export const getStoredCompanyInfo = (): StoredCompanyInfo | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem('company-info-dis') ||
      localStorage.getItem('company-info-inv');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getStoredCompanyLogo = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('company-logo-dis') || localStorage.getItem('company-logo-inv');
};

export const buildDistributorInfoPayload = (): Record<string, any> => {
  const info = getStoredCompanyInfo();
  const logo = getStoredCompanyLogo();
  const payload: Record<string, any> = {};
  if (info?.name) payload.name = info.name;
  if (info?.address) payload.address = info.address;
  if (info?.email) payload.email = info.email;
  if (info?.phone) payload.phone = info.phone;
  if (logo) payload.logoBase64 = logo;
  return payload;
};
