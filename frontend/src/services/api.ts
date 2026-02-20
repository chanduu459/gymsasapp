import type { User, Gym, Plan, Subscription, Notification, DashboardStats, ApiResponse, Attendance } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

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

  // Members
  async getMembers(): Promise<ApiResponse<User[]>> {
    return this.fetch('/api/members');
  }

  async createMember(fullName: string, email: string, phone: string, password?: string): Promise<ApiResponse<User>> {
    return this.fetch('/api/members', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, phone, password }),
    });
  }

  async updateMember(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.fetch(`/api/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  // Cron
  async runExpiryCheck(): Promise<ApiResponse<any>> {
    return this.fetch('/api/cron/check-expiring', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
