import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import type { Attendance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Loader2, RefreshCw, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  late: 'bg-amber-100 text-amber-800',
  absent: 'bg-red-100 text-red-800',
  leave: 'bg-blue-100 text-blue-800',
  holiday: 'bg-purple-100 text-purple-800',
};

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<string>('present');

  const loadAttendance = async (date = selectedDate, statusValue = status) => {
    setIsLoading(true);
    try {
      const response = await api.getAttendance(date, statusValue);
      if (response.success && response.data) {
        setRecords(response.data);
      }
    } catch (error: any) {
      toast.error('Failed to load attendance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const presentCount = useMemo(
    () => records.filter((r) => (r.status || 'present') === 'present').length,
    [records]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1">Daily presence overview</p>
        </div>
        <Button variant="outline" onClick={() => loadAttendance()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {selectedDate}
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="sm:w-44"
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="present">Present</option>
              <option value="all">All</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
            </select>
            <Button
              onClick={() => loadAttendance(selectedDate, status)}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Apply
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserX className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  Present: {presentCount}
                </span>
                <span>Total: {records.length}</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{record.full_name || record.user_id}</p>
                            <p className="text-sm text-gray-500 capitalize">{record.role || 'member'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            <div>{record.email || '-'}</div>
                            <div>{record.phone || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[record.status] || 'bg-gray-100 text-gray-700'}`}>
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {record.check_in ? new Date(record.check_in).toLocaleTimeString() : '-'}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {record.check_out ? new Date(record.check_out).toLocaleTimeString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
