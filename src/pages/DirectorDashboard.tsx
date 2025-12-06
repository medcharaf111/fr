import DarkModeToggle from '@/components/DarkModeToggle';
import DashboardLayout from '@/components/DashboardLayout';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { authAPI, directorAPI } from '@/lib/api';
import {
  DirectorAssignmentsOverview,
  DirectorTeacherInfo,
  TeacherGradeAssignment
} from '@/types/api';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Plus,
  Save,
  Trash2,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DirectorDashboard = () => {
  const { t, language, setLanguage, dir } = useLanguage();
  const [user, setUser] = useState(authAPI.getCurrentUser());
  const [overview, setOverview] = useState<DirectorAssignmentsOverview | null>(null);
  const [teachers, setTeachers] = useState<DirectorTeacherInfo[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [editingAssignment, setEditingAssignment] = useState<TeacherGradeAssignment | null>(null);
  
  // Timetable state
  const [timetableTeacherId, setTimetableTeacherId] = useState<number | null>(null);
  const [timetableData, setTimetableData] = useState<any>({});
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<{[key: number]: {start_time: string, end_time: string, id?: number}}>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper function to get translated subject name
  const getSubjectLabel = (subjectValue: string) => {
    return t(`subject.${subjectValue}`) || subjectValue;
  };

  // Helper function to get translated grade name
  const getGradeLabel = (gradeValue: string) => {
    return t(`grade.${gradeValue}`) || gradeValue;
  };

  // Dynamic grade and subject options based on current language
  const GRADE_LEVELS = useMemo(() => [
    { value: 'grade_1', label: t('grade.grade_1') },
    { value: 'grade_2', label: t('grade.grade_2') },
    { value: 'grade_3', label: t('grade.grade_3') },
    { value: 'grade_4', label: t('grade.grade_4') },
    { value: 'grade_5', label: t('grade.grade_5') },
    { value: 'grade_6', label: t('grade.grade_6') },
    { value: 'grade_7', label: t('grade.grade_7') },
    { value: 'grade_8', label: t('grade.grade_8') },
    { value: 'grade_9', label: t('grade.grade_9') },
    { value: 'grade_10', label: t('grade.grade_10') },
    { value: 'grade_11', label: t('grade.grade_11') },
    { value: 'grade_12', label: t('grade.grade_12') },
  ], [language, t]);

  const SUBJECTS = useMemo(() => [
    { value: 'math', label: t('subject.math') },
    { value: 'science', label: t('subject.science') },
    { value: 'english', label: t('subject.english') },
    { value: 'arabic', label: t('subject.arabic') },
    { value: 'social_studies', label: t('subject.social_studies') },
    { value: 'art', label: t('subject.art') },
    { value: 'music', label: t('subject.music') },
    { value: 'physical_education', label: t('subject.physical_education') },
    { value: 'computer_science', label: t('subject.computer_science') },
    { value: 'religious_studies', label: t('subject.religious_studies') },
  ], [language, t]);

  useEffect(() => {
    if (!user || user.role !== 'director') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, teachersRes] = await Promise.all([
        directorAPI.getAssignmentsOverview(),
        directorAPI.getAvailableTeachers(),
      ]);
      setOverview(overviewRes.data);
      setTeachers(teachersRes.data.teachers);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: t('common.error'),
        description: t('director.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const handleCreateAssignment = async () => {
    if (!selectedTeacher || !selectedGrade || !selectedSubject) {
      toast({
        title: t('common.validationError'),
        description: t('director.selectTeacherAndSubject'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await directorAPI.createAssignment({
        teacher: selectedTeacher,
        grade_level: selectedGrade,
        subject: selectedSubject,
        notes: assignmentNotes,
      });
      
      toast({
        title: t('common.success'),
        description: t('director.assignSuccess'),
      });
      
      setIsAssignDialogOpen(false);
      setSelectedTeacher(null);
      setSelectedGrade('');
      setSelectedSubject('');
      setAssignmentNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Assignment creation error:', error.response?.data);
      const errorMsg = error.response?.data?.non_field_errors?.[0] 
        || error.response?.data?.teacher?.[0]
        || error.response?.data?.subject?.[0]
        || error.response?.data?.grade_level?.[0]
        || error.response?.data?.detail
        || t('director.assignFailed');
      
      toast({
        title: t('common.error'),
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;

    try {
      await directorAPI.updateAssignment(editingAssignment.id, {
        grade_level: selectedGrade || editingAssignment.grade_level,
        subject: selectedSubject || editingAssignment.subject,
        notes: assignmentNotes,
      });
      
      toast({
        title: t('common.success'),
        description: t('director.updateSuccess'),
      });
      
      setIsEditDialogOpen(false);
      setEditingAssignment(null);
      setSelectedGrade('');
      setSelectedSubject('');
      setAssignmentNotes('');
      fetchData();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('director.updateFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm(t('director.deleteConfirm'))) return;

    try {
      await directorAPI.deleteAssignment(assignmentId);
      toast({
        title: t('common.success'),
        description: t('director.deleteSuccess'),
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('director.deleteFailed'),
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (assignment: TeacherGradeAssignment) => {
    setEditingAssignment(assignment);
    setSelectedGrade(assignment.grade_level);
    setSelectedSubject(assignment.subject);
    setAssignmentNotes(assignment.notes || '');
    setIsEditDialogOpen(true);
  };

  // Timetable handlers
  const loadTeacherTimetable = async (teacherId: number) => {
    setLoadingTimetable(true);
    try {
      const response = await directorAPI.getTeacherTimetable(teacherId);
      setTimetableData(response.data);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('timetable.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoadingTimetable(false);
    }
  };

  const handleSaveTimetable = async (dayOfWeek: number, scheduleData: any) => {
    if (!timetableTeacherId) {
      toast({
        title: t('common.error'),
        description: t('timetable.teacherNotSelected'),
        variant: 'destructive',
      });
      return;
    }

    // Validate times
    if (scheduleData.end_time <= scheduleData.start_time) {
      toast({
        title: t('common.error'),
        description: t('timetable.validation.invalidTime'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        teacher: timetableTeacherId,
        day_of_week: dayOfWeek,
        start_time: scheduleData.start_time,
        end_time: scheduleData.end_time,
        is_active: true,
      };

      if (scheduleData.id) {
        // Update existing schedule
        await directorAPI.updateTimetable(scheduleData.id, {
          start_time: scheduleData.start_time,
          end_time: scheduleData.end_time,
        });
      } else {
        // Create new schedule
        await directorAPI.createTimetable(data);
      }

      toast({
        title: t('common.success'),
        description: t('timetable.saveSuccess'),
      });

      // Clear editing state
      const newEditing = { ...editingSchedule };
      delete newEditing[dayOfWeek];
      setEditingSchedule(newEditing);

      // Reload timetable
      loadTeacherTimetable(timetableTeacherId);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('timetable.saveFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTimetable = async (timetableId: number) => {
    if (!confirm(t('timetable.confirmDelete'))) return;

    try {
      await directorAPI.deleteTimetable(timetableId);
      toast({
        title: t('common.success'),
        description: t('timetable.deleteSuccess'),
      });

      // Reload timetable
      if (timetableTeacherId) {
        loadTeacherTimetable(timetableTeacherId);
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('timetable.deleteFailed'),
        variant: 'destructive',
      });
    }
  };

  const getSubjectBadgeColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      math: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      science: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      english: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      arabic: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      social_studies: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      art: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
      music: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      physical_education: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      computer_science: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
      religious_studies: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
    };
    return colors[subject] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('director.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      userRole="director" 
      userName={user?.first_name || user?.username || 'Director'}
    >
      {/* Language & Theme Toggle Buttons */}
      <div className="flex justify-end gap-2 mb-4 p-3 px-4 bg-card rounded-lg border border-border/50">
        <DarkModeToggle />
        <LanguageToggle
          variant="outline"
          size="default"
        />
      </div>

      <div className="mb-6" dir={dir}>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{overview?.school_name}</h2>
      </div>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8" dir={dir}>
        <Card className="border-none shadow-lg bg-gradient-to-br from-cyan-500 to-cyan-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('director.stats.totalTeachers')}</CardTitle>
              <Users className="h-6 w-6 text-cyan-200" />
            </div>
            <CardDescription className="text-cyan-100">
              {t('director.stats.teachingStaff')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{overview?.total_teachers || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('director.stats.totalAssignments')}</CardTitle>
              <BookOpen className="h-6 w-6 text-blue-200" />
            </div>
            <CardDescription className="text-blue-100">
              {t('director.stats.subjectGradePairs')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview?.total_assignments || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('director.stats.unassigned')}</CardTitle>
              <AlertCircle className="h-6 w-6 text-orange-200" />
            </div>
            <CardDescription className="text-orange-100">
              {t('director.stats.teachersWithoutAssignments')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview?.unassigned_teachers_count || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-[400ms]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('director.stats.assigned')}</CardTitle>
              <CheckCircle2 className="h-6 w-6 text-green-200" />
            </div>
            <CardDescription className="text-green-100">
              {t('director.stats.teachersWithAssignments')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(overview?.total_teachers || 0) - (overview?.unassigned_teachers_count || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="overview">{t('director.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="teachers">{t('director.tabs.teachers')}</TabsTrigger>
              <TabsTrigger value="grades">{t('director.tabs.assignments')}</TabsTrigger>
              <TabsTrigger value="timetable">{t('director.tabs.timetable')}</TabsTrigger>
            </TabsList>
            
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              <UserPlus className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              {t('director.assignTeacher')}
            </Button>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {overview && overview.unassigned_teachers_count > 0 && (
              <Card className="border-orange-200 dark:border-orange-400 bg-orange-50 dark:bg-orange-950">
                <CardHeader>
                  <CardTitle className="text-orange-800 dark:text-orange-300 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {t('director.stats.unassigned')}
                  </CardTitle>
                  <CardDescription className="dark:text-orange-200">
                    {t('director.stats.teachersWithoutAssignments')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overview.unassigned_teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium dark:text-gray-100">{teacher.name}</p>
                          <div className="flex gap-1 mt-1">
                            {teacher.subjects.map((subject) => (
                              <Badge
                                key={subject}
                                variant="outline"
                                className={getSubjectBadgeColor(subject)}
                              >
                                {getSubjectLabel(subject)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher.id);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          {t('director.teachers.assign')}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assignments Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('director.overview.assignmentsBySubject')}</CardTitle>
                <CardDescription>{t('director.overview.assignmentsByGrade')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview && Object.entries(overview.assignments_by_grade).map(([gradeKey, gradeData]) => (
                    <div key={gradeKey} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">{getGradeLabel(gradeKey)}</h3>
                        <Badge variant="secondary">
                          {gradeData.total_assignments} {gradeData.total_assignments === 1 ? t('director.teachers.teacher') : t('director.teachers.teachers')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {gradeData.subjects_covered.map((subject) => (
                          <Badge 
                            key={subject}
                            className={getSubjectBadgeColor(subject)}
                          >
                            {getSubjectLabel(subject)}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('director.teachers.teachers')}: {gradeData.teachers.map(t => t.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-4">
            {teachers.map((teacher) => (
              <Card key={teacher.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{teacher.full_name}</CardTitle>
                      <CardDescription>{teacher.email}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      {teacher.current_assignments_count} {teacher.current_assignments_count === 1 ? 'assignment' : 'assignments'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('director.teachers.subjects')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {teacher.subjects.map((subject) => (
                          <Badge
                            key={subject}
                            className={getSubjectBadgeColor(subject)}
                          >
                            {getSubjectLabel(subject)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {teacher.current_assignments.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('director.teachers.currentAssignments')}:</p>
                        <div className="space-y-2">
                          {teacher.current_assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{getGradeLabel(assignment.grade_level)}</Badge>
                                <Badge className={getSubjectBadgeColor(assignment.subject)}>
                                  {getSubjectLabel(assignment.subject)}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    // Find full assignment data
                                    directorAPI.getAssignments({ grade_level: assignment.grade_level })
                                      .then(res => {
                                        const fullAssignment = res.data.find((a: TeacherGradeAssignment) => a.id === assignment.id);
                                        if (fullAssignment) openEditDialog(fullAssignment);
                                      });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                                  onClick={() => handleDeleteAssignment(assignment.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* By Grade Tab */}
          <TabsContent value="grades" className="space-y-4">
            {overview && Object.entries(overview.assignments_by_grade).map(([gradeKey, gradeData]) => (
              <Card key={gradeKey}>
                <CardHeader>
                  <CardTitle>{gradeData.grade_label}</CardTitle>
                  <CardDescription>
                    {gradeData.total_assignments} {gradeData.total_assignments === 1 ? 'teacher assigned' : 'teachers assigned'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gradeData.teachers.map((teacher) => (
                      <div 
                        key={`${teacher.assignment_id}-${teacher.teacher_id}-${teacher.subject}`}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <Badge className={getSubjectBadgeColor(teacher.subject)}>
                            {teacher.subject_display}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950"
                            onClick={() => {
                              // Find full assignment data for editing
                              directorAPI.getAssignments({ grade_level: gradeKey })
                                .then(res => {
                                  const fullAssignment = res.data.find((a: TeacherGradeAssignment) => a.id === teacher.assignment_id);
                                  if (fullAssignment) openEditDialog(fullAssignment);
                                });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                            onClick={() => handleDeleteAssignment(teacher.assignment_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t('timetable.title')}
                </CardTitle>
                <CardDescription>
                  {t('timetable.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Teacher Selection */}
                  <div>
                    <Label>{t('timetable.selectTeacher')}</Label>
                    <Select 
                      value={timetableTeacherId?.toString() || ''} 
                      onValueChange={(value) => {
                        const teacherId = parseInt(value);
                        setTimetableTeacherId(teacherId);
                        loadTeacherTimetable(teacherId);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('timetable.selectTeacherPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500 dark:text-gray-400">{t('timetable.noTeachers')}</div>
                        ) : (
                          teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.full_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weekly Schedule Grid */}
                  {timetableTeacherId && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {t('timetable.weeklySchedule')}
                      </h3>
                      
                      {loadingTimetable ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
                            const daySchedules = timetableData?.weekly_schedule?.[dayNum] || [];
                            const isEditing = editingSchedule[dayNum];
                            
                            return (
                              <Card key={dayNum} className="border-2">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">
                                    {t(`timetable.day.${['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayNum]}`)}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  {daySchedules.length === 0 && !isEditing ? (
                                    <div className="space-y-2">
                                      <p className="text-sm text-gray-500">{t('timetable.noSchedule')}</p>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingSchedule({
                                          ...editingSchedule,
                                          [dayNum]: { start_time: '08:00', end_time: '16:00' }
                                        })}
                                      >
                                        <Plus className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                        {t('timetable.addSchedule')}
                                      </Button>
                                    </div>
                                  ) : isEditing ? (
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <Label className="text-xs">{t('timetable.startTime')}</Label>
                                          <Input
                                            type="time"
                                            value={isEditing.start_time}
                                            onChange={(e) => setEditingSchedule({
                                              ...editingSchedule,
                                              [dayNum]: { ...isEditing, start_time: e.target.value }
                                            })}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">{t('timetable.endTime')}</Label>
                                          <Input
                                            type="time"
                                            value={isEditing.end_time}
                                            onChange={(e) => setEditingSchedule({
                                              ...editingSchedule,
                                              [dayNum]: { ...isEditing, end_time: e.target.value }
                                            })}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveTimetable(dayNum, isEditing)}
                                        >
                                          <Save className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                          {t('timetable.saveSchedule')}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const newEditing = { ...editingSchedule };
                                            delete newEditing[dayNum];
                                            setEditingSchedule(newEditing);
                                          }}
                                        >
                                          <X className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                                          {t('timetable.cancelEdit')}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    daySchedules.map((schedule: any) => (
                                      <div key={schedule.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                                        <div className="flex items-center gap-3">
                                          <Clock className="h-4 w-4 text-blue-600" />
                                          <span className="font-medium">
                                            {schedule.start_time} - {schedule.end_time}
                                          </span>
                                          <Badge variant={schedule.is_active ? "default" : "secondary"}>
                                            {schedule.is_active ? t('timetable.status.active') : t('timetable.status.inactive')}
                                          </Badge>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingSchedule({
                                              ...editingSchedule,
                                              [dayNum]: { 
                                                start_time: schedule.start_time, 
                                                end_time: schedule.end_time,
                                                id: schedule.id
                                              }
                                            })}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600"
                                            onClick={() => handleDeleteTimetable(schedule.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {!timetableTeacherId && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{t('timetable.teacherNotSelected')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Assign Teacher Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teacher to Grade</DialogTitle>
            <DialogDescription>
              Select a teacher, grade level, and subject to create a new assignment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Teacher</Label>
              <Select 
                value={selectedTeacher?.toString() || ''} 
                onValueChange={(value) => setSelectedTeacher(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.full_name} ({teacher.subjects.join(', ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Grade Level</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder={t('action.addAssignmentNotes')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment}>
              Assign Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update the grade level, subject, or notes for this assignment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Teacher</Label>
              <Input 
                value={editingAssignment?.teacher_info.full_name || ''} 
                disabled 
              />
            </div>

            <div>
              <Label>Grade Level</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder={t('action.addAssignmentNotes')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAssignment}>
              Update Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DirectorDashboard;
