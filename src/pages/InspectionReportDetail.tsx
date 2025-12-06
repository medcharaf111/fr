import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Star, Calendar, User, School, FileText } from 'lucide-react';
import { inspectionAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Report {
  id: number;
  inspector_name: string;
  teacher_name: string;
  school_name: string;
  visit_date: string;
  inspection_type_display: string;
  teaching_quality_rating: number;
  class_management_rating: number;
  student_engagement_rating: number;
  content_delivery_rating: number;
  final_rating: number;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  summary: string;
  follow_up_needed: boolean;
  follow_up_notes: string;
  gpi_status: string;
  gpi_status_display: string;
  gpi_feedback: string;
  gpi_reviewer_name: string | null;
  reviewed_at: string | null;
  submitted_at: string;
}

export default function InspectionReportDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGPI = user.role === 'gpi' || user.role === 'admin';

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    if (!id) return;
    
    try {
      const response = await inspectionAPI.getReport(Number(id));
      setReport(response.data);
      setFeedback(response.data.gpi_feedback || '');
    } catch (error: any) {
      console.error('Error loading report:', error);
      toast({
        title: t('common.error'),
        description: t('report.detail.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    
    setActionLoading(true);
    try {
      await inspectionAPI.approveReport(Number(id), feedback);
      toast({
        title: t('common.success'),
        description: t('report.detail.approveSuccess'),
      });
      loadReport();
    } catch (error: any) {
      console.error('Error approving report:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.detail || t('report.detail.approveError'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !feedback.trim()) {
      toast({
        title: t('common.error'),
        description: t('report.detail.feedbackRequired'),
        variant: 'destructive',
      });
      return;
    }
    
    setActionLoading(true);
    try {
      await inspectionAPI.rejectReport(Number(id), feedback);
      toast({
        title: t('common.success'),
        description: t('report.detail.rejectSuccess'),
      });
      loadReport();
    } catch (error: any) {
      console.error('Error rejecting report:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.detail || t('report.detail.rejectError'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      under_review: 'outline',
    };
    return variants[status] || 'secondary';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('report.detail.loading')}</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('report.detail.notFound')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isGPI ? '/gpi' : '/inspector')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('report.detail.title')}</h1>
            <p className="text-muted-foreground">{t('report.detail.reportNumber')} #{report.id}</p>
          </div>
        </div>
        <Badge variant={getStatusBadge(report.gpi_status)}>
          {report.gpi_status_display}
        </Badge>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('report.detail.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('report.detail.inspector')}</p>
                <p className="font-medium">{report.inspector_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('report.detail.teacher')}</p>
                <p className="font-medium">{report.teacher_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('report.detail.school')}</p>
                <p className="font-medium">{report.school_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('report.detail.visitDate')}</p>
                <p className="font-medium">
                  {new Date(report.visit_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('report.detail.inspectionType')}</p>
                <p className="font-medium">{report.inspection_type_display}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('report.detail.submitted')}</p>
                <p className="font-medium">
                  {new Date(report.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('report.detail.ratings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2">{t('report.detail.teachingQuality')}</p>
              {renderStars(report.teaching_quality_rating)}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">{t('report.detail.classManagement')}</p>
              {renderStars(report.class_management_rating)}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">{t('report.detail.studentEngagement')}</p>
              {renderStars(report.student_engagement_rating)}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">{t('report.detail.contentDelivery')}</p>
              {renderStars(report.content_delivery_rating)}
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">{t('report.detail.finalRating')}</p>
              <div className="flex items-center gap-2">
                {renderStars(Math.round(report.final_rating))}
                <span className="text-2xl font-bold">{report.final_rating.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>{t('report.detail.detailedFeedback')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{t('report.detail.strengths')}</h4>
            <p className="text-sm whitespace-pre-wrap">{report.strengths || t('report.detail.notAvailable')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('report.detail.weaknesses')}</h4>
            <p className="text-sm whitespace-pre-wrap">{report.weaknesses || t('report.detail.notAvailable')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('report.detail.recommendations')}</h4>
            <p className="text-sm whitespace-pre-wrap">{report.recommendations || t('report.detail.notAvailable')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">{t('report.detail.summary')}</h4>
            <p className="text-sm whitespace-pre-wrap">{report.summary || t('report.detail.notAvailable')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up */}
      {report.follow_up_needed && (
        <Card>
          <CardHeader>
            <CardTitle>{t('report.detail.followUpRequired')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{report.follow_up_notes || t('report.detail.notAvailable')}</p>
          </CardContent>
        </Card>
      )}

      {/* GPI Review Section */}
      {isGPI && report.gpi_status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('report.detail.gpiReview')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="feedback">{t('report.detail.feedbackLabel')}</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('report.detail.feedbackPlaceholder')}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('report.detail.approveReport')}
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                disabled={actionLoading || !feedback.trim()}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t('report.detail.rejectReport')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GPI Review Result */}
      {report.gpi_status !== 'pending' && report.gpi_feedback && (
        <Card>
          <CardHeader>
            <CardTitle>{t('report.detail.gpiReview')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">{t('report.detail.reviewer')}</p>
              <p className="font-medium">{report.gpi_reviewer_name || t('report.detail.notAvailable')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('report.detail.reviewedAt')}</p>
              <p className="font-medium">
                {report.reviewed_at
                  ? new Date(report.reviewed_at).toLocaleString()
                  : t('report.detail.notAvailable')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('report.detail.feedback')}</p>
              <p className="text-sm whitespace-pre-wrap">{report.gpi_feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
