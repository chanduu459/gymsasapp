import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Notification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Mail, MessageSquare, Smartphone, Bell, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const channelIcons = {
  email: Mail,
  sms: Smartphone,
  push: Bell,
  inapp: MessageSquare,
};

const statusIcons = {
  sent: Check,
  failed: X,
  pending: Loader2,
};

const statusColors = {
  sent: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100',
  pending: 'text-amber-600 bg-amber-100',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateDisplayName = (templateName: string) => {
    const names: Record<string, string> = {
      'expiry_5d_member': '5-Day Expiry Reminder (Member)',
      'expiry_5d_owner': '5-Day Expiry Alert (Owner)',
      'expiry_3d_member': '3-Day Expiry Reminder (Member)',
      'expiry_1d_member': '1-Day Expiry Reminder (Member)',
      'welcome': 'Welcome Email',
      'payment_received': 'Payment Confirmation',
    };
    return names[templateName] || templateName;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Track all sent notifications and reminders</p>
        </div>
        <Button variant="outline" onClick={loadNotifications} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sent</CardTitle>
            <Mail className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.status === 'sent').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            <Loader2 className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {notifications.filter(n => n.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Failed</CardTitle>
            <X className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter(n => n.status === 'failed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Email Notifications</CardTitle>
            <Mail className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter(n => n.channel === 'email').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notification History ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No notifications yet</p>
              <p className="text-sm mt-1">Notifications will appear here when sent</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => {
                    const ChannelIcon = channelIcons[notification.channel];
                    const StatusIcon = statusIcons[notification.status];
                    return (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{(notification as any).user_name}</p>
                            <p className="text-sm text-gray-500">{notification.user_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ChannelIcon className="w-4 h-4 text-gray-500" />
                            <span className="capitalize text-gray-600">{notification.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {getTemplateDisplayName(notification.template_name)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[notification.status]}`}>
                            <StatusIcon className={`w-3 h-3 ${notification.status === 'pending' ? 'animate-spin' : ''}`} />
                            <span className="capitalize">{notification.status}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {notification.sent_at 
                            ? new Date(notification.sent_at).toLocaleString()
                            : notification.status === 'pending'
                              ? 'Queued'
                              : '-'
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Notification System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Member Notifications</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  5-day expiry reminder (Email → SMS fallback)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Welcome email on registration
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Payment confirmations
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Owner Notifications</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Daily expiry alerts (Email + In-app)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  New member registrations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Payment received notifications
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Idempotency:</strong> Each notification tag is tracked to prevent duplicate reminders. 
              The system runs daily at 00:30 to check for expiring subscriptions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
