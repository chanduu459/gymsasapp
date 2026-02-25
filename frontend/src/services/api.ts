import type { User, Gym, Plan, Subscription, Notification, DashboardStats, ApiResponse, Attendance } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Auth
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(gymName: string, ownerName: string, email: string, phone: string, password: string, timezone?: string): Promise<ApiResponse<{ gym: Gym }>> {
    return this.fetch('/api/gyms/register', {
      method: 'POST',
      body: JSON.stringify({ gymName, ownerName, email, phone, password, timezone }),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.fetch('/api/auth/me');
  }

  async identifyFace(imageBase64: string): Promise<ApiResponse<{
    member: User | null;
    confidence: number;
    recognized: boolean;
    message?: string;
    subscription: {
      id: string;
      status: string;
      start_date: string;
      expiry_date: string;
      auto_renew: boolean;
      plan_name: string;
      plan_price: number;
      duration_days: number;
      days_remaining: number;
    } | null;
  }>> {
    return this.fetch('/api/auth/identify-face', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    });
  }

  // Members
  async getMembers(): Promise<ApiResponse<User[]>> {
    return this.fetch('/api/members');
  }

  async createMember(fullName: string, email: string, phone: string, password?: string, faceImage?: File): Promise<ApiResponse<User>> {
    if (faceImage) {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      if (password) {
        formData.append('password', password);
      }
      formData.append('faceImage', faceImage);

      return this.fetch('/api/members', {
        method: 'POST',
        body: formData,
      });
    }

    return this.fetch('/api/members', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, phone, password }),
    });
  }

  async updateMember(id: string, data: Partial<User>, faceImage?: File): Promise<ApiResponse<User>> {
    if (faceImage) {
      const formData = new FormData();
      formData.append('fullName', data.full_name || '');
      formData.append('email', data.email || '');
      formData.append('phone', data.phone || '');
      formData.append('isActive', String(data.is_active ?? true));
      formData.append('faceImage', faceImage);

      return this.fetch(`/api/members/${id}`, {
        method: 'PUT',
        body: formData,
      });
    }

    return this.fetch(`/api/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async syncMemberFaces(): Promise<ApiResponse<{ message: string; total: number; success: number; failed: number; errors: string[] }>> {
    return this.fetch('/api/members/sync-faces', {
      method: 'POST',
    });
  }

  // Plans
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    return this.fetch('/api/plans');
  }

  async createPlan(name: string, price: number, durationDays: number, description?: string): Promise<ApiResponse<Plan>> {
    return this.fetch('/api/plans', {
      method: 'POST',
      body: JSON.stringify({ name, price, durationDays, description }),
    });
  }

  // Subscriptions
  async getSubscriptions(): Promise<ApiResponse<Subscription[]>> {
    return this.fetch('/api/subscriptions');
  }

  async createSubscription(userId: string, planId: string, startDate: string, autoRenew?: boolean): Promise<ApiResponse<Subscription>> {
    return this.fetch('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ userId, planId, startDate, autoRenew }),
    });
  }

  async getExpiringSubscriptions(days: number = 5): Promise<ApiResponse<Subscription[]>> {
    return this.fetch(`/api/subscriptions/expiring?days=${days}`);
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.fetch('/api/dashboard/stats');
  }

  // Notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return this.fetch('/api/notifications');
  }

  // Audit Logs
  async getAuditLogs(): Promise<ApiResponse<any[]>> {
    return this.fetch('/api/audit-logs');
  }

  // Attendance
  async getAttendance(date?: string, status: string = 'present'): Promise<ApiResponse<Attendance[]>> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (status) params.append('status', status);
    const query = params.toString();
    return this.fetch(`/api/attendance${query ? `?${query}` : ''}`);
  }

  async faceCheckin(imageBase64: string): Promise<ApiResponse<{ member: { id: string; full_name: string; email: string }; attendance: Attendance; confidence: number; isCheckout: boolean }>> {
    return this.fetch('/api/attendance/face-checkin', {
      method: 'POST',
      body: JSON.stringify({ imageData: imageBase64 }),
    });
  }

  // Cron
  async runExpiryCheck(): Promise<ApiResponse<any>> {
    return this.fetch('/api/cron/check-expiring', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
