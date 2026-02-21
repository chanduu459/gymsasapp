export interface Gym {
  id: string;
  name: string;
  timezone: string;
  owner_user_id: string;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'owner' | 'staff' | 'member';
  is_active: boolean;
  face_image_url?: string | null;
  face_embedding?: number[] | null;
  created_at: string;
}

export interface Plan {
  id: string;
  tenant_id: string;
  name: string;
  price: number;
  duration_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled';
  auto_renew: boolean;
  last_notification_tags: string[];
  created_at: string;
  user?: User;
  plan?: Plan;
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  subscription_id: string | null;
  channel: 'email' | 'sms' | 'push' | 'inapp';
  template_name: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  user?: User;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  target: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Attendance {
  id: string;
  tenant_id: string;
  user_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'late' | 'leave' | 'holiday' | string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  role?: 'owner' | 'staff' | 'member';
}

export interface DashboardStats {
  activeMembers: number;
  expiringIn7Days: number;
  expiredMembers: number;
  monthlyRevenue: number;
  renewalRate: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
