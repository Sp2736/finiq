import { apiClient } from '@/lib/apiClient';

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
  sendOtp: async (phone: string) => {
    console.log(`Mock: Sending OTP to ${phone}`);
    return Promise.resolve({ success: true });
  },

  verifyOtp: async (phone: string, otp: string) => {
    console.log(`Mock: Verifying OTP ${otp} for ${phone}`);
    return Promise.resolve({ token: 'mock-admin-token-1234' });
  }
};