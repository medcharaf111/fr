import DarkModeToggle from '@/components/DarkModeToggle';
import DashboardLayout from '@/components/DashboardLayout';
import { LanguageToggle } from '@/components/LanguageToggle';
import LessonTimeline from '@/components/LessonTimeline';
import StudentAttendanceMarking from '@/components/StudentAttendanceMarking';
import TeacherAttendanceWidget from '@/components/TeacherAttendanceWidget';
import TeacherNotebookViewer from '@/components/TeacherNotebookViewer';
import TeachingTimeline from '@/components/TeachingTimeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import api, { advisorReviewAPI, authAPI, chatMessageAPI, groupChatAPI, lessonAPI, parentAPI, testAPI } from '@/lib/api';
import { AdvisorReview, ChatMessage, GroupChat, Lesson, ParentTeacherChat, ParentTeacherMessage, Progress, Test, UserBasic } from '@/types/api';
import { AlertCircle, Archive, Award, BookOpen, Bot, Calendar, CheckCheck, CheckCircle, ClipboardCheck, Clock, Edit2, Loader2, MessageSquare, NotebookPen, Paperclip, Send, Star, Trash2, TrendingUp, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import TeacherRelationships from './TeacherRelationships';

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

// Helper function to get subject-specific badge colors
const getSubjectBadgeColor = (subject: string) => {
  const colors: Record<string, string> = {
    math: 'bg-blue-100 text-blue-800 border-blue-300',
    science: 'bg-green-100 text-green-800 border-green-300',
    english: 'bg-purple-100 text-purple-800 border-purple-300',
    arabic: 'bg-orange-100 text-orange-800 border-orange-300',
    social_studies: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    art: 'bg-pink-100 text-pink-800 border-pink-300',
    music: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    physical_education: 'bg-red-100 text-red-800 border-red-300',
    computer_science: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    religious_studies: 'bg-teal-100 text-teal-800 border-teal-300',
  };
  return colors[subject] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const TeacherDashboard = () => {
  const { language, setLanguage, dir, t } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [prompt, setPrompt] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('grade_1');
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [grading, setGrading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Subject filter for lessons list
  const [lessonSubjectFilter, setLessonSubjectFilter] = useState<string>('all');
  
  // Assigned subjects and grades state
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [assignedGrades, setAssignedGrades] = useState<string[]>([]);
  const [hasAssignments, setHasAssignments] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  
  // Dynamic subject and grade options using translations
  const SUBJECT_OPTIONS_DYNAMIC = [
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
  ];

  const GRADE_OPTIONS_DYNAMIC = [
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
  ];
  
  // Advisor and chat state
  const [advisor, setAdvisor] = useState<UserBasic | null>(null);
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<GroupChat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  
  // Parent-teacher chat state
  const [parentChats, setParentChats] = useState<ParentTeacherChat[]>([]);
  const [selectedParentChat, setSelectedParentChat] = useState<ParentTeacherChat | null>(null);
  const [parentChatMessages, setParentChatMessages] = useState<ParentTeacherMessage[]>([]);
  const [parentNewMessage, setParentNewMessage] = useState('');
  const [reviews, setReviews] = useState<AdvisorReview[]>([]);
  
  // Timetable state
  const [timetable, setTimetable] = useState<any>(null);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [weeklyAttendanceStatus, setWeeklyAttendanceStatus] = useState<any>(null);
  
  const { toast } = useToast();
  const user = authAPI.getCurrentUser();
  const navigate = useNavigate();

  // Get available subjects and grades based on assignments (not general teacher subjects)
  const availableSubjects = SUBJECT_OPTIONS.filter(option => 
    assignedSubjects.includes(option.value)
  );
  
  const availableGrades = GRADE_OPTIONS.filter(option => 
    assignedGrades.includes(option.value)
  );

  // Filter lessons by subject
  const filteredLessons = lessonSubjectFilter === 'all' 
    ? lessons 
    : lessons.filter(lesson => lesson.subject === lessonSubjectFilter);

  // Group lessons by subject with counts
  const lessonsBySubject = lessons.reduce((acc, lesson) => {
    const subjectKey = lesson.subject;
    if (!acc[subjectKey]) {
      acc[subjectKey] = [];
    }
    acc[subjectKey].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  // Fetch assigned subjects and grades
  const fetchAssignedSubjects = async () => {
    try {
      setLoadingAssignments(true);
      const response = await api.get('/users/assigned-subjects/');
      console.log('Assigned subjects response:', response.data);
      
      // Extract unique subject codes
      const subjectCodes = response.data.subject_codes || [];
      setAssignedSubjects(subjectCodes);
      
      // Extract unique grade levels - now directly from grade_codes
      const gradeCodes = response.data.grade_codes || [];
      setAssignedGrades(gradeCodes);
      
      setHasAssignments(response.data.has_assignments || false);
      
      // Set default subject if available
      if (subjectCodes.length > 0 && !subject) {
        setSubject(subjectCodes[0]);
      }
      
      // Set default grade if available and current grade not in assigned grades
      if (gradeCodes.length > 0 && !gradeCodes.includes(gradeLevel)) {
        setGradeLevel(gradeCodes[0]);
      }
      
      console.log('Available subjects after filter:', 
        SUBJECT_OPTIONS.filter(option => subjectCodes.includes(option.value))
      );
      console.log('Available grades after filter:', gradeCodes,
        GRADE_OPTIONS.filter(option => gradeCodes.includes(option.value))
      );
    } catch (error) {
      console.error('Failed to fetch assigned subjects:', error);
      toast({
        title: 'Warning',
        description: 'Could not load your subject assignments. Please contact your director.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    fetchAssignedSubjects();
    fetchLessons();
    fetchTests();
    fetchProgress();
    fetchAdvisorAndChats();
    fetchReviews();
    fetchParentChats();
    fetchTimetable();
    fetchWeeklyAttendanceStatus();
    
    // Set up interval to refresh attendance status every 2 minutes
    const interval = setInterval(fetchWeeklyAttendanceStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchLessons = async () => {
    try {
      const response = await api.get('/lessons/');
      setLessons(response.data);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await api.get('/tests/');
      setTests(response.data);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await api.get('/progress/');
      setProgress(response.data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const fetchAdvisorAndChats = async () => {
    try {
      // Fetch chats (teacher is a participant)
      const chatsResponse = await groupChatAPI.getMyChats();
      setChats(chatsResponse.data || []);
      
      // Find advisor from chats (the advisor who created the chat)
      if (chatsResponse.data && chatsResponse.data.length > 0) {
        const firstChat = chatsResponse.data[0];
        if (firstChat.advisor_info) {
          setAdvisor(firstChat.advisor_info);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await advisorReviewAPI.getReviewsOnMyContent();
      setReviews(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchParentChats = async () => {
    try {
      const response = await parentAPI.getMyChats();
      setParentChats(response.data || []);
    } catch (error) {
      console.error('Failed to fetch parent chats:', error);
    }
  };

  const fetchTimetable = async () => {
    if (!user) return;
    
    setLoadingTimetable(true);
    try {
      const response = await api.get('/teacher-timetables/my-schedule/');
      setTimetable(response.data);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const fetchWeeklyAttendanceStatus = async () => {
    if (!user) return;
    
    try {
      const response = await api.get('/teacher-attendance/weekly_status/');
      setWeeklyAttendanceStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch weekly attendance status:', error);
    }
  };

  const fetchParentChatMessages = async (chatId: number) => {
    try {
      const response = await parentAPI.getChatMessages(chatId);
      setParentChatMessages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch parent chat messages:', error);
    }
  };

  const handleSelectChat = async (chat: GroupChat) => {
    setSelectedChat(chat);
    try {
      const response = await chatMessageAPI.getChatMessages(chat.id);
      setChatMessages(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || (!newMessage.trim() && !chatFile)) return;

    try {
      await chatMessageAPI.send(selectedChat.id, newMessage, chatFile || undefined);
      setNewMessage('');
      setChatFile(null);
      // Refresh messages
      const response = await chatMessageAPI.getChatMessages(selectedChat.id);
      setChatMessages(response.data || []);
      toast({
        title: 'Success',
        description: 'Message sent',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to send message',
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
        setChatMessages(response.data || []);
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
        setChatMessages(response.data || []);
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

  const handleSelectParentChat = async (chat: ParentTeacherChat) => {
    setSelectedParentChat(chat);
    await fetchParentChatMessages(chat.id);
    // Mark as read
    try {
      await parentAPI.markChatRead(chat.id);
      // Refresh chats to update unread count
      fetchParentChats();
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
    }
  };

  const handleSendParentMessage = async () => {
    if (!selectedParentChat || !parentNewMessage.trim()) return;

    try {
      await parentAPI.sendMessage(selectedParentChat.id, { message: parentNewMessage });
      setParentNewMessage('');
      // Refresh messages
      await fetchParentChatMessages(selectedParentChat.id);
      // Refresh chats
      fetchParentChats();
      toast({
        title: 'Success',
        description: 'Message sent to parent',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to send message',
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

  const handleGenerateLesson = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const response = await lessonAPI.generateLesson(prompt, lessonTitle || undefined, subject, gradeLevel);
      toast({
        title: 'Lesson generated successfully! 🎉',
        description: `AI has created your lesson${lessonTitle ? ` "${lessonTitle}"` : ''}.`,
      });
      setPrompt('');
      setLessonTitle('');
      fetchLessons();
      
      // Show the generated lesson
      if (response.lesson) {
        setSelectedLesson(response.lesson);
        setViewDialogOpen(true);
      }
    } catch (error: any) {
      toast({
        title: 'Generation failed',
        description: error.response?.data?.error || 'Failed to generate lesson. Please check your API key and try again.',
        variant: 'destructive',
      });
      console.error('Error generating lesson:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleGradeTest = async () => {
    if (!selectedFile) return;
    setGrading(true);
    try {
      const response = await testAPI.gradeTest(selectedFile);
      toast({
        title: 'Grading completed',
        description: `Scores: ${JSON.stringify(response.scores)}`,
      });
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: 'Grading failed',
        description: 'Failed to grade the test. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGrading(false);
    }
  };

  const viewLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setViewDialogOpen(true);
  };

  const handleGenerateTest = async (lesson: Lesson) => {
    try {
      const response = await testAPI.generateTest(lesson.id, 10, `MCQ Test: ${lesson.title}`);
      toast({
        title: 'MCQ Test Generated! 🎉',
        description: 'Test is pending your review. Go to Manage Tests to approve it.',
      });
      fetchTests();
    } catch (error: any) {
      console.error('Failed to generate test:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to generate MCQ test',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateQATest = async (lesson: Lesson) => {
    try {
      const response = await api.post('/qa-tests/generate-qa-test/', {
        lesson_id: lesson.id,
        num_questions: 5,
        time_limit: 30,
        title: `Q&A Test: ${lesson.title}`
      });
      toast({
        title: 'Q&A Test Generated! 📝',
        description: 'Test is pending your review. Go to Q&A Management to approve it.',
      });
      fetchTests();
    } catch (error: any) {
      console.error('Failed to generate Q&A test:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to generate Q&A test',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout 
      userRole="teacher" 
      userName={user?.first_name || user?.username || 'Teacher'}
    >
      {/* Language & Theme Toggle Buttons */}
      <div className="flex justify-end gap-2 mb-4 p-3 px-4 bg-card rounded-lg border border-border/50">
        <DarkModeToggle />
        <LanguageToggle
          variant="outline"
          size="default"
        />
      </div>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8" dir={dir}>
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('teacherDash.stats.totalLessons')}</CardTitle>
              <BookOpen className="h-6 w-6 text-blue-200" />
            </div>
            <CardDescription className="text-blue-100">
              {t('teacherDash.stats.totalLessons.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{lessons.length}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('teacherDash.stats.totalTests')}</CardTitle>
              <ClipboardCheck className="h-6 w-6 text-green-200" />
            </div>
            <CardDescription className="text-green-100">
              {t('teacherDash.stats.totalTests.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('teacherDash.stats.myStudents')}</CardTitle>
              <Users className="h-6 w-6 text-purple-200" />
            </div>
            <CardDescription className="text-purple-100">
              {t('teacherDash.stats.myStudents.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{progress.length}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-[400ms]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('teacherDash.stats.reviewsReceived')}</CardTitle>
              <Award className="h-6 w-6 text-orange-200" />
            </div>
            <CardDescription className="text-orange-100">
              {t('teacherDash.stats.reviewsReceived.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Widget */}
      <div className="mb-8">
        <TeacherAttendanceWidget />
      </div>

      {/* Enhanced Quick Actions Bar */}
      <div className="mb-8" dir={dir}>
        <Card className="border-0 shadow-sm bg-muted/50 dark:bg-muted/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => navigate('/chat')}
                variant="outline"
                className="group h-auto p-4 border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <Bot className="h-5 w-5 text-indigo-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-indigo-900 transition-colors">
                      AI Assistant
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-indigo-700 transition-colors">
                      Get AI help
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/test-management')}
                variant="outline"
                className="group h-auto p-4 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <ClipboardCheck className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-blue-900 transition-colors">
                      MCQ Tests
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-blue-700 transition-colors">
                      Create & manage tests
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/qa-management')}
                variant="outline"
                className="group h-auto p-4 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-500/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <ClipboardCheck className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-green-900 transition-colors">
                      Q&A Tests
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-green-700 transition-colors">
                      Manage open-ended tests
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/vault/teacher')}
                variant="outline"
                className="group h-auto p-4 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <Archive className="h-5 w-5 text-purple-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-purple-900 transition-colors">
                      Lesson Vault
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-purple-700 transition-colors">
                      Browse lesson plans
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
        <Tabs defaultValue="lessons" className="space-y-6">
          {/* Modern Tab Navigation */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-2">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1 bg-transparent h-auto">
              <TabsTrigger
                value="lessons"
                className="flex-col h-auto py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
              >
                <BookOpen className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.lessons')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="tests"
                className="flex-col h-auto py-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-green-950 dark:data-[state=active]:text-green-300"
              >
                <ClipboardCheck className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.tests')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="flex-col h-auto py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-purple-950 dark:data-[state=active]:text-purple-300"
              >
                <Calendar className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.timeline')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="vault"
                className="flex-col h-auto py-3 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-pink-950 dark:data-[state=active]:text-pink-300"
              >
                <Archive className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Vault</span>
              </TabsTrigger>
              <TabsTrigger
                value="relationships"
                className="flex-col h-auto py-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-indigo-950 dark:data-[state=active]:text-indigo-300"
              >
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.relationships')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="notebooks"
                className="flex-col h-auto py-3 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-cyan-950 dark:data-[state=active]:text-cyan-300"
              >
                <NotebookPen className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.notebook')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="progress"
                className="flex-col h-auto py-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-orange-950 dark:data-[state=active]:text-orange-300"
              >
                <TrendingUp className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.progress')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="grading"
                className="flex-col h-auto py-3 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-yellow-950 dark:data-[state=active]:text-yellow-300"
              >
                <Award className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.test.grade')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="advisor"
                className="flex-col h-auto py-3 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-amber-950 dark:data-[state=active]:text-amber-300"
              >
                <Star className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.reviews')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="chats"
                className="flex-col h-auto py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-teal-950 dark:data-[state=active]:text-teal-300"
              >
                <MessageSquare className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.chats')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="student-attendance"
                className="flex-col h-auto py-3 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-950 dark:data-[state=active]:text-emerald-300"
              >
                <CheckCheck className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.attendance')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="timetable"
                className="flex-col h-auto py-3 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
              >
                <Clock className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{t('teacherDash.tabs.schedule')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="lessons">
            <Card>
              <CardHeader>
                <CardTitle>{t('teacherDash.lessonsList.title')}</CardTitle>
                <CardDescription>
                  {t('teacherDash.lesson.title')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show warning if no assignments */}
                {!loadingAssignments && !hasAssignments && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-yellow-600">⚠️</div>
                      <div>
                        <p className="font-medium text-yellow-900">{t('teacherDash.assignments.noAssignments')}</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {t('teacherDash.assignments.noAssignments.desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show loading state */}
                {loadingAssignments && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <p className="text-sm text-blue-700">{t('teacherDash.assignments.loading')}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="lessonTitle">{t('teacherDash.lesson.titleLabel')}</Label>
                    <Input
                      id="lessonTitle"
                      placeholder={t('teacherDash.lesson.titlePlaceholder')}
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subject">{t('teacherDash.lesson.subjectLabel')}</Label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('teacherDash.lesson.subjectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubjects.length > 0 ? (
                            availableSubjects.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No subjects assigned
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {!loadingAssignments && availableSubjects.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          No subjects assigned. Contact your school director.
                        </p>
                      )}
                      {!loadingAssignments && availableSubjects.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          You are assigned to {availableSubjects.length} subject{availableSubjects.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="gradeLevel">{t('teacherDash.lesson.gradeLabel')}</Label>
                      <Select value={gradeLevel} onValueChange={setGradeLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('teacherDash.lesson.subjectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGrades.length > 0 ? (
                            availableGrades.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {t('teacherDash.assignments.noAssignments')}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {!loadingAssignments && availableGrades.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          No grades assigned. Contact your school director.
                        </p>
                      )}
                      {!loadingAssignments && availableGrades.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          You are assigned to {availableGrades.length} grade{availableGrades.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="prompt">{t('teacherDash.lesson.promptLabel')}</Label>
                    <Textarea
                      id="prompt"
                      placeholder={t('teacherDash.lesson.promptPlaceholder')}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <Button
                    onClick={handleGenerateLesson}
                    disabled={generating || !prompt.trim() || !subject || !hasAssignments || loadingAssignments}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('teacherDash.lesson.generatingContent')}
                      </>
                    ) : loadingAssignments ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : !hasAssignments ? (
                      `⚠️ ${t('teacherDash.assignments.noAssignments')}`
                    ) : (
                      `✨ ${t('teacherDash.lesson.generate')}`
                    )}
                  </Button>
                  {availableSubjects.length > 0 && subject ? (
                    <p className="text-xs text-gray-500">
                      Powered by Google Gemini AI - Lesson will be tailored for {availableSubjects.find(s => s.value === subject)?.label} at {GRADE_OPTIONS.find(g => g.value === gradeLevel)?.label} level
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Powered by Google Gemini AI
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {t('teacherDash.lessonsList.title')} ({filteredLessons.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="lessonFilter" className="text-sm">{t('teacherDash.lessonsList.filter')}:</Label>
                      <Select value={lessonSubjectFilter} onValueChange={setLessonSubjectFilter}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder={t('teacherDash.lessonsList.all')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('teacherDash.lessonsList.all')} ({lessons.length})
                          </SelectItem>
                          {availableSubjects.map(option => {
                            const count = lessonsBySubject[option.value]?.length || 0;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label} ({count})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subject-grouped view when showing all */}
                  {lessonSubjectFilter === 'all' && lessons.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {availableSubjects.map(option => {
                        const count = lessonsBySubject[option.value]?.length || 0;
                        if (count === 0) return null;
                        return (
                          <Badge 
                            key={option.value} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => setLessonSubjectFilter(option.value)}
                          >
                            {option.label}: {count} lesson{count !== 1 ? 's' : ''}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    {filteredLessons.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        {lessonSubjectFilter === 'all' 
                          ? t('teacherDash.lessonsList.noLessons.desc')
                          : `${t('teacherDash.lessonsList.noLessons')} ${SUBJECT_OPTIONS_DYNAMIC.find(s => s.value === lessonSubjectFilter)?.label}`}
                      </p>
                    ) : (
                      filteredLessons.map((lesson) => (
                        <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`text-xs border ${getSubjectBadgeColor(lesson.subject)}`} variant="outline">
                                    {lesson.subject_display}
                                  </Badge>
                                  <Badge className="text-xs bg-green-100 text-green-800 border-green-300" variant="outline">
                                    {lesson.grade_level_display}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-lg">{lesson.title}</h4>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{lesson.content.substring(0, 150)}...</p>
                            <div className="flex justify-between items-center mt-4 pt-3 border-t">
                              <div className="text-xs text-gray-500">
                                <p>Created: {new Date(lesson.created_at).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-400">by {lesson.created_by_name}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => viewLesson(lesson)}
                                >
                                  {t('teacherDash.lessonsList.view')}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  onClick={() => handleGenerateTest(lesson)}
                                >
                                  MCQ Test
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="secondary" 
                                  onClick={() => handleGenerateQATest(lesson)}
                                >
                                  Q&A Test
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <Card>
              <CardHeader>
                <CardTitle>{t('teacherDash.testsList.title')}</CardTitle>
                <CardDescription>
                  {t('teacherDash.test.title')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tests.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t('teacherDash.testsList.noTests.desc')}</p>
                  ) : (
                    tests.map((test) => (
                      <Card key={test.id}>
                        <CardContent className="pt-4">
                          <h4 className="font-semibold">{test.title}</h4>
                          <p className="text-sm text-gray-600">{t('teacherDash.testView.lesson')}: {test.lesson_title}</p>
                          <p className="text-xs text-gray-500">Created: {new Date(test.created_at).toLocaleDateString()}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="space-y-6">
              <LessonTimeline />
              <TeachingTimeline isEditable={true} teacherSubjects={user?.subjects || []} />
            </div>
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
                  Browse lesson plans by subject and use them in your teaching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Access the full vault dashboard to browse lesson plans organized by subject
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/vault/teacher')}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Open Vault Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relationships">
            <TeacherRelationships />
          </TabsContent>

          <TabsContent value="notebooks">
            <TeacherNotebookViewer />
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>{t('teacherDash.progress.title')}</CardTitle>
                <CardDescription>
                  {t('teacherDash.progress.noProgress.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {progress.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t('teacherDash.progress.noProgress')}</p>
                  ) : (
                    progress.map((p) => (
                      <Card key={p.id}>
                        <CardContent className="pt-4">
                          <h4 className="font-semibold">{p.student_name} - {p.lesson_title}</h4>
                          <p className="text-sm">{t('teacherDash.progress.avgScore')}: {p.score || t('common.noData')}</p>
                          <p className="text-sm">Completed: {p.completed_at ? new Date(p.completed_at).toLocaleDateString() : 'In progress'}</p>
                          <p className="text-xs text-gray-600">{p.notes}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grading">
            <Card>
              <CardHeader>
                <CardTitle>{t('teacherDash.test.grade')}</CardTitle>
                <CardDescription>
                  {t('teacherDash.test.autoGenerate')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="test-image">Select Test Image</Label>
                  <Input
                    id="test-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    onClick={handleGradeTest}
                    disabled={grading || !selectedFile}
                    className="mt-2"
                  >
                    {grading ? 'Grading...' : 'Grade Test'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advisor Tab */}
          <TabsContent value="advisor">
            <Card>
              <CardHeader>
                <CardTitle>{t('teacherDash.tabs.reviews')}</CardTitle>
                <CardDescription>
                  {t('teacherDash.reviews.title')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {advisor ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{advisor.full_name}</CardTitle>
                        <CardDescription>@{advisor.username}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">{advisor.email}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {advisor.subjects?.map((subject) => (
                            <Badge key={subject} variant="secondary">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">{t('teacherDash.reviews.title')}</h3>
                      <div className="space-y-4">
                        {reviews.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">{t('teacherDash.reviews.noReviews.desc')}</p>
                        ) : (
                          reviews.map((review) => (
                            <Card key={review.id}>
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle className="text-base">{review.target_title}</CardTitle>
                                    <CardDescription>{review.review_type}</CardDescription>
                                  </div>
                                  <div className="flex">{renderStars(review.rating)}</div>
                                </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-700">{review.remarks}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </CardContent>
                          </Card>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    {t('teacherDash.reviews.noReviews')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chats Tab */}
          <TabsContent value="chats">
            <Tabs defaultValue="advisor" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="advisor">
                  Advisor Chats
                  {chats.some(c => c.unread_count > 0) && (
                    <Badge variant="destructive" className="ml-2">
                      {chats.reduce((sum, c) => sum + c.unread_count, 0)}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="parents">
                  Parent Messages
                  {parentChats.some(c => c.unread_count > 0) && (
                    <Badge variant="destructive" className="ml-2">
                      {parentChats.reduce((sum, c) => sum + c.unread_count, 0)}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Advisor Group Chats */}
              <TabsContent value="advisor">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Chat List */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>{t('teacherDash.chats.title')}</CardTitle>
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
                        {t('common.with')} {chat.advisor_info.full_name}
                      </p>
                      {chat.unread_count > 0 && (
                        <Badge variant="destructive" className="mt-1">
                          {chat.unread_count} {t('common.new')}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {chats.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      {t('teacherDash.chats.noChats.desc')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Messages */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    {selectedChat ? selectedChat.name : t('select.chat')}
                  </CardTitle>
                  {selectedChat && (
                    <CardDescription>
                      Advisor: {selectedChat.advisor_info.full_name}
                    </CardDescription>
                  )}
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
                        {chatMessages.length === 0 && (
                          <p className="text-gray-500 text-center py-8">
                            No messages yet. Start the conversation!
                          </p>
                        )}
                      </div>

                      {/* Send Message */}
                      <div className="space-y-2">
                        {chatFile && (
                          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-sm flex-1">{chatFile.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setChatFile(null)}
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
                            id="chat-file-upload"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setChatFile(e.target.files[0]);
                              }
                            }}
                          />
                          <Button
                            onClick={() => document.getElementById('chat-file-upload')?.click()}
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

              {/* Parent-Teacher Chats */}
              <TabsContent value="parents">
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Parent Chat List */}
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>{t('teacherDash.parentChats.title')}</CardTitle>
                      <CardDescription>{t('teacherDash.parentChats.noChats.desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {parentChats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => handleSelectParentChat(chat)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedParentChat?.id === chat.id
                              ? 'bg-blue-100'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <p className="font-medium">{chat.parent_info.full_name}</p>
                          <p className="text-xs text-gray-600">
                            {t('teacherDash.parentChats.regarding')}: {chat.student_info.full_name}
                          </p>
                          {chat.subject && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {chat.subject}
                            </Badge>
                          )}
                          {chat.unread_count > 0 && (
                            <Badge variant="destructive" className="mt-1 ml-2">
                              {chat.unread_count} {t('common.new')}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {parentChats.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No parent messages yet
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Parent Chat Messages */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>
                        {selectedParentChat 
                          ? `Chat with ${selectedParentChat.parent_info.full_name}` 
                          : t('select.conversation')}
                      </CardTitle>
                      {selectedParentChat && (
                        <CardDescription>
                          Student: {selectedParentChat.student_info.full_name}
                          {selectedParentChat.subject && ` • Subject: ${selectedParentChat.subject}`}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {selectedParentChat ? (
                        <div className="space-y-4">
                          {/* Messages */}
                          <div className="h-96 overflow-y-auto space-y-2 p-4 bg-gray-50 rounded-lg">
                            {parentChatMessages.map((message) => (
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
                                      : 'bg-white border'
                                  }`}
                                >
                                  <p className="text-xs font-medium mb-1">
                                    {message.sender_info.full_name}
                                  </p>
                                  <p className="text-sm">{message.message}</p>
                                  {message.file_url && (
                                    <div className="mt-2">
                                      {message.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                        <a href={message.file_url} target="_blank" rel="noopener noreferrer">
                                          <img 
                                            src={message.file_url} 
                                            alt="Attachment" 
                                            className="max-w-xs rounded border"
                                            style={{ maxHeight: '200px' }}
                                          />
                                        </a>
                                      ) : (
                                        <a
                                          href={message.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs underline flex items-center gap-1"
                                        >
                                          <Paperclip className="h-3 w-3" />
                                          Attachment
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs opacity-70">
                                      {new Date(message.created_at).toLocaleTimeString()}
                                    </p>
                                    {message.is_read && message.sender === user?.id && (
                                      <CheckCheck className="h-3 w-3 opacity-70" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {parentChatMessages.length === 0 && (
                              <p className="text-gray-500 text-center py-8">
                                No messages yet. Start the conversation!
                              </p>
                            )}
                          </div>

                          {/* Send Message */}
                          <div className="flex gap-2">
                            <Input
                              value={parentNewMessage}
                              onChange={(e) => setParentNewMessage(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendParentMessage();
                                }
                              }}
                              placeholder="Type a message to the parent..."
                            />
                            <Button onClick={handleSendParentMessage} size="icon">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-96 text-gray-500">
                          {t('select.conversationToStart')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Student Attendance Tab */}
          <TabsContent value="student-attendance">
            <StudentAttendanceMarking />
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('timetable.mySchedule')}
                </CardTitle>
                <CardDescription>
                  {t('timetable.scheduleDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTimetable ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : !timetable || timetable.total_schedules === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('timetable.noScheduleTitle')}</h3>
                    <p className="text-gray-500">
                      {t('timetable.noScheduleDescription')}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {t('timetable.contactDirector')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { day: 0, name: t('timetable.days.monday') },
                        { day: 1, name: t('timetable.days.tuesday') },
                        { day: 2, name: t('timetable.days.wednesday') },
                        { day: 3, name: t('timetable.days.thursday') },
                        { day: 4, name: t('timetable.days.friday') },
                        { day: 5, name: t('timetable.days.saturday') },
                        { day: 6, name: t('timetable.days.sunday') },
                      ].map(({ day, name }) => {
                        const daySchedules = timetable.weekly_schedule[day] || [];
                        const attendanceInfo = weeklyAttendanceStatus?.weekly_schedule?.[day];
                        const attendance = attendanceInfo?.attendance;
                        const isToday = attendanceInfo?.is_today;
                        
                        // Determine card styling based on attendance status
                        let cardBorder = 'border-gray-200';
                        let cardBg = 'bg-white';
                        let statusBadge = null;
                        
                        if (daySchedules.length > 0 && attendance) {
                          if (attendance.status === 'present') {
                            cardBorder = 'border-green-300';
                            cardBg = 'bg-green-50/30';
                            statusBadge = (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {t('attendance.status.present')}
                              </Badge>
                            );
                          } else if (attendance.status === 'absent') {
                            cardBorder = 'border-red-300';
                            cardBg = 'bg-red-50/30';
                            statusBadge = (
                              <Badge className="bg-red-100 text-red-800 border-red-300">
                                <XCircle className="h-3 w-3 mr-1" />
                                {t('attendance.status.absent')}
                              </Badge>
                            );
                          } else if (attendance.status === 'late') {
                            cardBorder = 'border-yellow-300';
                            cardBg = 'bg-yellow-50/30';
                            statusBadge = (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                <Clock className="h-3 w-3 mr-1" />
                                {t('attendance.status.late')}
                              </Badge>
                            );
                          } else if (attendance.status === 'planned_absence') {
                            cardBorder = 'border-blue-300';
                            cardBg = 'bg-blue-50/30';
                            statusBadge = (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {t('attendance.status.excused')}
                              </Badge>
                            );
                          }
                        } else if (daySchedules.length > 0) {
                          cardBorder = 'border-blue-200';
                          cardBg = 'bg-blue-50/30';
                        }
                        
                        return (
                          <Card key={day} className={`${cardBorder} ${cardBg} transition-all duration-300`}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
                                <span className="flex items-center gap-2">
                                  {name}
                                  {isToday && (
                                    <Badge variant="outline" className="text-xs">
                                      {t('common.today')}
                                    </Badge>
                                  )}
                                </span>
                                <div className="flex gap-2 flex-wrap">
                                  {daySchedules.length > 0 && !statusBadge && (
                                    <Badge variant="default">
                                      {t('timetable.scheduled')}
                                    </Badge>
                                  )}
                                  {statusBadge}
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {daySchedules.length === 0 ? (
                                <p className="text-sm text-gray-500">{t('timetable.noScheduleForDay')}</p>
                              ) : (
                                <div className="space-y-2">
                                  {daySchedules.map((schedule: any) => (
                                    <div key={schedule.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                      <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-900">
                                          {schedule.start_time} - {schedule.end_time}
                                        </div>
                                        {attendance && attendance.check_in_time && (
                                          <div className="text-xs text-gray-600 mt-1">
                                            {t('timetable.checkedIn')}: {attendance.check_in_time}
                                          </div>
                                        )}
                                      </div>
                                      <Badge variant={schedule.is_active ? "default" : "secondary"}>
                                        {schedule.is_active ? t('timetable.active') : t('timetable.inactive')}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-1">{t('timetable.attendanceTracking')}</h4>
                          <p className="text-sm text-blue-800">
                            {t('timetable.attendanceTrackingDescription')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Lesson View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedLesson?.title}</DialogTitle>
              <DialogDescription>
                {t('common.created')} {selectedLesson ? new Date(selectedLesson.created_at).toLocaleDateString() : ''} • {t('common.by')} {selectedLesson?.created_by_name || t('teacherDash.lessonView.generatedBy')}
              </DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 prose-pre:bg-gray-100">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {selectedLesson?.content || ''}
              </ReactMarkdown>
            </div>
          </DialogContent>
        </Dialog>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
