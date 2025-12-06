import { useState, useEffect } from 'react';
import { Bell, Check, X, Calendar, FileText, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

interface Notification {
  id: number;
  notification_type: string;
  notification_type_display: string;
  title: string;
  message: string;
  related_object_type: string;
  related_object_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationsProps {
  className?: string;
}

const Notifications = ({ className }: NotificationsProps) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data.slice(0, 10)); // Show latest 10
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread_count/');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    setLoading(true);
    try {
      await api.post(`/notifications/${notificationId}/mark_read/`);
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await api.post('/notifications/mark_all_read/');
      await fetchNotifications();
      await fetchUnreadCount();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearNotification = async (notificationId: number) => {
    setLoading(true);
    try {
      await api.delete(`/notifications/${notificationId}/clear/`);
      await fetchNotifications();
      await fetchUnreadCount();
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      console.error('Error clearing notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inspection_scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'inspection_started':
      case 'inspection_completed':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'advisor_assigned':
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      case 'review_submitted':
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={markAllAsRead}
              disabled={loading}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                }}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                      {!notification.is_read && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Button variant="ghost" size="sm" className="text-xs w-full">
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
