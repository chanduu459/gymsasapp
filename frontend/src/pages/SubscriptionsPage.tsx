import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Subscription, User, Plan } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Loader2, Calendar, Search, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function SubscriptionsPage() {
  const { user: currentUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    autoRenew: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsRes, membersRes, plansRes] = await Promise.all([
        api.getSubscriptions(),
        api.getMembers(),
        api.getPlans(),
      ]);

      if (subsRes.success && subsRes.data) {
        setSubscriptions(subsRes.data);
      }
      if (membersRes.success && membersRes.data) {
        setMembers(membersRes.data);
      }
      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
      }
    } catch (error: any) {
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.createSubscription(
        formData.userId,
        formData.planId,
        formData.startDate,
        formData.autoRenew
      );

      if (response.success && response.data) {
        toast.success('Subscription created successfully');
        setSubscriptions((prev) => {
          const existingIndex = prev.findIndex((sub) => sub.user_id === response.data!.user_id);
          if (existingIndex === -1) {
            return [response.data!, ...prev];
          }

          return prev.map((sub, index) => (index === existingIndex ? response.data! : sub));
        });
        setIsDialogOpen(false);
        setFormData({
          userId: '',
          planId: '',
          startDate: new Date().toISOString().split('T')[0],
          autoRenew: false,
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      (sub as any).user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub as any).user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub as any).plan_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canCreateSubscription = currentUser?.role === 'owner' || currentUser?.role === 'staff';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-500 mt-1">Manage member subscriptions</p>
        </div>
        {canCreateSubscription && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Subscription</DialogTitle>
                <DialogDescription>
                  Assign a membership plan to a member.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">Member</Label>
                    <Select
                      value={formData.userId}
                      onValueChange={(value) => setFormData({ ...formData, userId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.filter(m => m.is_active).map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planId">Plan</Label>
                    <Select
                      value={formData.planId}
                      onValueChange={(value) => setFormData({ ...formData, planId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.filter(p => p.is_active).map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - ${plan.price} / {plan.duration_days} days
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !formData.userId || !formData.planId}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Subscription'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search subscriptions by member or plan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Subscriptions ({filteredSubscriptions.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No subscriptions found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => {
                    const daysLeft = getDaysUntilExpiry(sub.expiry_date);
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{(sub as any).user_name}</p>
                            <p className="text-sm text-gray-500">{(sub as any).user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{(sub as any).plan_name}</p>
                            <p className="text-sm text-gray-500">${(sub as any).plan_price}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                            {sub.status === 'active' ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Active
                              </>
                            ) : sub.status === 'expired' ? (
                              <>
                                <UserX className="w-3 h-3" />
                                Expired
                              </>
                            ) : (
                              <>
                                <Calendar className="w-3 h-3" />
                                Cancelled
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(sub.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(sub.expiry_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {sub.status === 'active' ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              daysLeft <= 0 
                                ? 'bg-red-100 text-red-800' 
                                : daysLeft <= 5 
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
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
    </div>
  );
}
