// src/services/investor.service.ts
import { apiClient } from '@/lib/apiClient';

export const investorService = {
  getPortfolio: async () => {
    return apiClient.get<any>('/investors/holdings');
  },
  
  getCapitalGains: async (data: { start_date: string; end_date: string; investor_id?: string }) => {
    return apiClient.post<any>('/investors/capital-gains', data);
  }
};