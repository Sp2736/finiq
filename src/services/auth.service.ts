import { apiClient } from '@/lib/apiClient';

export interface AuthResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}


export interface VerifyOtpData {
  access_token: string;
  refresh_token: string;
  company_logo?: string | null;
  company_info?: {
    name: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface SendOtpData {
  message: string;
}

// Updated to match API response structure
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    logo_base64?: string | null;
    company_info?: {
      name?: string | null;
      address?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  };
}

export const authService = {
  // ─── INVESTOR AUTH ────────────────────────────────────────────────────────
  loginInvestor: async (identifier: string, password: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/investor-auth/login', { identifier, password });
  },

  // ─── ADMIN / DISTRIBUTOR AUTH ─────────────────────────────────────────────
  sendOtp: async (phone_number: string): Promise<AuthResponse<SendOtpData>> => {
    return apiClient.post<AuthResponse<SendOtpData>>('/auth/send-otp', { phone_number });
  },

  verifyOtp: async (phone_number: string, otp_code: string): Promise<AuthResponse<VerifyOtpData>> => {
    return apiClient.post<AuthResponse<VerifyOtpData>>('/auth/verify-otp', { phone_number, otp_code });
  },

  refreshToken: async (user_id: string, refresh_token: string): Promise<AuthResponse<VerifyOtpData>> => {
    return apiClient.post<AuthResponse<VerifyOtpData>>('/auth/refresh', { user_id, refresh_token });
  }
};