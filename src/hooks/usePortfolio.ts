import { useState, useEffect } from 'react';
import { investorService } from '@/services/investor.service';
import { ClientPortfolio } from '@/types/investor';

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<ClientPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPortfolio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch real data from the API
        const data = await investorService.getPortfolio();
        
        if (isMounted) setPortfolio(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load portfolio data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPortfolio();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return { portfolio, isLoading, error };
}