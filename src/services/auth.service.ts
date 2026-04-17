import { apiClient } from '@/lib/apiClient';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export const authService = {
  // Step 1: Request OTP
  sendOtp: async (phone: string) => {
    return apiClient.post('/auth/send-otp', { phone });
  },

  // Step 2: Verify OTP and get Token
  verifyOtp: async (phone: string, otp: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/verify-otp', { phone, otp });
  }
};