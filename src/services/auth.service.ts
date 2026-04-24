import { apiClient } from '@/lib/apiClient';

export interface AuthResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface UserRole {
  id: string;
  role: string;
  tenant_id: string | null;
  company_id: string | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface VerifyOtpData {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    phone_number: string;
    roles: UserRole[];
  };
}

export interface SendOtpData {
  message: string;
}

// Updated to match your exact API response structure
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    investor: {
      id: string;
      name: string;
      mobile: string;
      email: string;
    };
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