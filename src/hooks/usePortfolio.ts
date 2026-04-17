"use client";

import { useState, useEffect } from "react";
import { UnifiedFund } from "@/types/investor";
import { CURRENT_CLIENT } from "@/types/mockInvestorData";

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPortfolio = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (isMounted) {
          setPortfolio(CURRENT_CLIENT);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to fetch portfolio");
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