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
  // ─── INVESTOR AUTH ────────────────────────────────────────────────────────
  loginWithEmail: async (email: string, password: string): Promise<LoginResponse> => {
    // Dummy logic for testing environment
    if (email === 'abc@gmail.com' && password === 'pwd123') {
      return Promise.resolve({
        token: 'mock-jwt-token-732d460b',
        user: {
          id: 'inv-101',
          name: 'Demo Investor',
          role: 'Investor'
        }
      });
    }

    // Actual API call for production
    return apiClient.post<LoginResponse>('/auth/login', { email, password });
  },

  // ─── ADMIN / DISTRIBUTOR AUTH ─────────────────────────────────────────────
  sendOtp: async (phone: string) => {
    console.log(`Mock: Sending OTP to ${phone}`);
    // Returning a resolved promise so the form doesn't crash during testing
    return Promise.resolve({ success: true });
    
    // Future API call: 
    // return apiClient.post('/auth/send-otp', { phone });
  },

  verifyOtp: async (phone: string, otp: string): Promise<LoginResponse> => {
    console.log(`Mock: Verifying OTP ${otp} for ${phone}`);
    // Returning a dummy response so the OTPVerificationForm doesn't throw an error.
    // The actual "1234" check and redirect is safely handled in your page.tsx!
    return Promise.resolve({
      token: 'mock-otp-token',
      user: {
        id: 'sys-001',
        name: 'System User',
        role: 'Staff'
      }
    });

    // Future API call: 
    // return apiClient.post<LoginResponse>('/auth/verify-otp', { phone, otp });
  }
};