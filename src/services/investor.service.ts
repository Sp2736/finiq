// src/services/investor.service.ts
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/services/distributor.service';

export const investorService = {
  getPortfolio: async () => {
    return apiClient.get<any>('/investors/holdings');
  },
  
  getCapitalGains: async (data: { start_date: string; end_date: string; investor_id?: string }) => {
    return apiClient.post<any>('/investors/capital-gains', data);
  },

  getTransactionReport: async (investorId?: string): Promise<ApiResponse<any>> => {
    // If the API requires the ID in the body even for logged-in investors:
    return apiClient.post<ApiResponse<any>>("/investors/transaction-report", {
      investor_id: investorId, 
    });
  },
};