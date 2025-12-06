import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import TeacherAnalyticsCard from '@/components/TeacherAnalyticsCard';
import TeacherTimelineViewer from '@/components/TeacherTimelineViewer';
import ChapterNotificationList from '@/components/ChapterNotificationList';
import TeacherProgressTimeline from '@/components/TeacherProgressTimeline';
import AdvisorAnalyticsDashboard from '@/components/AdvisorAnalyticsDashboard';
import AdvisorAttendanceVerification from '@/components/AdvisorAttendanceVerification';
import AdvisorStats from '@/components/advisor/AdvisorStats';
import AdvisorSchedule from '@/components/advisor/AdvisorSchedule';
import api, { authAPI, advisorReviewAPI, groupChatAPI, chatMessageAPI, lessonAPI, testAPI } from '@/lib/api';
import { User, UserBasic, AdvisorReview, GroupChat, ChatMessage, Lesson, Test, TeacherAnalytics, ChapterProgressNotification, TeacherProgress } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Send, Users, BookOpen, MessageSquare, FileText, Paperclip, Edit2, Trash2, UserPlus, UserMinus, TrendingUp, Award, Archive, ClipboardList, Clock, CheckCircle, Play, FileCheck, Calendar } from 'lucide-react';

const AdvisorDashboard = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [teachers, setTeachers] = useState<UserBasic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mcqTests, setMcqTests] = useState<any[]>([]);
  const [qaTests, setQaTests] = useState<any[]>([]);
  const [reviews, setReviews] = useState<AdvisorReview[]>([]);
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<GroupChat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New teacher analytics state
  const [teacherAnalytics, setTeacherAnalytics] = useState<TeacherAnalytics[]>([]);
  const [chapterNotifications, setChapterNotifications] = useState<ChapterProgressNotification[]>([]);
  const [teacherProgress, setTeacherProgress] = useState<TeacherProgress[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAnalytics | null>(null);
  
  // Inspections state
  const [inspections, setInspections] = useState<any[]>([]);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any | null>(null);
  const [startNotes, setStartNotes] = useState('');
  const [completionReport, setCompletionReport] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    review_type: 'lesson' as 'lesson' | 'mcq_test' | 'qa_test',
    lesson: undefined as number | undefined,
    mcq_test: undefined as number | undefined,
    qa_test: undefined as number | undefined,
    rating: 5,
    remarks: '',
  });

  // Chat dialog state
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || currentUser.role !== 'advisor') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subject teachers
      const teachersResponse = await groupChatAPI.getSubjectTeachers();
      setTeachers(teachersResponse.data || []);

      // Fetch lessons - lessonAPI.getAllLessons already returns response.data
      const lessons = await lessonAPI.getAllLessons();
      console.log('Fetched lessons for advisor:', lessons);
      setLessons(lessons || []);

      // Fetch MCQ tests
      const mcqResponse = await testAPI.getAll();
      console.log('Fetched MCQ tests for advisor:', mcqResponse.data);
      setMcqTests(mcqResponse.data || []);

      // Fetch Q&A tests
      const qaResponse = await api.get('/qa-tests/');
      console.log('Fetched QA tests for advisor:', qaResponse.data);
      setQaTests(qaResponse.data || []);

      // Fetch reviews
      const reviewsResponse = await advisorReviewAPI.getMyReviews();
      setReviews(reviewsResponse.data || []);

      // Fetch chats
      const chatsResponse = await groupChatAPI.getMyChats();
      setChats(chatsResponse.data || []);
      
      // Fetch teacher analytics
      await fetchTeacherAnalytics();
      
      // Fetch chapter notifications
      await fetchChapterNotifications();
      
      // Fetch inspections
      await fetchInspections();
    } catch (error: any) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error?.response?.data);
      toast({
        title: 'Error',
        description: error?.response?.data?.error || error?.message || 'Failed to load data',
        variant: 'destructive',
      });
      // Set empty arrays on error to prevent undefined
      setTeachers([]);
      setLessons([]);
      setMcqTests([]);
      setQaTests([]);
      setReviews([]);
      setChats([]);
    } finally {
      setLoading(false);
      console.log('Final lessons state:', lessons);
    }
  };

  const fetchTeacherAnalytics = async () => {
    try {
      const response = await api.get('/teacher-analytics/subject_teachers/');
      setTeacherAnalytics(response.data || []);
    } catch (error) {
      console.error('Failed to fetch teacher analytics:', error);
    }
  };

  const fetchChapterNotifications = async () => {
    try {
      const response = await api.get('/chapter-notifications/');
      setChapterNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch chapter notifications:', error);
    }
  };

  const fetchTeacherProgress = async (teacherId: number) => {
    try {
      const response = await api.get(`/teacher-progress/?teacher=${teacherId}`);
      setTeacherProgress(response.data || []);
    } catch (error) {
      console.error('Failed to fetch teacher progress:', error);
    }
  };

  const fetchInspections = async () => {
    try {
      const response = await api.get('/advisor-inspections/');
      setInspections(response.data || []);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inspections',
        variant: 'destructive',
      });
    }
  };

  const handleStartInspection = async () => {
    if (!selectedInspection) return;
    
    try {
      await api.post(`/advisor-inspections/${selectedInspection.id}/report_start/`, {
        notes: startNotes
      });
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
      await api.post(`/advisor-inspections/${selectedInspection.id}/report_completion/`, {
        report: completionReport
      });
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

  const handleCreateReview = async () => {
    try {
      await advisorReviewAPI.create(reviewData);
      toast({
        title: 'Success',
        description: 'Review created successfully',
      });
      setReviewDialogOpen(false);
      setReviewData({
        review_type: 'lesson',
        lesson: undefined,
        mcq_test: undefined,
        qa_test: undefined,
        rating: 5,
        remarks: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Review creation error:', error);
      const errorMessage = error?.response?.data?.error 
        || error?.response?.data?.detail 
        || JSON.stringify(error?.response?.data) 
        || 'Failed to create review';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleCreateChat = async () => {
    if (!newChatName || selectedTeachers.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a chat name and select at least one teacher',
        variant: 'destructive',
      });
      return;
    }

    try {
      await groupChatAPI.createWithTeachers(newChatName, selectedTeachers);
      toast({
        title: 'Success',
        description: 'Chat created successfully',
      });
      setChatDialogOpen(false);
      setNewChatName('');
      setSelectedTeachers([]);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create chat',
        variant: 'destructive',
      });
    }
  };

  const handleSelectChat = async (chat: GroupChat) => {
    setSelectedChat(chat);
    try {
      const response = await chatMessageAPI.getChatMessages(chat.id);
      setChatMessages(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || (!newMessage.trim() && !selectedFile)) return;

    console.log('Sending message:', { 
      chatId: selectedChat.id, 
      message: newMessage, 
      hasFile: !!selectedFile 
    });

    try {
      const result = await chatMessageAPI.send(selectedChat.id, newMessage, selectedFile || undefined);
      console.log('Message sent successfully:', result);
      setNewMessage('');
      setSelectedFile(null);
      // Refresh messages
      const response = await chatMessageAPI.getChatMessages(selectedChat.id);
      setChatMessages(response.data);
      toast({
        title: 'Success',
        description: 'Message sent',
      });
    } catch (error: any) {
      console.error('Message send error:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      const errorMsg = error?.response?.data?.error 
        || error?.response?.data?.message 
        || JSON.stringify(error?.response?.data)
        || error?.message
        || 'Failed to send message';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleEditMessage = async (messageId: number) => {
    if (!editingMessageText.trim()) return;

    try {
      await chatMessageAPI.update(messageId, editingMessageText);
      setEditingMessageId(null);
      setEditingMessageText('');
      // Refresh messages
      if (selectedChat) {
        const response = await chatMessageAPI.getChatMessages(selectedChat.id);
        setChatMessages(response.data);
      }
      toast({
        title: 'Success',
        description: 'Message updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update message',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await chatMessageAPI.delete(messageId);
      // Refresh messages
      if (selectedChat) {
        const response = await chatMessageAPI.getChatMessages(selectedChat.id);
        setChatMessages(response.data);
      }
      toast({
        title: 'Success',
        description: 'Message deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  const handleAddTeacher = async (teacherId: number) => {
    if (!selectedChat) return;

    try {
      await groupChatAPI.addTeacher(selectedChat.id, teacherId);
      toast({
        title: 'Success',
        description: 'Teacher added to chat',
      });
      fetchData();
      // Refresh selected chat
      const chatResponse = await groupChatAPI.getById(selectedChat.id);
      setSelectedChat(chatResponse.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to add teacher',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveTeacher = async (teacherId: number) => {
    if (!selectedChat) return;

    try {
      await groupChatAPI.removeTeacher(selectedChat.id, teacherId);
      toast({
        title: 'Success',
        description: 'Teacher removed from chat',
      });
      fetchData();
      // Refresh selected chat
      const chatResponse = await groupChatAPI.getById(selectedChat.id);
      setSelectedChat(chatResponse.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to remove teacher',
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading user...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <DashboardLayout 
      userRole="advisor" 
      userName={user?.first_name || user?.username || 'Advisor'}
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatsCard
          title="My Teachers"
          value={teachers.length}
          icon={Users}
          description="Under supervision"
          color="purple"
        />
        <StatsCard
          title="Inspections"
          value={inspections.length}
          icon={ClipboardList}
          description={`${inspections.filter(i => i.status === 'scheduled').length} scheduled • ${inspections.filter(i => i.status === 'in_progress').length} in progress`}
          color="red"
        />
        <StatsCard
          title="Total Lessons"
          value={lessons.length}
          icon={BookOpen}
          description="Created by teachers"
          color="blue"
        />
        <StatsCard
          title="Total Tests"
          value={mcqTests.length + qaTests.length}
          icon={FileText}
          description="MCQ + Q&A tests"
          color="green"
        />
        <StatsCard
          title="Reviews Given"
          value={reviews.length}
          icon={Star}
          description="Feedback provided"
          color="orange"
        />
      </div>
        <Tabs defaultValue="overview" className="space-y-6">
          {/* Modern Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border p-2">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1 bg-transparent h-auto">
              <TabsTrigger 
                value="overview" 
                className="flex-col h-auto py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                <TrendingUp className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="schedule"
                className="flex-col h-auto py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
              >
                <Calendar className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Schedule</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="flex-col h-auto py-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
              >
                <Award className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="progress"
                className="flex-col h-auto py-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
              >
                <TrendingUp className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Progress</span>
              </TabsTrigger>
              <TabsTrigger 
                value="teachers"
                className="flex-col h-auto py-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
              >
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Teachers</span>
              </TabsTrigger>
              <TabsTrigger 
                value="vault"
                className="flex-col h-auto py-3 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:shadow-sm"
              >
                <Archive className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Vault</span>
              </TabsTrigger>
              <TabsTrigger 
                value="lessons"
                className="flex-col h-auto py-3 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm"
              >
                <BookOpen className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Lessons</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tests"
                className="flex-col h-auto py-3 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:shadow-sm"
              >
                <FileText className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Tests</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="flex-col h-auto py-3 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
              >
                <Star className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Reviews</span>
              </TabsTrigger>
              <TabsTrigger 
                value="chats"
                className="flex-col h-auto py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
              >
                <MessageSquare className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Chats</span>
              </TabsTrigger>
              <TabsTrigger 
                value="attendance"
                className="flex-col h-auto py-3 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
              >
                <CheckCircle className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Attendance</span>
              </TabsTrigger>
              <TabsTrigger 
                value="timeline"
                className="flex-col h-auto py-3 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm"
              >
                <Clock className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Timeline</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab with Stats */}
          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.first_name || user?.username}! 👋
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Here's your advisory overview for today
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{new Date().getDate()}</div>
                      <div className="text-sm opacity-90">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <AdvisorStats />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]');
                      const scheduleTab = tabsList?.querySelector('[value="schedule"]') as HTMLElement;
                      scheduleTab?.click();
                    }}
                  >
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <span className="text-sm font-medium">View Schedule</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300"
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]');
                      const teachersTab = tabsList?.querySelector('[value="teachers"]') as HTMLElement;
                      teachersTab?.click();
                    }}
                  >
                    <Users className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium">My Teachers</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300"
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]');
                      const reviewsTab = tabsList?.querySelector('[value="reviews"]') as HTMLElement;
                      reviewsTab?.click();
                    }}
                  >
                    <Star className="h-6 w-6 text-purple-600" />
                    <span className="text-sm font-medium">Write Review</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-300"
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]');
                      const chatsTab = tabsList?.querySelector('[value="chats"]') as HTMLElement;
                      chatsTab?.click();
                    }}
                  >
                    <MessageSquare className="h-6 w-6 text-teal-600" />
                    <span className="text-sm font-medium">Messages</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            {/* Header with Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-purple-600" />
                    My Inspection Schedule
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Manage your assigned inspections and track their progress
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchInspections()}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {/* Schedule Component */}
            <AdvisorSchedule />
          </TabsContent>

          {/* Attendance Verification Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <AdvisorAttendanceVerification />
          </TabsContent>

          {/* Teacher Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Header with Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Award className="h-6 w-6 text-green-600" />
                    Teacher Performance Analytics
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Monitor teacher ratings, content creation, and student outcomes
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTeacherAnalytics()}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">Loading analytics...</p>
                </CardContent>
              </Card>
            ) : teacherAnalytics.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No teacher analytics available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacherAnalytics.map((analytics) => (
                  <TeacherAnalyticsCard
                    key={analytics.id}
                    analytics={analytics}
                    onClick={() => {
                      setSelectedTeacher(analytics);
                      fetchTeacherProgress(analytics.teacher);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Teacher Detail Dialog */}
            {selectedTeacher && (
              <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">
                      {selectedTeacher.teacher_info.first_name} {selectedTeacher.teacher_info.last_name} - Detailed View
                    </DialogTitle>
                    <DialogDescription>
                      Complete performance overview and curriculum progress
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <TeacherProgressTimeline
                      progressList={teacherProgress}
                      teacherName={`${selectedTeacher.teacher_info.first_name} ${selectedTeacher.teacher_info.last_name}`}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Chapter Progress Notifications Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Chapter Progression Tracking</CardTitle>
                <CardDescription>
                  Review and confirm teacher chapter progressions detected by AI
                </CardDescription>
              </CardHeader>
            </Card>

            <ChapterNotificationList
              notifications={chapterNotifications}
              onUpdate={fetchChapterNotifications}
            />
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-600" />
                    My Teachers
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Teachers in your subject: <span className="font-semibold text-indigo-600">{user?.subjects?.[0]}</span>
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {teachers.length} {teachers.length === 1 ? 'Teacher' : 'Teachers'}
                </Badge>
              </div>
            </div>

            {/* Teachers Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => (
                <Card key={teacher.id} className="hover:shadow-lg transition-shadow duration-200 border-2 hover:border-indigo-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {teacher.first_name?.[0] || teacher.username[0].toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{teacher.full_name}</CardTitle>
                          <CardDescription className="text-xs">@{teacher.username}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-2">
                      {teacher.subjects?.map((subject) => (
                        <Badge key={subject} variant="secondary" className="text-xs">
                          {t(`subject.${subject}`)}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const tabsList = document.querySelector('[role="tablist"]');
                          const analyticsTab = tabsList?.querySelector('[value="analytics"]') as HTMLElement;
                          analyticsTab?.click();
                        }}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        View Stats
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const tabsList = document.querySelector('[role="tablist"]');
                          const chatsTab = tabsList?.querySelector('[value="chats"]') as HTMLElement;
                          chatsTab?.click();
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {teachers.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Teachers Yet</h3>
                  <p className="text-gray-500">
                    Teachers in your subject will appear here once they're assigned.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <TeacherTimelineViewer />
          </TabsContent>

          {/* Vault Tab */}
          <TabsContent value="vault" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Archive className="h-6 w-6" />
                  Lesson Plan Vault
                </CardTitle>
                <CardDescription>
                  Create and share lesson plans with teachers in your subject area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Access the full vault dashboard to create and manage lesson plans
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/vault/advisor')}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Open Vault Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value="lessons" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Lessons</h2>
                <p className="text-sm text-gray-600">
                  View and review lessons from teachers in your subject
                </p>
              </div>
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Review</DialogTitle>
                    <DialogDescription>
                      Leave feedback and rating for a lesson or test
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Review Type</Label>
                      <Select
                        value={reviewData.review_type}
                        onValueChange={(value: any) =>
                          setReviewData({ ...reviewData, review_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lesson">Lesson</SelectItem>
                          <SelectItem value="mcq_test">MCQ Test</SelectItem>
                          <SelectItem value="qa_test">Q&A Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {reviewData.review_type === 'lesson' && (
                      <div>
                        <Label>Select Lesson</Label>
                        <Select
                          value={reviewData.lesson?.toString()}
                          onValueChange={(value) =>
                            setReviewData({ 
                              ...reviewData, 
                              lesson: parseInt(value),
                              mcq_test: undefined,
                              qa_test: undefined
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('choose.lesson')} />
                          </SelectTrigger>
                          <SelectContent>
                            {lessons && lessons.length > 0 ? (
                              lessons.map((lesson) => (
                                <SelectItem key={lesson.id} value={lesson.id.toString()}>
                                  {lesson.title}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No lessons available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {reviewData.review_type === 'mcq_test' && (
                      <div>
                        <Label>Select MCQ Test</Label>
                        <Select
                          value={reviewData.mcq_test?.toString()}
                          onValueChange={(value) =>
                            setReviewData({ 
                              ...reviewData, 
                              mcq_test: parseInt(value),
                              lesson: undefined,
                              qa_test: undefined
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an MCQ test" />
                          </SelectTrigger>
                          <SelectContent>
                            {mcqTests && mcqTests.length > 0 ? (
                              mcqTests.map((test) => (
                                <SelectItem key={test.id} value={test.id.toString()}>
                                  {test.title || test.lesson_title}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No MCQ tests available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {reviewData.review_type === 'qa_test' && (
                      <div>
                        <Label>Select Q&A Test</Label>
                        <Select
                          value={reviewData.qa_test?.toString()}
                          onValueChange={(value) =>
                            setReviewData({ 
                              ...reviewData, 
                              qa_test: parseInt(value),
                              lesson: undefined,
                              mcq_test: undefined
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('choose.qaTest')} />
                          </SelectTrigger>
                          <SelectContent>
                            {qaTests && qaTests.length > 0 ? (
                              qaTests.map((test) => (
                                <SelectItem key={test.id} value={test.id.toString()}>
                                  {test.title || test.lesson_title}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No Q&A tests available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>Rating</Label>
                      <Select
                        value={reviewData.rating.toString()}
                        onValueChange={(value) =>
                          setReviewData({ ...reviewData, rating: parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} Star{rating > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Remarks</Label>
                      <Textarea
                        value={reviewData.remarks}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, remarks: e.target.value })
                        }
                        placeholder="Your feedback..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleCreateReview} className="w-full">
                      Submit Review
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {lessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <CardTitle>{lesson.title}</CardTitle>
                    <CardDescription>
                      By {lesson.created_by_name} • {lesson.subject_display} •{' '}
                      {lesson.grade_level_display}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3">{lesson.content}</p>
                    <div className="mt-4 flex gap-2">
                      <Badge variant="outline">{lesson.subject_display}</Badge>
                      <Badge variant="outline">{lesson.grade_level_display}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {lessons.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-8">
                  No lessons available
                </p>
              )}
            </div>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Tests</h2>
                <p className="text-sm text-gray-600">
                  Browse and review tests from teachers in your subject
                </p>
              </div>
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Star className="h-4 w-4 mr-2" />
                    Create Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Review</DialogTitle>
                    <DialogDescription>
                      Leave feedback and rating for a test
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Review Type</Label>
                      <Select
                        value={reviewData.review_type}
                        onValueChange={(value: any) =>
                          setReviewData({ ...reviewData, review_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq_test">MCQ Test</SelectItem>
                          <SelectItem value="qa_test">Q&A Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {reviewData.review_type === 'mcq_test' && (
                      <div>
                        <Label>Select MCQ Test</Label>
                        <Select
                          value={reviewData.mcq_test?.toString()}
                          onValueChange={(value) =>
                            setReviewData({ 
                              ...reviewData, 
                              mcq_test: parseInt(value),
                              lesson: undefined,
                              qa_test: undefined
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an MCQ test" />
                          </SelectTrigger>
                          <SelectContent>
                            {mcqTests && mcqTests.length > 0 ? (
                              mcqTests.map((test) => (
                                <SelectItem key={test.id} value={test.id.toString()}>
                                  {test.title || test.lesson_title}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No MCQ tests available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {reviewData.review_type === 'qa_test' && (
                      <div>
                        <Label>Select Q&A Test</Label>
                        <Select
                          value={reviewData.qa_test?.toString()}
                          onValueChange={(value) =>
                            setReviewData({ 
                              ...reviewData, 
                              qa_test: parseInt(value),
                              lesson: undefined,
                              mcq_test: undefined
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('choose.qaTest')} />
                          </SelectTrigger>
                          <SelectContent>
                            {qaTests && qaTests.length > 0 ? (
                              qaTests.map((test) => (
                                <SelectItem key={test.id} value={test.id.toString()}>
                                  {test.title || test.lesson_title}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No Q&A tests available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>Rating</Label>
                      <Select
                        value={reviewData.rating.toString()}
                        onValueChange={(value) =>
                          setReviewData({ ...reviewData, rating: parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} Star{rating > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Remarks</Label>
                      <Textarea
                        value={reviewData.remarks}
                        onChange={(e) =>
                          setReviewData({ ...reviewData, remarks: e.target.value })
                        }
                        placeholder="Your feedback..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleCreateReview} className="w-full">
                      Submit Review
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-6">
              {/* MCQ Tests Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">MCQ Tests</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {mcqTests.map((test) => (
                    <Card key={test.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{test.title || 'Untitled Test'}</CardTitle>
                        <CardDescription>
                          Lesson: {test.lesson_title}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge variant={test.status === 'approved' ? 'default' : 'secondary'}>
                              {test.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(test.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {mcqTests.length === 0 && (
                    <p className="text-gray-500 col-span-full text-center py-8">
                      No MCQ tests available
                    </p>
                  )}
                </div>
              </div>

              {/* Q&A Tests Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Q&A Tests</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {qaTests.map((test) => (
                    <Card key={test.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{test.title || 'Untitled Test'}</CardTitle>
                        <CardDescription>
                          Lesson: {test.lesson_title}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Badge variant={test.status === 'approved' ? 'default' : 'secondary'}>
                              {test.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(test.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {qaTests.length === 0 && (
                    <p className="text-gray-500 col-span-full text-center py-8">
                      No Q&A tests available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Star className="h-6 w-6 text-amber-600" />
                    My Reviews
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Reviews and feedback you've provided
                  </p>
                </div>
                <Button
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => setReviewDialogOpen(true)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Create Review
                </Button>
              </div>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start creating reviews to provide feedback on lessons and tests.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setReviewDialogOpen(true)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Create Your First Review
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            {review.target_title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            By {review.teacher_username} • {review.review_type.replace('_', ' ').toUpperCase()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <Badge variant={review.rating >= 4 ? 'default' : review.rating >= 3 ? 'secondary' : 'destructive'}>
                            {review.rating}/5
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-3">{review.remarks}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Chats Tab */}
          <TabsContent value="chats" className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-teal-600" />
                    Group Chats
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Communicate with teachers in your subject
                  </p>
                </div>
                <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      New Chat
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                    <DialogDescription>
                      Start a conversation with teachers
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Chat Name</Label>
                      <Input
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        placeholder="e.g., Math Department Discussion"
                      />
                    </div>
                    <div>
                      <Label>Select Teachers</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {teachers.map((teacher) => (
                          <div key={teacher.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`teacher-${teacher.id}`}
                              checked={selectedTeachers.includes(teacher.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTeachers([...selectedTeachers, teacher.id]);
                                } else {
                                  setSelectedTeachers(
                                    selectedTeachers.filter((id) => id !== teacher.id)
                                  );
                                }
                              }}
                            />
                            <Label htmlFor={`teacher-${teacher.id}`}>
                              {teacher.full_name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleCreateChat} className="w-full">
                      Create Chat
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {/* Chats Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Chat List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Chats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChat?.id === chat.id
                          ? 'bg-blue-100'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-medium">{chat.name}</p>
                      <p className="text-xs text-gray-600">
                        {chat.teachers_info.length} teacher(s)
                      </p>
                      {chat.unread_count > 0 && (
                        <Badge variant="destructive" className="mt-1">
                          {chat.unread_count} new
                        </Badge>
                      )}
                    </div>
                  ))}
                  {chats.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No chats yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Messages */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {selectedChat ? selectedChat.name : t('select.chat')}
                      </CardTitle>
                      {selectedChat && (
                        <CardDescription>
                          Participants:{' '}
                          {selectedChat.teachers_info
                            .map((t) => t.full_name)
                            .join(', ')}
                        </CardDescription>
                      )}
                    </div>
                    {selectedChat && (
                      <Dialog open={manageMembersDialogOpen} onOpenChange={setManageMembersDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Chat Members</DialogTitle>
                            <DialogDescription>
                              Add or remove teachers from this chat
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Current Members</h4>
                              <div className="space-y-2">
                                {selectedChat.teachers_info.map((teacher) => (
                                  <div key={teacher.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span>{teacher.full_name}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveTeacher(teacher.id)}
                                    >
                                      <UserMinus className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Add Teachers</h4>
                              <div className="space-y-2">
                                {teachers
                                  .filter(t => !selectedChat.teachers_info.find(ct => ct.id === t.id))
                                  .map((teacher) => (
                                    <div key={teacher.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <span>{teacher.full_name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddTeacher(teacher.id)}
                                      >
                                        <UserPlus className="h-4 w-4 text-green-500" />
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedChat ? (
                    <div className="space-y-4">
                      {/* Messages */}
                      <div className="h-96 overflow-y-auto space-y-2 p-4 bg-gray-50 rounded-lg">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender === user?.id
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs px-4 py-2 rounded-lg ${
                                message.sender === user?.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white'
                              }`}
                            >
                              <p className="text-xs font-medium mb-1">
                                {message.sender_info.full_name}
                              </p>
                              {editingMessageId === message.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editingMessageText}
                                    onChange={(e) => setEditingMessageText(e.target.value)}
                                    className={`text-sm ${
                                      message.sender === user?.id
                                        ? 'bg-white text-gray-900'
                                        : 'bg-white text-gray-900'
                                    }`}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditMessage(message.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingMessageId(null);
                                        setEditingMessageText('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {message.message && <p className="text-sm">{message.message}</p>}
                                  {message.file_attachment_url && (
                                    <div className="mt-2">
                                      {message.file_attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <a href={message.file_attachment_url} target="_blank" rel="noopener noreferrer">
                                          <img 
                                            src={message.file_attachment_url} 
                                            alt="Attachment" 
                                            className="max-w-xs rounded border"
                                            style={{ maxHeight: '200px' }}
                                          />
                                        </a>
                                      ) : (
                                        <a
                                          href={message.file_attachment_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs underline flex items-center gap-1 p-2 bg-gray-100 rounded"
                                        >
                                          <Paperclip className="h-3 w-3" />
                                          {message.file_attachment_url.split('/').pop() || 'Download File'}
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {message.is_edited && (
                                    <p className="text-xs opacity-70 italic mt-1">edited</p>
                                  )}
                                </>
                              )}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs opacity-70">
                                    {new Date(message.created_at).toLocaleTimeString()}
                                  </p>
                                  {message.sender === user?.id && editingMessageId !== message.id && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingMessageId(message.id);
                                          setEditingMessageText(message.message);
                                        }}
                                        className="opacity-70 hover:opacity-100"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="opacity-70 hover:opacity-100"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {message.read_by_users && message.read_by_users.length > 0 && (
                                  <p className="text-xs opacity-60">
                                    Read by: {message.read_by_users.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Send Message */}
                      <div className="space-y-2">
                        {selectedFile && (
                          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm flex-1">{selectedFile.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder="Type a message..."
                          />
                          <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSelectedFile(e.target.files[0]);
                              }
                            }}
                          />
                          <Button
                            onClick={() => document.getElementById('file-upload')?.click()}
                            size="icon"
                            variant="outline"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button onClick={handleSendMessage} size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-gray-500">
                      {t('select.toStartMessaging')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
};

export default AdvisorDashboard;
