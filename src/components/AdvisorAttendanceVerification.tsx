import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { CheckCircle, XCircle, Clock, Calendar, Loader2, Eye, CheckCheck, AlertCircle } from 'lucide-react';

interface Teacher {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AttendanceRecord {
  id: number;
  teacher: number;
  teacher_name: string;
  teacher_username: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'planned_absence';
  status_display: string;
  check_in_time: string | null;
  check_out_time: string | null;
  reason: string;
  is_planned: boolean;
  verified_by_delegator: boolean;
  verified_by_advisor: boolean;
  delegator_notes: string;
  advisor_notes: string;
  teaching_plan: number | null;
  teaching_plan_title: string | null;
}

interface AttendanceStatistics {
  records: AttendanceRecord[];
  statistics: {
    total_days: number;
    present: number;
    absent: number;
    late: number;
    planned_absence: number;
    attendance_rate: number;
  };
}

export default function AdvisorAttendanceVerification() {
  const { t } = useLanguage();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attendanceData, setAttendanceData] = useState<AttendanceStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeachers();
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchTeachers = async () => {
    try {
      // Fetch teachers from your existing API endpoint
      const response = await api.get('/group-chats/subject-teachers/');
      setTeachers(response.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teachers list',
        variant: 'destructive',
      });
    }
  };

  const fetchAttendance = async () => {
    if (!selectedTeacherId) {
      toast({
        title: t('common.warning'),
        description: t('select.teacher'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        teacher_id: selectedTeacherId,
      });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await api.get<AttendanceStatistics>(
        `/teacher-attendance/by_teacher/?${params.toString()}`
      );
      setAttendanceData(response.data);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load attendance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedRecord) return;

    try {
      setVerifying(true);
      await api.post(`/teacher-attendance/${selectedRecord.id}/verify/`, {
        verified: true,
        notes: verificationNotes,
      });

      toast({
        title: 'Verified',
        description: 'Attendance record has been verified successfully',
      });

      setVerifyDialogOpen(false);
      setVerificationNotes('');
      setSelectedRecord(null);
      
      // Refresh data
      await fetchAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to verify attendance',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      present: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      absent: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
      late: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      planned_absence: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Calendar },
    };

    const config = statusConfig[status];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Attendance Verification</CardTitle>
        <CardDescription>
          View and verify teacher attendance records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="teacher-select">{t('select.teacher')}</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger id="teacher-select">
                  <SelectValue placeholder={t('choose.teacher')} />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.first_name} {teacher.last_name} (@{teacher.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={fetchAttendance} disabled={loading || !selectedTeacherId}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                View Attendance
              </>
            )}
          </Button>

          {/* Statistics */}
          {attendanceData && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Total Days</div>
                  <div className="text-2xl font-bold">{attendanceData.statistics.total_days}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Present</div>
                  <div className="text-2xl font-bold text-green-600">
                    {attendanceData.statistics.present}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Absent</div>
                  <div className="text-2xl font-bold text-red-600">
                    {attendanceData.statistics.absent}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Late</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {attendanceData.statistics.late}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Planned</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceData.statistics.planned_absence}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rate</div>
                  <div className="text-2xl font-bold">
                    {attendanceData.statistics.attendance_rate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No attendance records found for the selected period
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceData.records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            {record.check_in_time
                              ? new Date(`2000-01-01T${record.check_in_time}`).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {record.check_out_time
                              ? new Date(`2000-01-01T${record.check_out_time}`).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {record.verified_by_advisor ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!record.verified_by_advisor && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setVerificationNotes(record.advisor_notes || '');
                                  setVerifyDialogOpen(true);
                                }}
                              >
                                Verify
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        {/* Verification Dialog */}
        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Attendance</DialogTitle>
              <DialogDescription>
                Verify the attendance record for{' '}
                {selectedRecord && new Date(selectedRecord.date).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedRecord && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Teacher:</span>
                    <span className="font-medium">{selectedRecord.teacher_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedRecord.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Check-in:</span>
                    <span className="font-medium">
                      {selectedRecord.check_in_time
                        ? new Date(`2000-01-01T${selectedRecord.check_in_time}`).toLocaleTimeString()
                        : '-'}
                    </span>
                  </div>
                  {selectedRecord.reason && (
                    <div>
                      <span className="text-sm text-muted-foreground">Reason:</span>
                      <p className="text-sm mt-1">{selectedRecord.reason}</p>
                    </div>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="verification-notes">Verification Notes (Optional)</Label>
                <Textarea
                  id="verification-notes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setVerifyDialogOpen(false)}
                  disabled={verifying}
                >
                  Cancel
                </Button>
                <Button onClick={handleVerify} disabled={verifying}>
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Confirm Verification
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
