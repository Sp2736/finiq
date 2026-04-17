import { apiClient } from '@/lib/apiClient';
import { ClientPortfolio } from '@/types/investor';

export const investorService = {
  getPortfolio: async (): Promise<ClientPortfolio> => {
    return apiClient.get<ClientPortfolio>('/investor/portfolio');
  }
};