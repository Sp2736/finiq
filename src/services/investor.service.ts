import { apiClient } from '@/lib/apiClient';
import { ClientPortfolio } from '@/types/investor';

export const investorService = {
  /**
   * Fetches the unified portfolio for the authenticated investor.
   * The apiClient automatically attaches the Bearer token from localStorage.
   */
  getPortfolio: async (): Promise<ClientPortfolio> => {
    // Replace '/portfolio' with your backend's actual endpoint route
    return apiClient.get<ClientPortfolio>('/portfolio');
  }
};