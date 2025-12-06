import { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar as CalendarIcon, List, Edit2, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { teachingPlanAPI, lessonAPI } from '@/lib/api';
import { TeachingPlan, Lesson } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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

const GRADE_OPTIONS = [
  { value: 'grade_1', label: '1st Grade' },
  { value: 'grade_2', label: '2nd Grade' },
  { value: 'grade_3', label: '3rd Grade' },
  { value: 'grade_4', label: '4th Grade' },
  { value: 'grade_5', label: '5th Grade' },
  { value: 'grade_6', label: '6th Grade' },
  { value: 'grade_7', label: '7th Grade' },
  { value: 'grade_8', label: '8th Grade' },
  { value: 'grade_9', label: '9th Grade' },
  { value: 'grade_10', label: '10th Grade' },
  { value: 'grade_11', label: '11th Grade' },
  { value: 'grade_12', label: '12th Grade' },
];

interface TeachingTimelineProps {
  isEditable: boolean;
  teacherSubjects?: string[];
}

const TeachingTimeline = ({ isEditable, teacherSubjects = [] }: TeachingTimelineProps) => {
  const [plans, setPlans] = useState<TeachingPlan[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TeachingPlan | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: teacherSubjects.length > 0 ? teacherSubjects[0] : 'math',
    grade_level: 'grade_1',
    lesson: null as number | null,
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    status: 'planned' as 'planned' | 'taught' | 'cancelled',
    duration_minutes: 60,
    notes: '',
    completion_notes: '',
  });
  const { t } = useLanguage();

  useEffect(() => {
    fetchPlans();
    if (isEditable) {
      fetchLessons();
    }
  }, [isEditable]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await teachingPlanAPI.getAll();
      setPlans(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch teaching plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teaching plans',
        variant: 'destructive',
      });
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const data = await lessonAPI.getAllLessons();
      setLessons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      setLessons([]);
    }
  };

  const handleCreate = async () => {
    try {
      await teachingPlanAPI.create(formData);
      toast({
        title: 'Success',
        description: 'Teaching plan created successfully',
      });
      setDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Failed to create teaching plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to create teaching plan',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedPlan) return;
    
    try {
      await teachingPlanAPI.update(selectedPlan.id, formData);
      toast({
        title: 'Success',
        description: 'Teaching plan updated successfully',
      });
      setDialogOpen(false);
      setSelectedPlan(null);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Failed to update teaching plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to update teaching plan',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this teaching plan?')) return;
    
    try {
      await teachingPlanAPI.delete(id);
      toast({
        title: 'Success',
        description: 'Teaching plan deleted successfully',
      });
      fetchPlans();
    } catch (error) {
      console.error('Failed to delete teaching plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete teaching plan',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (plan: TeachingPlan) => {
    setSelectedPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description,
      subject: plan.subject,
      grade_level: plan.grade_level,
      lesson: plan.lesson,
      date: plan.date,
      time: plan.time || '',
      status: plan.status,
      duration_minutes: plan.duration_minutes || 60,
      notes: plan.notes,
      completion_notes: plan.completion_notes,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedPlan(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: teacherSubjects.length > 0 ? teacherSubjects[0] : 'math',
      grade_level: 'grade_1',
      lesson: null,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '',
      status: 'planned',
      duration_minutes: 60,
      notes: '',
      completion_notes: '',
    });
  };

  // Convert plans to calendar events
  const events = useMemo(() => {
    return plans.map(plan => {
      const planDate = new Date(plan.date + 'T12:00:00');
      return {
        id: plan.id,
        title: plan.title,
        start: planDate,
        end: planDate,
        resource: plan,
      };
    });
  }, [plans]);

  const eventStyleGetter = (event: any) => {
    const plan = event.resource as TeachingPlan;
    let backgroundColor = '#3b82f6'; // blue for planned
    
    if (plan.status === 'taught') {
      backgroundColor = '#10b981'; // green
    } else if (plan.status === 'cancelled') {
      backgroundColor = '#ef4444'; // red
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list')}>
            <TabsList>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {isEditable && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedPlan ? 'Edit' : 'Create'} Teaching Plan</DialogTitle>
                <DialogDescription>
                  {selectedPlan ? 'Update' : 'Add'} a teaching plan to your timeline
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Introduction to Fractions"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about what will be taught..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECT_OPTIONS.filter(opt => 
                          !isEditable || teacherSubjects.length === 0 || teacherSubjects.includes(opt.value)
                        ).map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="grade_level">{t('label.gradeLevel')} *</Label>
                    <Select
                      value={formData.grade_level}
                      onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="HH:MM"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes || ''}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                      placeholder="60"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="taught">Taught</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {lessons.length > 0 && (
                  <div>
                    <Label htmlFor="lesson">Link to Lesson (Optional)</Label>
                    <Select
                      value={formData.lesson?.toString() || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, lesson: value === 'none' ? null : parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lesson..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {lessons.map(lesson => (
                          <SelectItem key={lesson.id} value={lesson.id.toString()}>
                            {lesson.title} ({lesson.subject_display})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Preparation notes, materials needed, etc..."
                    rows={2}
                  />
                </div>

                {formData.status === 'taught' && (
                  <div>
                    <Label htmlFor="completion_notes">Completion Notes</Label>
                    <Textarea
                      id="completion_notes"
                      value={formData.completion_notes}
                      onChange={(e) => setFormData({ ...formData, completion_notes: e.target.value })}
                      placeholder="What went well, challenges faced, student feedback..."
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={selectedPlan ? handleUpdate : handleCreate}>
                  {selectedPlan ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading teaching plans...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'calendar' ? (
            <Card>
              <CardContent className="p-4">
                <div style={{ height: '600px' }}>
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={(event) => {
                      const plan = event.resource as TeachingPlan;
                      if (isEditable) {
                        openEditDialog(plan);
                      }
                    }}
                    views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
                    defaultView={Views.MONTH}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {plans.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {isEditable ? 'No teaching plans yet. Create one to get started!' : 'No teaching plans available.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    {/* Visual Timeline */}
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500"></div>
                      
                      {/* Timeline items */}
                      <div className="space-y-8">
                        {plans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((plan, index) => {
                          const isFirst = index === 0;
                          const isLast = index === plans.length - 1;
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
                                  onClick={() => isEditable && openEditDialog(plan)}
                                >
                                  {getStatusIcon(plan.status)}
                                  <div className="absolute -top-1 -right-1">
                                    {plan.lesson && (
                                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        L
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Date label */}
                                <div className="absolute top-20 left-1/2 -translate-x-1/2 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                  {format(new Date(plan.date), 'MMM d')}
                                  {plan.time && <span className="block text-[10px] text-center mt-0.5">{plan.time.substring(0, 5)}</span>}
                                </div>
                              </div>
                              
                              {/* Content card */}
                              <div className="flex-1 pb-8">
                                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => isEditable && openEditDialog(plan)}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <CardTitle className="text-lg">{plan.title}</CardTitle>
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
                                          <span className="font-medium text-foreground">{plan.subject_display}</span>
                                          <span>•</span>
                                          <span>{plan.grade_level_display}</span>
                                          <span>•</span>
                                          <span>
                                            {format(new Date(plan.date), 'EEEE, MMMM d, yyyy')}
                                            {plan.time && ` at ${plan.time.substring(0, 5)}`}
                                          </span>
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
                                      
                                      {isEditable && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openEditDialog(plan);
                                            }}
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDelete(plan.id);
                                            }}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </CardHeader>
                                  
                                  {(plan.description || plan.notes || plan.completion_notes) && (
                                    <CardContent className="space-y-3 pt-0">
                                      {plan.description && (
                                        <div>
                                          <h4 className="text-sm font-semibold mb-1.5 text-foreground">Description</h4>
                                          <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                                        </div>
                                      )}
                                      
                                      {plan.notes && (
                                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                                          <h4 className="text-sm font-semibold mb-1.5 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                            <span>📝</span>
                                            Preparation Notes
                                          </h4>
                                          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{plan.notes}</p>
                                        </div>
                                      )}
                                      
                                      {plan.completion_notes && (
                                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border-l-4 border-green-500">
                                          <h4 className="text-sm font-semibold mb-1.5 text-green-900 dark:text-green-100 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            How It Went
                                          </h4>
                                          <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">{plan.completion_notes}</p>
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeachingTimeline;
