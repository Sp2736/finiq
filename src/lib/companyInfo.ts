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

export const getStoredCompanyLogoUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const companyId = localStorage.getItem('company_id');
  if (!companyId) return null;

  const cacheKey = `company_logo_cache_${companyId}`;
  const cachedStr = localStorage.getItem(cacheKey);

  if (cachedStr) {
    try {
      const cached = JSON.parse(cachedStr);
      if (cached.expiresAt > Date.now() && cached.url) {
        return cached.url;
      }
    } catch (e) {
      console.error('Failed to parse cached logo', e);
    }
  }
  return null;
};

export const getStoredLogoS3Key = (): string | null => {
  if (typeof window === 'undefined') return null;

  const companyId = localStorage.getItem('company_id');
  if (!companyId) return null;

  const cacheKey = `company_logo_cache_${companyId}`;
  const cachedStr = localStorage.getItem(cacheKey);

  if (cachedStr) {
    try {
      const cached = JSON.parse(cachedStr);
      return cached.s3Key ?? null;
    } catch {
      return null;
    }
  }
  return null;
};

export const buildDistributorInfoPayload = (): Record<string, any> => {
  const info = getStoredCompanyInfo();
  const logoUrl = getStoredCompanyLogoUrl();
  const logoS3Key = getStoredLogoS3Key();
  const payload: Record<string, any> = {};
  if (info?.name) payload.name = info.name;
  if (info?.address) payload.address = info.address;
  if (info?.email) payload.email = info.email;
  if (info?.phone) payload.phone = info.phone;
  if (logoS3Key) payload.logoS3Key = logoS3Key;
  else if (logoUrl) payload.logoUrl = logoUrl; // fallback for non-S3 URLs
  return payload;
};

