import { apiClient } from '@/lib/apiClient';

export interface TopContributor {
  name: string;
  pan: string;
  total_current: number;
  total_invested: number;
  notional_pl: number;
  abs_pct: number;
}

export interface CompanySummary {
  total_invested: number;
  total_current: number;
  investor_count: number;
}

export interface Investor {
  id: string;
  name: string;
  tax_status: string;
  pan: string;
  email: string;
  login_identifier: string;
  date_of_birth: string;
  total_aum: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const distributorService = {
  getTopContributors: async (): Promise<ApiResponse<TopContributor[]>> => {
    return apiClient.get<ApiResponse<TopContributor[]>>('/holdings-cache/top-contributors');
  },
  getCompanySummary: async (): Promise<ApiResponse<CompanySummary>> => {
    return apiClient.get<ApiResponse<CompanySummary>>('/holdings-cache/company-summary');
  },
  getInvestors: async (page: number = 1, limit: number = 30): Promise<ApiResponse<PaginatedResponse<Investor>>> => {
    return apiClient.get<ApiResponse<PaginatedResponse<Investor>>>(`/holdings-cache/investors?page=${page}&limit=${limit}`);
  },
  getBrokerageSummary: async (fromDate: string, toDate: string, groupBy: string = "AMC"): Promise<ApiResponse<any>> => {
    const query = new URLSearchParams({ fromDate, toDate });
    if (groupBy.toLowerCase() === 'client' || groupBy.toLowerCase() === 'investor' || groupBy.toLowerCase() === 'family') {
      query.append('groupBy', 'investor');
    }
    return apiClient.get<ApiResponse<any>>(`/brokerage-distribution/detailed-summary?${query.toString()}`);
  },
  
  // Fetch specific client's portfolio using the precise API route
  getClientPortfolio: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(`/investors/${id}/holdings`);
  }
};