import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Calendar, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'planned_absence';
  status_display: string;
  check_in_time: string | null;
  check_out_time: string | null;
  reason: string;
  is_planned: boolean;
  verified_by_delegator: boolean;
  verified_by_advisor: boolean;
}

interface TodayAttendance {
  date: string;
  status: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  message?: string;
}

export default function TeacherAttendanceWidget() {
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [absenceDate, setAbsenceDate] = useState('');
  const [absenceEndDate, setAbsenceEndDate] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get<TodayAttendance>('/teacher-attendance/today/');
      setTodayAttendance(response.data);
    } catch (error: any) {
      console.error('Error fetching today attendance:', error);
      if (error.response?.status === 404) {
        // No attendance marked yet
        setTodayAttendance({
          date: new Date().toISOString().split('T')[0],
          status: null,
          check_in_time: null,
          check_out_time: null,
          message: 'No attendance marked for today'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPresent = async () => {
    try {
      setActionLoading(true);
      await api.post('/teacher-attendance/mark_present/');
      toast({
        title: 'Marked Present',
        description: 'Your attendance has been recorded for today.',
      });
      await fetchTodayAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to mark attendance',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      await api.post('/teacher-attendance/check_out/');
      toast({
        title: 'Checked Out',
        description: 'Your departure time has been recorded.',
      });
      await fetchTodayAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to record check-out',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportAbsence = async () => {
    if (!absenceDate || !absenceReason) {
      toast({
        title: 'Validation Error',
        description: 'Please provide date and reason for absence',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);
      await api.post('/teacher-attendance/report_absence/', {
        date: absenceDate,
        end_date: absenceEndDate || absenceDate,
        reason: absenceReason,
      });
      
      const days = absenceEndDate && absenceEndDate !== absenceDate 
        ? Math.ceil((new Date(absenceEndDate).getTime() - new Date(absenceDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1;
      
      toast({
        title: 'Absence Reported',
        description: `Your planned absence for ${days} day(s) has been reported to delegators.`,
      });
      
      setAbsenceDialogOpen(false);
      setAbsenceDate('');
      setAbsenceEndDate('');
      setAbsenceReason('');
      await fetchTodayAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to report absence',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;

    const statusConfig: Record<string, { color: string; icon: any }> = {
      present: { color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700', icon: CheckCircle },
      absent: { color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700', icon: XCircle },
      late: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700', icon: Clock },
      planned_absence: { color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700', icon: Calendar },
    };

    const config = statusConfig[status];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
          <CardDescription>Loading attendance status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>{today}</CardDescription>
          </div>
          {todayAttendance?.status && getStatusBadge(todayAttendance.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Check-in/Check-out Times */}
          {todayAttendance?.check_in_time && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Check-in Time</Label>
                <p className="text-lg font-semibold">
                  {new Date(`2000-01-01T${todayAttendance.check_in_time}`).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {todayAttendance?.check_out_time && (
                <div>
                  <Label className="text-sm text-muted-foreground">Check-out Time</Label>
                  <p className="text-lg font-semibold">
                    {new Date(`2000-01-01T${todayAttendance.check_out_time}`).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!todayAttendance?.status && (
              <Button
                onClick={handleMarkPresent}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Present
                  </>
                )}
              </Button>
            )}

            {todayAttendance?.status === 'present' && !todayAttendance?.check_out_time && (
              <Button
                onClick={handleCheckOut}
                disabled={actionLoading}
                variant="outline"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Check Out
                  </>
                )}
              </Button>
            )}

            <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Report Absence
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Planned Absence</DialogTitle>
                  <DialogDescription>
                    Report a planned absence to notify delegators. This is for future absences only.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="absence-date">Start Date *</Label>
                    <Input
                      id="absence-date"
                      type="date"
                      value={absenceDate}
                      onChange={(e) => setAbsenceDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="absence-end-date">End Date (Optional)</Label>
                    <Input
                      id="absence-end-date"
                      type="date"
                      value={absenceEndDate}
                      onChange={(e) => setAbsenceEndDate(e.target.value)}
                      min={absenceDate || new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank for single-day absence
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="absence-reason">Reason *</Label>
                    <Textarea
                      id="absence-reason"
                      value={absenceReason}
                      onChange={(e) => setAbsenceReason(e.target.value)}
                      placeholder="e.g., Medical appointment, Professional training, Personal leave..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setAbsenceDialogOpen(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReportAbsence}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Reporting...
                        </>
                      ) : (
                        'Report Absence'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Info Message */}
          {!todayAttendance?.status && (
            <p className="text-sm text-muted-foreground">
              Please mark your attendance before marking student attendance.
            </p>
          )}
          
          {todayAttendance?.status === 'present' && todayAttendance?.check_out_time && (
            <p className="text-sm text-green-600">
              ✓ You have completed your attendance for today. Have a great evening!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
