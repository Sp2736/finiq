// src/services/investor.service.ts
import { apiClient } from '@/lib/apiClient';

export const investorService = {
  getPortfolio: async () => {
    return apiClient.get<any>('/investors/holdings');
  }
};