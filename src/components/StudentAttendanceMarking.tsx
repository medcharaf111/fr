import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/lib/api';
import { AlertCircle, CheckCircle, Clock, Loader2, Save, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Student {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface StudentAttendanceData {
  student_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string;
}

interface TeacherAttendance {
  date: string;
  status: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  message?: string;
}

export default function StudentAttendanceMarking() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Map<number, StudentAttendanceData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance | null>(null);
  const [existingRecords, setExistingRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
    checkTeacherAttendance();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchExistingAttendance();
    }
  }, [selectedDate]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Fetch assigned students from teacher-student relationships
      const response = await api.get('/relationships/my-students/');
      console.log('My students response:', response.data);
      
      // Extract students from relationship records
      const relationships = Array.isArray(response.data) ? response.data : [];
      const studentsList = relationships
        .map((rel: any) => rel.student_info || rel.student) // Try student_info first, fallback to student ID
        .filter((student: any) => student != null && typeof student === 'object'); // Only keep valid student objects
      
      console.log('Extracted students:', studentsList);
      setStudents(studentsList);
      
      // Initialize attendance data for all students
      const initialData = new Map();
      studentsList.forEach((student: Student) => {
        initialData.set(student.id, {
          student_id: student.id,
          status: 'present',
          notes: '',
        });
      });
      setAttendanceData(initialData);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || error.response?.data?.error || 'Failed to load students list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTeacherAttendance = async () => {
    try {
      const response = await api.get<TeacherAttendance>('/teacher-attendance/today/');
      setTeacherAttendance(response.data);
    } catch (error) {
      console.error('Error checking teacher attendance:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const response = await api.get(`/student-attendance/by_date/?date=${selectedDate}`);
      setExistingRecords(response.data.records || []);
      
      // Pre-fill existing attendance data
      if (response.data.records && response.data.records.length > 0) {
        const updatedData = new Map(attendanceData);
        response.data.records.forEach((record: any) => {
          updatedData.set(record.student, {
            student_id: record.student,
            status: record.status,
            notes: record.notes || '',
          });
        });
        setAttendanceData(updatedData);
      }
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
    }
  };

  const updateAttendance = (studentId: number, field: 'status' | 'notes', value: string) => {
    const updatedData = new Map(attendanceData);
    const current = updatedData.get(studentId) || {
      student_id: studentId,
      status: 'present' as const,
      notes: '',
    };
    updatedData.set(studentId, {
      ...current,
      [field]: value,
    });
    setAttendanceData(updatedData);
  };

  const setAllStatus = (status: 'present' | 'absent') => {
    const updatedData = new Map(attendanceData);
    students.forEach((student) => {
      const current = updatedData.get(student.id) || {
        student_id: student.id,
        status: 'present' as const,
        notes: '',
      };
      updatedData.set(student.id, {
        ...current,
        status,
      });
    });
    setAttendanceData(updatedData);
    toast({
      title: 'Updated',
      description: `All students marked as ${status}`,
    });
  };

  const handleSaveAttendance = async () => {
    // Check if teacher is marked present
    if (!teacherAttendance || teacherAttendance.status !== 'present') {
      toast({
        title: 'Cannot Mark Attendance',
        description: 'You must mark yourself present before marking student attendance',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const attendanceArray = Array.from(attendanceData.values());
      
      console.log('Sending attendance data:', {
        date: selectedDate,
        students: attendanceArray,
      });
      
      await api.post('/student-attendance/bulk_mark/', {
        date: selectedDate,
        students: attendanceArray,
      });

      toast({
        title: 'Attendance Saved',
        description: `Attendance marked for ${attendanceArray.length} students`,
      });

      await fetchExistingAttendance();
    } catch (error: any) {
      console.error('Attendance save error:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.response?.data?.students?.[0] || 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      present: { color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700', icon: CheckCircle, label: t('attendance.status.present') },
      absent: { color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700', icon: XCircle, label: t('attendance.status.absent') },
      late: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700', icon: Clock, label: t('attendance.status.late') },
      excused: { color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700', icon: AlertCircle, label: t('attendance.status.excused') },
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

  const canMarkAttendance = teacherAttendance?.status === 'present';
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('attendance.title')}
            </CardTitle>
            <CardDescription>
              {t('attendance.description')}
            </CardDescription>
          </div>
          {existingRecords.length > 0 && (
            <Badge variant="outline" className="text-blue-600">
              {t('attendance.recordsFound').replace('{n}', existingRecords.length.toString())}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Warning if teacher not present */}
          {!canMarkAttendance && isToday && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">{t('attendance.cannotMark')}</p>
                <p className="text-sm text-orange-700 mt-1">
                  {t('attendance.mustMarkPresent')}
                </p>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="attendance-date">{t('attendance.selectDate')}</Label>
              <Input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllStatus('present')}
                disabled={!canMarkAttendance || saving}
                className="bg-green-50 hover:bg-green-100"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {t('attendance.allPresent')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllStatus('absent')}
                disabled={!canMarkAttendance || saving}
                className="bg-red-50 hover:bg-red-100"
              >
                <XCircle className="h-4 w-4 mr-1" />
                {t('attendance.allAbsent')}
              </Button>
            </div>
          </div>

          {/* Students List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('attendance.noStudents')}</p>
              <p className="text-sm mt-1">{t('attendance.noStudents.desc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const attendance = attendanceData.get(student.id);
                const existingRecord = existingRecords.find(r => r.student === student.id);
                
                return (
                  <div
                    key={student.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Student Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          <span className="text-sm text-muted-foreground">
                            @{student.username}
                          </span>
                          {existingRecord && (
                            <Badge variant="outline" className="text-xs">
                              {t('attendance.previouslyMarked')}
                            </Badge>
                          )}
                        </div>

                        {/* Status Selection */}
                        <div className="flex gap-2 mb-2">
                          {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                            <label
                              key={status}
                              className={`
                                flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer
                                transition-all
                                ${attendance?.status === status
                                  ? 'border-primary bg-primary/5 font-medium'
                                  : 'border-muted hover:border-primary/50'
                                }
                                ${!canMarkAttendance ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              <input
                                type="radio"
                                name={`status-${student.id}`}
                                value={status}
                                checked={attendance?.status === status}
                                onChange={(e) => updateAttendance(student.id, 'status', e.target.value)}
                                disabled={!canMarkAttendance}
                                className="sr-only"
                              />
                              {getStatusBadge(status)}
                            </label>
                          ))}
                        </div>

                        {/* Notes */}
                        <Textarea
                          placeholder={t('attendance.notesPlaceholder')}
                          value={attendance?.notes || ''}
                          onChange={(e) => updateAttendance(student.id, 'notes', e.target.value)}
                          disabled={!canMarkAttendance}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save Button */}
          {students.length > 0 && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={handleSaveAttendance}
                disabled={!canMarkAttendance || saving || students.length === 0}
                className="bg-primary"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('attendance.saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('attendance.saveButton')} ({t('attendance.studentsCount').replace('{n}', students.length.toString())})
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Summary Stats */}
          {existingRecords.length > 0 && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">{t('attendance.stats.total')}</div>
                <div className="text-2xl font-bold">{existingRecords.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('attendance.stats.present')}</div>
                <div className="text-2xl font-bold text-green-600">
                  {existingRecords.filter(r => r.status === 'present').length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('attendance.stats.absent')}</div>
                <div className="text-2xl font-bold text-red-600">
                  {existingRecords.filter(r => r.status === 'absent').length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('attendance.stats.late')}</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {existingRecords.filter(r => r.status === 'late').length}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
