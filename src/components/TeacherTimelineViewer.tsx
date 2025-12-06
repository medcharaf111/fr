import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { teachingPlanAPI } from '@/lib/api';
import { TeachingPlan } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface TeacherData {
  teacher_info: {
    id: number;
    username: string;
    full_name: string;
    subjects: string[];
  };
  plans: TeachingPlan[];
}

const TeacherTimelineViewer = () => {
  const [teachersData, setTeachersData] = useState<Record<number, TeacherData>>({});
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeachersTimelines();
  }, []);

  const fetchTeachersTimelines = async () => {
    try {
      setLoading(true);
      const response = await teachingPlanAPI.getMyTeachers();
      setTeachersData(response.data);
      
      // Select first teacher by default
      const teacherIds = Object.keys(response.data).map(Number);
      if (teacherIds.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(teacherIds[0]);
      }
    } catch (error) {
      console.error('Failed to fetch teacher timelines:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teacher timelines',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taught':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taught':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const teachers = Object.values(teachersData);
  const selectedTeacher = selectedTeacherId ? teachersData[selectedTeacherId] : null;

  // Group plans by month
  const groupPlansByMonth = (plans: TeachingPlan[]) => {
    const groups: Record<string, TeachingPlan[]> = {};
    
    plans.forEach(plan => {
      const monthKey = format(new Date(plan.date), 'MMMM yyyy');
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(plan);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading teacher timelines...</p>
        </CardContent>
      </Card>
    );
  }

  if (teachers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No teachers assigned yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Teaching Timeline
          </CardTitle>
          <CardDescription>
            View what your teachers have taught and plan to teach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTeacherId?.toString()} onValueChange={(v) => setSelectedTeacherId(Number(v))}>
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${teachers.length}, 1fr)` }}>
              {teachers.map(({ teacher_info }) => (
                <TabsTrigger key={teacher_info.id} value={teacher_info.id.toString()} className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(teacher_info.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{teacher_info.full_name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {teachers.map(({ teacher_info, plans }) => (
              <TabsContent key={teacher_info.id} value={teacher_info.id.toString()} className="space-y-6 mt-6">
                {/* Teacher Info */}
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {getInitials(teacher_info.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{teacher_info.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {teacher_info.subjects.map(s => 
                        SUBJECT_OPTIONS.find(opt => opt.value === s)?.label || s
                      ).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                {plans.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No teaching plans yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      {/* Visual Timeline */}
                      <div className="relative">
                        {/* Vertical gradient line */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500"></div>
                        
                        {/* Timeline items */}
                        <div className="space-y-8">
                          {plans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((plan, index) => {
                            const isFirst = index === 0;
                            const statusColors = {
                              planned: 'bg-blue-500 border-blue-600',
                              taught: 'bg-green-500 border-green-600',
                              cancelled: 'bg-red-500 border-red-600',
                            };
                            const nodeColor = statusColors[plan.status] || statusColors.planned;
                            
                            return (
                              <div key={plan.id} className="relative flex gap-6 group">
                                {/* Timeline node */}
                                <div className="relative flex-shrink-0">
                                  <div 
                                    className={`w-16 h-16 rounded-full ${nodeColor} border-4 shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 z-10 relative`}
                                  >
                                    {getStatusIcon(plan.status)}
                                    {plan.lesson_title && (
                                      <div className="absolute -top-1 -right-1">
                                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                          L
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Date label */}
                                  <div className="absolute top-20 left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                    {format(new Date(plan.date), 'MMM d')}
                                    {plan.time && <span className="block text-[10px] text-center mt-0.5">{plan.time.substring(0, 5)}</span>}
                                  </div>
                                </div>
                                
                                {/* Content card */}
                                <div className="flex-1 pb-8">
                                  <Card className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {getStatusIcon(plan.status)}
                                            <CardTitle className="text-base">{plan.title}</CardTitle>
                                            <Badge className={getStatusColor(plan.status)} variant="secondary">
                                              {plan.status_display}
                                            </Badge>
                                            {isFirst && (
                                              <Badge variant="outline" className="text-xs">
                                                Latest
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                            <span className="font-medium text-foreground">
                                              {format(new Date(plan.date), 'EEEE, MMM d, yyyy')}
                                              {plan.time && ` at ${plan.time.substring(0, 5)}`}
                                            </span>
                                            <span>•</span>
                                            <span>{plan.subject_display}</span>
                                            <span>•</span>
                                            <span>{plan.grade_level_display}</span>
                                            {plan.duration_minutes && (
                                              <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  {plan.duration_minutes} min
                                                </span>
                                              </>
                                            )}
                                          </div>
                                          
                                          {plan.lesson_title && (
                                            <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full w-fit">
                                              <span className="text-xs">📚</span>
                                              <span className="font-medium">Linked: {plan.lesson_title}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardHeader>
                                    
                                    {(plan.description || plan.completion_notes) && (
                                      <CardContent className="pt-0 space-y-3">
                                        {plan.description && (
                                          <div>
                                            <h4 className="text-sm font-semibold mb-1.5 text-foreground">What to Expect</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                                          </div>
                                        )}
                                        
                                        {plan.completion_notes && plan.status === 'taught' && (
                                          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border-l-4 border-green-500">
                                            <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1.5 flex items-center gap-2">
                                              <CheckCircle2 className="w-4 h-4" />
                                              How it went
                                            </h4>
                                            <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                                              {plan.completion_notes}
                                            </p>
                                          </div>
                                        )}
                                      </CardContent>
                                    )}
                                  </Card>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const SUBJECT_OPTIONS = [
  { value: 'math', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'english', label: 'English' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'religious_studies', label: 'Religious Studies' },
];

export default TeacherTimelineViewer;
