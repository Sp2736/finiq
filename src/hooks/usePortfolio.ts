// src/hooks/usePortfolio.ts
"use client";

import { useState, useEffect } from "react";
import { investorService } from "@/services/investor.service";

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPortfolio = async () => {
      try {
        setIsLoading(true);
        const data = await investorService.getPortfolio();
        
        if (isMounted) {
          setPortfolio(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "failed to fetch portfolio holdings");
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
  }, []);

  return { portfolio, isLoading, error };
}