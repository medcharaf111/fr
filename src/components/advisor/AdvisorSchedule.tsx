import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import advisorAPI from '@/lib/advisorAPI';
import { TeacherInspection } from '@/types/api';
import { Calendar, Clock, User, BookOpen, FileText, Play, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const AdvisorSchedule: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [inspections, setInspections] = useState<TeacherInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<TeacherInspection | null>(null);
  const [startNotes, setStartNotes] = useState('');
  const [completionReport, setCompletionReport] = useState('');

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const response = await advisorAPI.getMyInspections({});
      setInspections(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching inspections:', err);
      setError(err.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInspection = async () => {
    if (!selectedInspection) return;
    
    try {
      await advisorAPI.startInspection(selectedInspection.id, startNotes);
      toast({
        title: 'Success',
        description: 'Inspection started successfully',
      });
      setStartDialogOpen(false);
      setStartNotes('');
      setSelectedInspection(null);
      fetchInspections();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to start inspection',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteInspection = async () => {
    if (!selectedInspection || !completionReport.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Report is required to complete inspection',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await advisorAPI.completeInspection(selectedInspection.id, { report: completionReport });
      toast({
        title: 'Success',
        description: 'Inspection completed successfully',
      });
      setCompleteDialogOpen(false);
      setCompletionReport('');
      setSelectedInspection(null);
      fetchInspections();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to complete inspection',
        variant: 'destructive',
      });
    }
  };

  const groupInspectionsByDate = (inspections: TeacherInspection[]) => {
    const grouped: { [key: string]: TeacherInspection[] } = {};
    
    inspections.forEach((inspection) => {
      const date = new Date(inspection.scheduled_date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(inspection);
    });

    // Sort by date
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return sortedDates.map(date => ({
      date,
      inspections: grouped[date].sort((a, b) => {
        return a.scheduled_time.localeCompare(b.scheduled_time);
      })
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedInspections = groupInspectionsByDate(inspections);
  const upcomingInspections = inspections.filter(i => i.status === 'scheduled');
  const inProgressInspections = inspections.filter(i => i.status === 'in_progress');

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingInspections.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming inspections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressInspections.length}</div>
            <p className="text-xs text-muted-foreground">Currently ongoing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inspections.length}</div>
            <p className="text-xs text-muted-foreground">All inspections</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline View */}
      {groupedInspections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No inspections scheduled</p>
            <p className="text-sm text-gray-500 mt-2">Your inspection schedule will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedInspections.map(({ date, inspections }) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {date}
                </CardTitle>
                <CardDescription>
                  {inspections.length} inspection{inspections.length !== 1 ? 's' : ''} scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inspections.map((inspection) => (
                    <Card 
                      key={inspection.id} 
                      className={`border-l-4 ${
                        inspection.status === 'scheduled' ? 'border-l-blue-500' :
                        inspection.status === 'in_progress' ? 'border-l-yellow-500' :
                        inspection.status === 'completed' ? 'border-l-green-500' :
                        'border-l-gray-500'
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-600" />
                                  {inspection.teacher_info.first_name} {inspection.teacher_info.last_name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  @{inspection.teacher_info.username}
                                </p>
                              </div>
                              <Badge className={getStatusColor(inspection.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(inspection.status)}
                                  {inspection.status.replace('_', ' ')}
                                </span>
                              </Badge>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">
                                  {inspection.scheduled_time} ({inspection.duration_minutes} min)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">
                                  {t(`subject.${inspection.subject}`)}
                                </span>
                              </div>
                              {inspection.school_info && (
                                <div className="flex items-center gap-2 col-span-2">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span className="text-gray-700">
                                    {inspection.school_info.name}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Purpose */}
                            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                              <FileText className="h-4 w-4 text-gray-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Purpose:</p>
                                <p className="text-sm text-gray-600">{inspection.purpose}</p>
                              </div>
                            </div>

                            {/* Pre-inspection notes */}
                            {inspection.pre_inspection_notes && (
                              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-medium text-blue-900 mb-1">Delegator Notes:</p>
                                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                  {inspection.pre_inspection_notes}
                                </p>
                              </div>
                            )}

                            {/* Advisor notes (if in progress or completed) */}
                            {inspection.advisor_notes && (
                              <div className="p-3 bg-green-50 rounded border border-green-200">
                                <p className="text-sm font-medium text-green-900 mb-1">Your Report:</p>
                                <p className="text-sm text-green-800 whitespace-pre-wrap">
                                  {inspection.advisor_notes}
                                </p>
                              </div>
                            )}

                            {/* Timestamps */}
                            <div className="flex gap-4 text-xs text-gray-500">
                              {inspection.advisor_started_at && (
                                <span>Started: {new Date(inspection.advisor_started_at).toLocaleString()}</span>
                              )}
                              {inspection.advisor_completed_at && (
                                <span>Completed: {new Date(inspection.advisor_completed_at).toLocaleString()}</span>
                              )}
                            </div>

                            {/* Verification status */}
                            {inspection.status === 'completed' && (
                              <div>
                                {inspection.completion_verified_by_delegator ? (
                                  <Badge className="bg-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified by Delegator
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-yellow-50 border-yellow-300">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Awaiting Delegator Verification
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            {inspection.status === 'scheduled' && (
                              <Dialog 
                                open={startDialogOpen && selectedInspection?.id === inspection.id} 
                                onOpenChange={(open) => {
                                  setStartDialogOpen(open);
                                  if (!open) {
                                    setSelectedInspection(null);
                                    setStartNotes('');
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    onClick={() => setSelectedInspection(inspection)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Start
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Start Inspection</DialogTitle>
                                    <DialogDescription>
                                      You're about to start the inspection for {inspection.teacher_info.first_name} {inspection.teacher_info.last_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Initial Notes (Optional)</Label>
                                      <Textarea
                                        value={startNotes}
                                        onChange={(e) => setStartNotes(e.target.value)}
                                        placeholder="Any observations before starting..."
                                        rows={4}
                                      />
                                    </div>
                                    <Button onClick={handleStartInspection} className="w-full">
                                      <Play className="h-4 w-4 mr-2" />
                                      Start Inspection
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            {inspection.status === 'in_progress' && (
                              <Dialog 
                                open={completeDialogOpen && selectedInspection?.id === inspection.id} 
                                onOpenChange={(open) => {
                                  setCompleteDialogOpen(open);
                                  if (!open) {
                                    setSelectedInspection(null);
                                    setCompletionReport('');
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    onClick={() => setSelectedInspection(inspection)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Complete
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Complete Inspection</DialogTitle>
                                    <DialogDescription>
                                      Submit your inspection report for {inspection.teacher_info.first_name} {inspection.teacher_info.last_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Inspection Report *</Label>
                                      <Textarea
                                        value={completionReport}
                                        onChange={(e) => setCompletionReport(e.target.value)}
                                        placeholder="Write your detailed inspection report here..."
                                        rows={10}
                                        required
                                      />
                                      <p className="text-xs text-gray-500 mt-1">
                                        Report is required and will be reviewed by Delegator
                                      </p>
                                    </div>
                                    <Button 
                                      onClick={handleCompleteInspection} 
                                      className="w-full"
                                      disabled={!completionReport.trim()}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Submit Report
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvisorSchedule;
