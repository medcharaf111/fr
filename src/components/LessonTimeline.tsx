import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, List, Clock, BookOpen, Tag } from 'lucide-react';
import { lessonAPI } from '@/lib/api';
import { Lesson } from '@/types/api';

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

const SUBJECT_COLORS: Record<string, string> = {
  math: 'bg-blue-500',
  science: 'bg-green-500',
  english: 'bg-purple-500',
  arabic: 'bg-orange-500',
  social_studies: 'bg-yellow-500',
  art: 'bg-pink-500',
  music: 'bg-indigo-500',
  physical_education: 'bg-red-500',
  computer_science: 'bg-cyan-500',
  religious_studies: 'bg-teal-500',
};

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Lesson;
}

const LessonTimeline = () => {
  const [lessons, setLessons] = useState<{ scheduled: Lesson[]; unscheduled: Lesson[] }>({
    scheduled: [],
    unscheduled: [],
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTimeline();
  }, [currentDate]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      const response = await lessonAPI.getTimeline(start, end);
      setLessons(response.data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (lesson: Lesson, date?: string) => {
    if (!date) {
      setSelectedLesson(lesson);
      setScheduledDate(lesson.scheduled_date || '');
      setScheduleDialogOpen(true);
      return;
    }

    try {
      await lessonAPI.scheduleLesson(lesson.id, date);
      fetchTimeline();
      setScheduleDialogOpen(false);
      setScheduledDate('');
    } catch (error) {
      console.error('Failed to schedule lesson:', error);
      alert('Failed to schedule lesson. Please try again.');
    }
  };

  const events: CalendarEvent[] = (lessons?.scheduled || []).map(lesson => {
    const date = new Date(lesson.scheduled_date + 'T09:00:00');
    return {
      id: lesson.id,
      title: lesson.title,
      start: date,
      end: addDays(date, 0),
      resource: lesson,
    };
  });

  const eventStyleGetter = (event: CalendarEvent) => {
    const subject = event.resource.subject;
    const color = SUBJECT_COLORS[subject] || 'bg-gray-500';
    
    return {
      style: {
        backgroundColor: color.replace('bg-', '#'),
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading timeline...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Lesson Timeline
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'calendar' ? (
            <div style={{ height: '600px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => {
                  setSelectedLesson(event.resource);
                  setDetailsDialogOpen(true);
                }}
                views={['month', 'week', 'day']}
                defaultView="month"
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scheduled Lessons */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Scheduled Lessons</h3>
                {lessons.scheduled.length === 0 ? (
                  <p className="text-gray-500 text-sm">No scheduled lessons</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.scheduled.map((lesson) => (
                      <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={SUBJECT_COLORS[lesson.subject]}>
                                  {lesson.subject_display}
                                </Badge>
                                <Badge variant="outline">{lesson.grade_level_display}</Badge>
                                {lesson.vault_source && (
                                  <Badge variant="secondary" className="text-xs">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    From Vault
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-base">{lesson.title}</h4>
                              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(new Date(lesson.scheduled_date!), 'EEEE, MMMM d, yyyy')}
                              </p>
                              {lesson.vault_source_title && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Generated from: {lesson.vault_source_title}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLesson(lesson);
                                  setDetailsDialogOpen(true);
                                }}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSchedule(lesson)}
                              >
                                Reschedule
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Unscheduled Lessons */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Unscheduled Lessons</h3>
                {lessons.unscheduled.length === 0 ? (
                  <p className="text-gray-500 text-sm">No unscheduled lessons</p>
                ) : (
                  <div className="space-y-2">
                    {lessons.unscheduled.map((lesson) => (
                      <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={SUBJECT_COLORS[lesson.subject]}>
                                  {lesson.subject_display}
                                </Badge>
                                <Badge variant="outline">{lesson.grade_level_display}</Badge>
                                {lesson.vault_source && (
                                  <Badge variant="secondary" className="text-xs">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    From Vault
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-base">{lesson.title}</h4>
                              {lesson.vault_source_title && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Generated from: {lesson.vault_source_title}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLesson(lesson);
                                  setDetailsDialogOpen(true);
                                }}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSchedule(lesson)}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Schedule
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLesson?.title}</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={SUBJECT_COLORS[selectedLesson.subject]}>
                  {selectedLesson.subject_display}
                </Badge>
                <Badge variant="outline">{selectedLesson.grade_level_display}</Badge>
                {selectedLesson.scheduled_date && (
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(selectedLesson.scheduled_date), 'MMM d, yyyy')}
                  </Badge>
                )}
                {selectedLesson.vault_source && (
                  <Badge variant="secondary">
                    <BookOpen className="w-3 h-3 mr-1" />
                    From Vault
                  </Badge>
                )}
              </div>
              
              {selectedLesson.vault_source_title && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Generated from vault plan:</span> {selectedLesson.vault_source_title}
                  </p>
                </div>
              )}

              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lesson: {selectedLesson?.title}</label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setScheduleDialogOpen(false);
                  setScheduledDate('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => selectedLesson && handleSchedule(selectedLesson, scheduledDate)}
                disabled={!scheduledDate}
              >
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonTimeline;
