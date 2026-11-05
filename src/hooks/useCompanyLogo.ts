"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';

interface CachedLogo {
  url: string | null;
  expiresAt: number;
  s3Key?: string | null;
}

/**
 * A hook to safely retrieve the company logo from localStorage or fetch a new presigned URL.
 * Returns { logoUrl, refreshLogo } so callers can trigger a refresh on onError.
 */
export function useCompanyLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const retryCount = useRef(0);

  const refresh = useCallback(async (isRetry = false) => {
    if (isRetry && retryCount.current >= 1) {
      console.warn('Max logo refresh retries reached');
      return;
    }
    if (isRetry) {
      retryCount.current += 1;
    }

    let companyId = localStorage.getItem('company_id');
    
    // Fallback: If missing from localStorage, try to decode from the auth cookie
    if (!companyId && typeof document !== 'undefined') {
      const portal = window.location.pathname.includes("/investor") ? "investor" : "staff";
      const match = document.cookie.match(new RegExp(`(^| )${portal}-auth-token=([^;]+)`));
      if (match) {
        const token = decodeURIComponent(match[2]);
        try {
          const base64Url = token.split(".")[1];
          if (base64Url) {
            const jsonPayload = decodeURIComponent(atob(base64Url.replace(/-/g, "+").replace(/_/g, "/")).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
            const decoded = JSON.parse(jsonPayload);
            companyId = decoded.company_id;
            if (companyId) localStorage.setItem('company_id', companyId);
          }
        } catch (e) {
          console.error("Failed to decode token for companyId", e);
        }
      }
    }
    
    if (!companyId) return;

    const cacheKey = `company_logo_cache_${companyId}`;
    try {
      const res = await apiClient.get<any>(`/companies/${companyId}/logo-url`);
      const fetchedUrl = res.data?.logo_url || null;
      setLogoUrl(fetchedUrl);
      if (fetchedUrl) {
        const existing = (() => {
          try { return JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch { return {}; }
        })();
        const newCache: CachedLogo = {
          url: fetchedUrl,
          expiresAt: Date.now() + 50 * 60 * 1000,
          s3Key: existing.s3Key ?? null,
        };
        localStorage.setItem(cacheKey, JSON.stringify(newCache));
      }
    } catch (err) {
      console.warn('Failed to fetch logo URL', err);
    }
  }, []);

  useEffect(() => {
    let companyId = localStorage.getItem('company_id');
    
    // Fallback: If missing from localStorage, try to decode from the auth cookie
    if (!companyId && typeof document !== 'undefined') {
      const portal = window.location.pathname.includes("/investor") ? "investor" : "staff";
      const match = document.cookie.match(new RegExp(`(^| )${portal}-auth-token=([^;]+)`));
      if (match) {
        const token = decodeURIComponent(match[2]);
        try {
          const base64Url = token.split(".")[1];
          if (base64Url) {
            const jsonPayload = decodeURIComponent(atob(base64Url.replace(/-/g, "+").replace(/_/g, "/")).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
            const decoded = JSON.parse(jsonPayload);
            companyId = decoded.company_id;
            if (companyId) localStorage.setItem('company_id', companyId);
          }
        } catch (e) {
          console.error("Failed to decode token for companyId", e);
        }
      }
    }

    if (!companyId) return;

    const cacheKey = `company_logo_cache_${companyId}`;
    const cachedStr = localStorage.getItem(cacheKey);
    let fetchNeeded = true;

    if (cachedStr) {
      try {
        const cached: CachedLogo = JSON.parse(cachedStr);
        if (cached.expiresAt > Date.now() && cached.url) {
          setLogoUrl(cached.url);
          fetchNeeded = false;
        }
      } catch (e) {
        console.error('Failed to parse cached logo', e);
      }
    }

    if (fetchNeeded) {
      refresh();
    }
  }, [refresh]);

  return { logoUrl, refreshLogo: refresh };
}