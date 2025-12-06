import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Users, Calendar as CalendarIcon, TrendingUp, User } from 'lucide-react';
import { format } from 'date-fns';

interface Child {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AttendanceRecord {
  id: number;
  student: number;
  student_name: string;
  teacher: number;
  teacher_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  status_display: string;
  notes: string;
  marked_at: string;
}

interface AttendanceSummary {
  id: number;
  user: number;
  user_name: string;
  month: string;
  month_display: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_rate: number;
  last_updated: string;
}

export default function ParentChildAttendance() {
  const { t, dir } = useLanguage();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChildren();
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchAttendance();
      fetchSummary();
    }
  }, [selectedChildId, startDate, endDate]);

  const fetchChildren = async () => {
    try {
      const response = await api.get('/parent-students/my_students/');
      console.log('Raw parent-students response:', JSON.stringify(response.data, null, 2));
      
      // Extract student data from relationships
      const childrenData = response.data
        .map((rel: any) => {
          // student_info should be a full user object
          const student = rel.student_info;
          if (!student || typeof student !== 'object') {
            console.warn('Invalid student_info:', student, 'Full relationship:', rel);
            return null;
          }
          return {
            id: student.id,
            username: student.username || '',
            first_name: student.first_name || '',
            last_name: student.last_name || '',
            email: student.email || '',
          };
        })
        .filter((child: any) => child !== null && child.id); // Filter out invalid entries
      
      console.log('Processed children data:', childrenData);
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChildId(childrenData[0].id.toString());
      }
    } catch (error: any) {
      console.error('Error fetching children:', error);
      toast({
        title: t('common.error'),
        description: t('parent.failedToLoadChildren'),
        variant: 'destructive',
      });
    }
  };

  const fetchAttendance = async () => {
    if (!selectedChildId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('student', selectedChildId);

      const response = await api.get(`/student-attendance/?${params.toString()}`);
      setAttendanceRecords(response.data || []);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      toast({
        title: t('common.error'),
        description: t('parent.failedToLoadAttendance'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!selectedChildId) return;

    try {
      const monthDate = startDate || new Date().toISOString().split('T')[0];
      const response = await api.get(`/attendance-summaries/?user=${selectedChildId}&month=${monthDate}`);
      if (response.data && response.data.length > 0) {
        setSummary(response.data[0]);
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummary(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      present: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, label: t('parent.PRESENT') },
      absent: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: t('parent.ABSENT') },
      late: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, label: t('parent.LATE') },
      excused: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: AlertCircle, label: t('parent.EXCUSED') },
    };

    const config = statusConfig[status];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const selectedChild = children.find(c => c?.id?.toString() === selectedChildId);

  return (
    <div className="space-y-6" dir={dir}>
      {/* Child Selection and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('parent.childAttendanceRecords')}
          </CardTitle>
          <CardDescription>
            {t('parent.viewChildAttendance')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Label htmlFor="child-select">{t('parent.selectChild')}</Label>
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger id="child-select">
                  <SelectValue placeholder={t('parent.chooseChild')} />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id.toString()}>
                      {child.first_name} {child.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date">{t('parent.startDate')}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">{t('parent.endDate')}</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('parent.monthlySummary')} - {summary.month_display}
            </CardTitle>
            <CardDescription>
              {t('parent.attendanceStatisticsFor')} {selectedChild?.first_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">{t('parent.totalDays')}</div>
                <div className="text-2xl font-bold">{summary.total_days}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">{t('parent.present')}</div>
                <div className="text-2xl font-bold text-green-600">
                  {summary.present_days}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">{t('parent.absent')}</div>
                <div className="text-2xl font-bold text-red-600">
                  {summary.absent_days}
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">{t('parent.late')}</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {summary.late_days}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">{t('parent.excused')}</div>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.excused_days}
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">{t('parent.rate')}</div>
                <div className={`text-2xl font-bold ${getAttendanceRateColor(summary.attendance_rate)}`}>
                  {summary.attendance_rate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t('parent.attendanceProgress')}</span>
                <span className={`font-medium ${getAttendanceRateColor(summary.attendance_rate)}`}>
                  {summary.present_days} / {summary.total_days} {t('parent.days')}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    summary.attendance_rate >= 90
                      ? 'bg-green-500'
                      : summary.attendance_rate >= 75
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${summary.attendance_rate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t('parent.dailyAttendanceRecords')}
          </CardTitle>
          <CardDescription>
            {attendanceRecords.length} {t('parent.recordsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('parent.noAttendanceRecords')}</p>
              <p className="text-sm mt-2">
                {t('parent.teachersWillMarkAttendance')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {getStatusBadge(record.status)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{t('parent.markedBy')}: <span className="font-medium text-foreground">{record.teacher_name}</span></span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {t('parent.recordedAt')}:{' '}
                            {new Date(record.marked_at).toLocaleString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </p>
                        {record.notes && (
                          <div className="mt-2 p-2 bg-muted rounded">
                            <p className="text-sm">
                              <span className="font-medium">{t('parent.teachersNote')}:</span> {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* No Children Message */}
      {children.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">{t('parent.noChildrenAssociated')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('parent.contactSchoolAdmin')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
