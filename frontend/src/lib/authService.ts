const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2026';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name?: string;
    hasPassword: boolean;
    isVerified: boolean;
    isNewUser: boolean;
  };
}

interface OtpResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

interface ProfileResponse {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  hasPassword: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1/auth`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }

  private getAuthHeader(token: string): HeadersInit {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // OTP Methods
  async requestOtp(email: string): Promise<OtpResponse> {
    return this.request<OtpResponse>('/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email: string, otp: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resendOtp(email: string): Promise<OtpResponse> {
    return this.request<OtpResponse>('/otp/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Password Methods
  async loginWithPassword(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async setPassword(password: string, confirmPassword: string, accessToken: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/set-password', {
      method: 'POST',
      headers: this.getAuthHeader(accessToken),
      body: JSON.stringify({ password, confirmPassword }),
    });
  }

  async forgotPassword(email: string): Promise<OtpResponse> {
    return this.request<OtpResponse>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string, accessToken: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/change-password', {
      method: 'POST',
      headers: this.getAuthHeader(accessToken),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Token Methods
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    return this.request('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Profile Methods
  async getProfile(accessToken: string): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/profile', {
      method: 'GET',
      headers: this.getAuthHeader(accessToken),
    });
  }

  async updateProfile(updates: { name?: string; phone?: string }, accessToken: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/profile', {
      method: 'PATCH',
      headers: this.getAuthHeader(accessToken),
      body: JSON.stringify(updates),
    });
  }
}

export const authService = new AuthService();
export default authService;
