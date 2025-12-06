import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChapterProgressNotification } from '@/types/api';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Bot,
  User,
  BookOpen
} from 'lucide-react';
import api from '@/lib/api';

interface ChapterNotificationListProps {
  notifications: ChapterProgressNotification[];
  onUpdate: () => void;
}

const ChapterNotificationList = ({ notifications, onUpdate }: ChapterNotificationListProps) => {
  const [selectedNotification, setSelectedNotification] = useState<ChapterProgressNotification | null>(null);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState<'confirm' | 'reject' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async (notification: ChapterProgressNotification, action: 'confirm' | 'reject') => {
    setSelectedNotification(notification);
    setActionType(action);
    setNotes('');
  };

  const submitAction = async () => {
    if (!selectedNotification || !actionType) return;

    setLoading(true);
    try {
      await api.post(`/chapter-notifications/${selectedNotification.id}/${actionType}/`, {
        notes: notes
      });
      
      setSelectedNotification(null);
      setActionType(null);
      setNotes('');
      onUpdate();
    } catch (error) {
      console.error(`Failed to ${actionType} notification:`, error);
      alert(`Failed to ${actionType} chapter progression`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.8) return 'text-blue-600 bg-blue-50';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const pendingNotifications = notifications.filter(n => n.status === 'pending');
  const reviewedNotifications = notifications.filter(n => n.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Notifications */}
      {pendingNotifications.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Pending Review ({pendingNotifications.length})</h3>
          </div>
          
          <div className="space-y-3">
            {pendingNotifications.map((notification) => (
              <Card key={notification.id} className="border-2 border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {notification.teacher_info.first_name} {notification.teacher_info.last_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <BookOpen className="w-3 h-3" />
                        {notification.teacher_progress_info.subject_display} - {notification.teacher_progress_info.grade_level_display}
                      </CardDescription>
                    </div>
                    {getStatusBadge(notification.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Chapter Progression */}
                  <div className="bg-white p-4 rounded-lg mb-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Previous Chapter</p>
                        <p className="font-medium text-gray-700">
                          Ch. {notification.previous_chapter_number}: {notification.previous_chapter}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500 mx-4" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">New Chapter</p>
                        <p className="font-semibold text-green-700">
                          Ch. {notification.new_chapter_number}: {notification.new_chapter}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Detection Info */}
                  {notification.ai_detected && (
                    <div className={`p-3 rounded-lg flex items-center justify-between mb-3 ${getConfidenceColor(notification.ai_confidence)}`}>
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <span className="text-sm font-medium">AI Detected</span>
                      </div>
                      <span className="text-sm font-bold">
                        {(notification.ai_confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAction(notification, 'confirm')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Progress
                    </Button>
                    <Button
                      onClick={() => handleAction(notification, 'reject')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject & Revert
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Created {new Date(notification.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed Notifications */}
      {reviewedNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recently Reviewed</h3>
          <div className="space-y-3">
            {reviewedNotifications.slice(0, 5).map((notification) => (
              <Card key={notification.id} className="opacity-75 hover:opacity-100 transition-opacity">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {notification.teacher_info.first_name} {notification.teacher_info.last_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        Ch. {notification.previous_chapter_number} → Ch. {notification.new_chapter_number}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(notification.status)}
                      {notification.reviewed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {notification.advisor_notes && (
                    <p className="text-xs text-gray-600 mt-2 italic">
                      Note: {notification.advisor_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No chapter notifications at this time</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => {
        setSelectedNotification(null);
        setActionType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'confirm' ? 'Confirm Chapter Progression' : 'Reject and Revert'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'confirm' 
                ? 'Confirm that the teacher has successfully moved to the next chapter.'
                : 'Reject this progression and revert the teacher back to the previous chapter.'}
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Teacher: {selectedNotification.teacher_info.first_name} {selectedNotification.teacher_info.last_name}</p>
                <p className="text-sm text-gray-600">
                  {actionType === 'confirm' 
                    ? `Moving to: Ch. ${selectedNotification.new_chapter_number} - ${selectedNotification.new_chapter}`
                    : `Reverting to: Ch. ${selectedNotification.previous_chapter_number} - ${selectedNotification.previous_chapter}`
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notes {actionType === 'reject' ? '(Required)' : '(Optional)'}
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionType === 'confirm' 
                    ? "Add any comments about this progression..."
                    : "Explain why you're rejecting this progression..."
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={submitAction}
                  disabled={loading || (actionType === 'reject' && !notes.trim())}
                  className={actionType === 'confirm' ? 'flex-1 bg-green-600 hover:bg-green-700' : 'flex-1'}
                  variant={actionType === 'reject' ? 'destructive' : 'default'}
                >
                  {loading ? 'Processing...' : actionType === 'confirm' ? 'Confirm' : 'Reject & Revert'}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedNotification(null);
                    setActionType(null);
                  }}
                  variant="outline"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChapterNotificationList;
