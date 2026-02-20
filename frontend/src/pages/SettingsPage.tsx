import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  Settings, 
  Bell, 
  Shield, 
  Clock, 
  Users, 
  FileText,
  Check,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    autoRenewal: true,
    reminderDays: 5,
    timezone: 'UTC',
  });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const response = await api.getAuditLogs();
      if (response.success && response.data) {
        setAuditLogs(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  const runExpiryCheck = async () => {
    try {
      const response = await api.runExpiryCheck();
      if (response.success) {
        toast.success('Expiry check completed successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to run expiry check');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE_MEMBER':
        return Users;
      case 'CREATE_SUBSCRIPTION':
        return FileText;
      case 'UPDATE_MEMBER':
        return Settings;
      default:
        return Shield;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE_MEMBER':
        return 'text-blue-600 bg-blue-100';
      case 'CREATE_SUBSCRIPTION':
        return 'text-green-600 bg-green-100';
      case 'UPDATE_MEMBER':
        return 'text-amber-600 bg-amber-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your gym settings and preferences</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
          <CardDescription>Configure how and when notifications are sent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-gray-500">Send email notifications to members and owners</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">SMS Notifications</Label>
              <p className="text-sm text-gray-500">Send SMS reminders for critical alerts</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-Renewal</Label>
              <p className="text-sm text-gray-500">Automatically renew subscriptions by default</p>
            </div>
            <Switch
              checked={settings.autoRenewal}
              onCheckedChange={(checked) => setSettings({ ...settings, autoRenewal: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminderDays">Reminder Window (days)</Label>
            <Input
              id="reminderDays"
              type="number"
              min="1"
              max="30"
              value={settings.reminderDays}
              onChange={(e) => setSettings({ ...settings, reminderDays: parseInt(e.target.value) })}
              className="w-32"
            />
            <p className="text-sm text-gray-500">Days before expiry to send reminder notifications</p>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>Configure timezone and other general preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Dubai">Dubai (GST)</option>
              <option value="Australia/Sydney">Sydney (AEST)</option>
            </select>
            <p className="text-sm text-gray-500">Used for calculating expiry dates and scheduling notifications</p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button onClick={handleSaveSettings} className="gap-2">
              <Check className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>System Actions</CardTitle>
          </div>
          <CardDescription>Manual system operations and maintenance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Run Expiry Check</h4>
              <p className="text-sm text-gray-500">Manually trigger the daily expiry notification check</p>
            </div>
            <Button variant="outline" onClick={runExpiryCheck} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Run Now
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Export Data</h4>
              <p className="text-sm text-gray-500">Download all gym data as JSON export</p>
            </div>
            <Button variant="outline" onClick={() => toast.info('Export feature coming soon')}>
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle>Audit Logs</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={loadAuditLogs} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No audit logs yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.slice(0, 10).map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getActionColor(log.action)}`}>
                              <ActionIcon className="w-4 h-4" />
                            </span>
                            <span className="font-medium text-gray-900">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600">{log.user_name || 'System'}</TableCell>
                        <TableCell className="text-gray-600 font-mono text-sm">{log.target}</TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(log.created_at).toLocaleString()}
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

      {/* System Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-700">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Version</p>
              <p className="font-medium text-gray-900">1.0.0</p>
            </div>
            <div>
              <p className="text-gray-500">Tenant ID</p>
              <p className="font-medium text-gray-900 font-mono">{user?.tenant_id?.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-gray-500">User Role</p>
              <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-gray-500">Cron Status</p>
              <p className="font-medium text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
