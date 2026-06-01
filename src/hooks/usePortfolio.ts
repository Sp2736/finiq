// src/hooks/usePortfolio.ts
"use client";

import { useState, useEffect } from "react";
import { investorService } from "@/services/investor.service";

// Module-level cache variables (persists during client-side navigation)
let cachedPortfolio: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export function usePortfolio(forceRefresh = false) {
  // Initialize state with cache if available
  const [portfolio, setPortfolio] = useState<any>(cachedPortfolio);
  const [isLoading, setIsLoading] = useState(!cachedPortfolio || forceRefresh);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPortfolio = async () => {
      const now = Date.now();
      
      // If we have a valid cache and aren't forcing a refresh, skip the fetch
      if (!forceRefresh && cachedPortfolio && (now - lastFetchTime < CACHE_DURATION)) {
        if (isMounted) {
          setPortfolio(cachedPortfolio);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const data = await investorService.getPortfolio();
        
        if (isMounted) {
          cachedPortfolio = data; // Store in cache
          lastFetchTime = Date.now();
          setPortfolio(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to fetch portfolio holdings");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPortfolio();

    return () => {
      isMounted = false;
    };
  }, [forceRefresh]);

  return { portfolio, isLoading, error };
}