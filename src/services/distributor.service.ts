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

// export const distributorService = {
//   getTopContributors: async (): Promise<ApiResponse<TopContributor[]>> => {
//     return apiClient.get<ApiResponse<TopContributor[]>>('/holdings-cache/top-contributors');
//   },
//   getCompanySummary: async (): Promise<ApiResponse<CompanySummary>> => {
//     return apiClient.get<ApiResponse<CompanySummary>>('/holdings-cache/company-summary');
//   },
//   getInvestors: async (page: number = 1, limit: number = 30): Promise<ApiResponse<PaginatedResponse<Investor>>> => {
//     return apiClient.get<ApiResponse<PaginatedResponse<Investor>>>(`/holdings-cache/investors?page=${page}&limit=${limit}`);
//   },
// };

// Temporarily mock the service methods for testing

export const distributorService = {
  getTopContributors: async () => {
    // Return fake data instead of: return apiClient.get('/distributor/top-contributors');
    return {
      success: true,
      data: [
        { pan: "ABCDE1234F", name: "Ravi Kumar", total_invested: 5000000, total_current: 6500000, notional_pl: 1500000, abs_pct: 30 },
        { pan: "FGHIJ5678K", name: "Sunita Sharma", total_invested: 3500000, total_current: 3100000, notional_pl: -400000, abs_pct: -11.4 },
        { pan: "KLMNO9012P", name: "Amit Patel", total_invested: 2000000, total_current: 2800000, notional_pl: 800000, abs_pct: 40 },
      ]
    };
  },

  getCompanySummary: async () => {
    // Return fake data instead of: return apiClient.get('/distributor/summary');
    return {
      success: true,
      data: {
        total_invested: 150000000,
        total_current: 185000000,
        investor_count: 245
      }
    };
  }
};
