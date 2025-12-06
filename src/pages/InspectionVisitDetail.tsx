import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, User, FileText, CheckCircle, XCircle } from 'lucide-react';
import { inspectionAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Visit {
  id: number;
  inspector_name: string;
  teacher_name: string;
  teacher_subject: string;
  school_name: string;
  visit_date: string;
  visit_time: string;
  inspection_type: string;
  inspection_type_display: string;
  status: string;
  status_display: string;
  duration_minutes: number;
  notes: string;
  cancellation_reason: string;
  has_report: boolean;
  can_write_report: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
  rescheduled: 'bg-purple-500',
};

export default function InspectionVisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [visit, setVisit] = useState<Visit | null>(null);

  useEffect(() => {
    fetchVisit();
  }, [id]);

  const fetchVisit = async () => {
    try {
      const response = await inspectionAPI.getVisit(Number(id));
      setVisit(response.data);
    } catch (error) {
      console.error('Error fetching visit:', error);
      toast({
        title: t('common.error'),
        description: t('visit.detail.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!visit) return;
    
    try {
      await inspectionAPI.markVisitCompleted(visit.id);
      toast({
        title: t('common.success'),
        description: t('visit.detail.markCompletedSuccess'),
      });
      fetchVisit(); // Reload visit data
    } catch (error) {
      console.error('Error marking visit as completed:', error);
      toast({
        title: t('common.error'),
        description: t('visit.detail.markCompletedError'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">{t('visit.detail.loading')}</div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">{t('visit.detail.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/inspector')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.backToDashboard')}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('visit.detail.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {visit.inspection_type_display} - {visit.teacher_name}
            </p>
          </div>
          <Badge className={statusColors[visit.status]}>
            {visit.status_display}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('visit.detail.visitInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('visit.detail.date')}</div>
                  <div className="font-medium">{new Date(visit.visit_date).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('visit.detail.time')}</div>
                  <div className="font-medium">{visit.visit_time}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('visit.detail.teacher')}</div>
                  <div className="font-medium">{visit.teacher_name}</div>
                  {visit.teacher_subject && (
                    <div className="text-sm text-muted-foreground">{visit.teacher_subject}</div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('visit.detail.school')}</div>
                  <div className="font-medium">{visit.school_name}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('visit.detail.duration')}</div>
                  <div className="font-medium">{visit.duration_minutes} {t('visit.detail.minutes')}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('visit.detail.type')}</div>
                  <div className="font-medium">{visit.inspection_type_display}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {visit.notes && (
          <Card>
            <CardHeader>
              <CardTitle>{t('visit.detail.notes')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{visit.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Cancellation Reason */}
        {visit.cancellation_reason && (
          <Card>
            <CardHeader>
              <CardTitle>{t('visit.detail.cancellationReason')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">{visit.cancellation_reason}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('visit.detail.actions')}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            {visit.status === 'scheduled' && (
              <Button onClick={handleMarkCompleted}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('visit.detail.markCompleted')}
              </Button>
            )}

            {visit.can_write_report && (
              <Button onClick={() => navigate(`/inspector/reports/new?visit_id=${visit.id}`)}>
                <FileText className="w-4 h-4 mr-2" />
                {t('visit.detail.writeReport')}
              </Button>
            )}

            {visit.has_report && (
              <Button variant="outline" onClick={() => navigate(`/inspector/reports/${visit.id}`)}>
                <FileText className="w-4 h-4 mr-2" />
                {t('visit.detail.viewReport')}
              </Button>
            )}

            {visit.status === 'scheduled' && (
              <Button variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                {t('visit.detail.cancelVisit')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>{t('visit.detail.timeline')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('visit.detail.created')}:</span>
              <span>{new Date(visit.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('visit.detail.lastUpdated')}:</span>
              <span>{new Date(visit.updated_at).toLocaleString()}</span>
            </div>
            {visit.completed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('visit.detail.completed')}:</span>
                <span>{new Date(visit.completed_at).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
