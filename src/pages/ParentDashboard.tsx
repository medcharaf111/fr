import DarkModeToggle from '@/components/DarkModeToggle';
import DashboardLayout from '@/components/DashboardLayout';
import { LanguageToggle } from '@/components/LanguageToggle';
import ParentChildAttendance from '@/components/ParentChildAttendance';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { authAPI, parentAPI } from '@/lib/api';
import { ParentTeacherChat, ParentTeacherMessage, StudentPerformance, User } from '@/types/api';
import {
  Award,
  BookOpen,
  CheckCheck,
  Clock,
  MessageSquare,
  Paperclip,
  Send,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

const ParentDashboard = () => {
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [chats, setChats] = useState<ParentTeacherChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<ParentTeacherChat | null>(null);
  const [messages, setMessages] = useState<ParentTeacherMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [studentIdToAssign, setStudentIdToAssign] = useState('');
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [selectedStudentForChat, setSelectedStudentForChat] = useState<number | null>(null);
  const [selectedTeacherForChat, setSelectedTeacherForChat] = useState<number | null>(null);
  const [selectedStudentData, setSelectedStudentData] = useState<StudentPerformance | null>(null);
  const { t, language, setLanguage, dir } = useLanguage();
  
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    fetchStudents();
    fetchChats();
    fetchAvailableStudents();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      // Mark as read
      parentAPI.markChatRead(selectedChat.id);
    }
  }, [selectedChat]);
  
  const fetchAvailableStudents = async () => {
    try {
      console.log('Fetching available students...');
      const response = await authAPI.getStudentList();
      console.log('Available students response:', response.data);
      setAvailableStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch available students:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await parentAPI.getStudentPerformance();
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await parentAPI.getMyChats();
      setChats(response.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const response = await parentAPI.getChatMessages(chatId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleAssignStudent = async () => {
    try {
      await parentAPI.assignStudent({
        student_id: parseInt(studentIdToAssign),
        relationship_type: 'parent',
        is_primary: true
      });
      setAssignDialogOpen(false);
      setStudentIdToAssign('');
      fetchStudents();
    } catch (error) {
      console.error('Failed to assign student:', error);
    }
  };

  const handleStartChat = async () => {
    if (!selectedStudentForChat || !selectedTeacherForChat) return;
    
    try {
      const response = await parentAPI.startChat({
        teacher_id: selectedTeacherForChat,
        student_id: selectedStudentForChat,
      });
      setChatDialogOpen(false);
      setSelectedStudentForChat(null);
      setSelectedTeacherForChat(null);
      fetchChats();
      setSelectedChat(response.data);
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      await parentAPI.sendMessage(selectedChat.id, { message: newMessage });
      setNewMessage('');
      fetchMessages(selectedChat.id);
      fetchChats(); // Update chat list to show new message
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  if (!user) return null;

  const getTotalTests = () => {
    return students.reduce((sum, student) => sum + student.total_tests, 0);
  };

  const getAverageScore = () => {
    if (students.length === 0) return 0;
    const totalScore = students.reduce((sum, student) => sum + student.overall_average, 0);
    return Math.round(totalScore / students.length);
  };

  const getTotalMessages = () => {
    return chats.reduce((sum, chat) => sum + chat.unread_count, 0);
  };

  return (
    <DashboardLayout 
      userRole="parent" 
      userName={user?.first_name || user?.username || 'Parent'}
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
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('parent.myChildren')}</CardTitle>
              <Users className="h-6 w-6 text-purple-200" />
            </div>
            <CardDescription className="text-purple-100">
              {t('parent.studentsTracking')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{students.length}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('parent.totalTests')}</CardTitle>
              <Award className="h-6 w-6 text-green-200" />
            </div>
            <CardDescription className="text-green-100">
              {t('student.testsCompleted')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getTotalTests()}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('parent.averageScore')}</CardTitle>
              <Trophy className="h-6 w-6 text-orange-200" />
            </div>
            <CardDescription className="text-orange-100">
              {t('parent.overallPerformance')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getAverageScore()}%</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-teal-500 to-teal-700 text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-[400ms]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">{t('parent.newMessages')}</CardTitle>
              <MessageSquare className="h-6 w-6 text-teal-200" />
            </div>
            <CardDescription className="text-teal-100">
              {t('parent.unreadTeacherMessages')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getTotalMessages()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 sm:px-0" dir={dir}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('parent.parentDashboard')}</h1>
              <p className="text-gray-600 mt-1">{t('parent.monitorChildrenProgress')}</p>
            </div>
            
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('parent.assignStudent')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('parent.assignStudentToTrack')}</DialogTitle>
                  <DialogDescription>
                    {t('parent.selectStudentToTrack')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Select onValueChange={(value) => setStudentIdToAssign(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('parent.selectAStudent')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.length === 0 ? (
                        <SelectItem value="none" disabled>{t('parent.noStudentsAvailable')}</SelectItem>
                      ) : (
                        availableStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.first_name} {student.last_name} ({student.username}) - ID: {student.id}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignStudent} className="w-full" disabled={!studentIdToAssign}>
                    {t('parent.assignStudent')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="students" className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-2">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 bg-transparent h-auto">
                <TabsTrigger
                  value="students"
                  className="flex-col h-auto py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
                >
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{t('parent.students')} ({students.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="flex-col h-auto py-3 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-950 dark:data-[state=active]:text-emerald-300"
                >
                  <CheckCheck className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{t('parent.attendance')}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="chats"
                  className="flex-col h-auto py-3 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-teal-950 dark:data-[state=active]:text-teal-300 relative"
                >
                  <MessageSquare className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{t('parent.chats')} ({chats.length})</span>
                  {chats.some(c => c.unread_count > 0) && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1">
                      {chats.reduce((sum, c) => sum + c.unread_count, 0)}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="overview"
                  className="flex-col h-auto py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm dark:data-[state=active]:bg-purple-950 dark:data-[state=active]:text-purple-300"
                >
                  <TrendingUp className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{t('parent.overview')}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">{t('common.loading')}</p>
                  </CardContent>
                </Card>
              ) : students.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t('parent.noStudentsAssigned')}</h3>
                    <p className="text-gray-600 mb-4">{t('parent.startByAssigningStudents')}</p>
                    <Button onClick={() => setAssignDialogOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {t('parent.assignStudent')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                students.map((student) => (
                  <Card key={student.student.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-16 h-16">
                            <AvatarFallback className="bg-blue-500 text-white text-xl">
                              {student.student.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-2xl">{student.student.full_name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{student.relationship_type}</Badge>
                              <span className="text-sm">{student.student.email}</span>
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="text-2xl font-bold">{t('student.level')} {student.level}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <span>{student.xp_points} {t('student.xpPoints')}</span>
                            <span className="mx-2">•</span>
                            <Clock className="w-4 h-4 text-green-500" />
                            <span>{student.streak_days} {t('student.dayStreak')}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="py-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Performance Overview */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">{t('parent.overallPerformance')}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm text-gray-600">{t('parent.averageScore')}</span>
                                  <span className="text-sm font-semibold">{student.overall_average.toFixed(1)}%</span>
                                </div>
                                <Progress value={student.overall_average} className="h-2" />
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{t('parent.totalTests')}</span>
                                <span className="font-semibold">{student.total_tests}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Strengths - Only shown if data is available */}
                        {student.strengths && student.strengths.length > 0 && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium flex items-center">
                                <Target className="w-4 h-4 mr-2 text-green-500" />
                                {t('parent.strengths')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {student.strengths.slice(0, 3).map((strength, idx) => (
                                  <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700">
                                    {strength}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Weaknesses - Only shown if data is available */}
                        {student.weaknesses && student.weaknesses.length > 0 && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2 text-orange-500" />
                                {t('parent.areasToImprove')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {student.weaknesses.slice(0, 3).map((weakness, idx) => (
                                  <Badge key={idx} variant="secondary" className="bg-orange-50 text-orange-700">
                                    {weakness}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Recent Tests */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <BookOpen className="w-5 h-5 mr-2" />
                          {t('parent.recentTests')}
                        </h3>
                        <div className="space-y-2">
                          {student.recent_tests.slice(0, 3).map((test, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{test.test_title}</p>
                                <p className="text-sm text-gray-600">
                                  {test.lesson_name} • {test.test_type} • {new Date(test.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${test.score >= 80 ? 'text-green-600' : test.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {test.score}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Assigned Teachers */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center justify-between">
                          <span className="flex items-center">
                            <Users className="w-5 h-5 mr-2" />
                            {t('parent.teachers')} ({student.assigned_teachers.length})
                          </span>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedStudentData(student);
                              setSelectedStudentForChat(student.student.id);
                              setChatDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {t('parent.contactTeacher')}
                          </Button>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {student.assigned_teachers.map((teacher) => (
                            <div key={teacher.id} className="p-4 border rounded-lg hover:bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold">{teacher.name}</p>
                                  <p className="text-sm text-gray-600">{teacher.email}</p>
                                </div>
                                {teacher.rating && (
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                    <span className="text-sm font-semibold">{teacher.rating}/5</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {teacher.subjects.map((subject, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                              </div>
                              {teacher.comments && (
                                <p className="text-sm text-gray-700 italic">"{teacher.comments}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Contact Teacher Dialog - Outside the loop to avoid multiple instances */}
              <Dialog 
                open={chatDialogOpen} 
                onOpenChange={(open) => {
                  setChatDialogOpen(open);
                  if (!open) {
                    // Reset selections when dialog closes
                    setSelectedTeacherForChat(null);
                    setSelectedStudentData(null);
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('parent.startChatWithTeacher')}</DialogTitle>
                    <DialogDescription>
                      {selectedStudentData && `${t('parent.selectTeacherToStartConversation')} ${selectedStudentData.student.full_name}`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Select 
                      onValueChange={(value) => setSelectedTeacherForChat(parseInt(value))}
                      value={selectedTeacherForChat?.toString() || ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('parent.selectATeacher')} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedStudentData?.assigned_teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name} - {teacher.subjects.join(', ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleStartChat} className="w-full" disabled={!selectedTeacherForChat}>
                      {t('parent.startChat')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance">
              <ParentChildAttendance />
            </TabsContent>

            {/* Chats Tab */}
            <TabsContent value="chats">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>{t('parent.conversations')}</CardTitle>
                    <CardDescription>{t('parent.yourChatsWithTeachers')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-1 p-4">
                        {chats.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">{t('parent.noChatsYet')}</p>
                        ) : (
                          chats.map((chat) => (
                            <div
                              key={chat.id}
                              onClick={() => setSelectedChat(chat)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedChat?.id === chat.id
                                  ? 'bg-blue-50 border-2 border-blue-500'
                                  : 'hover:bg-gray-50 border-2 border-transparent'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-semibold">{chat.teacher_info.full_name}</p>
                                {chat.unread_count > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {chat.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                Re: {chat.student_info.full_name}
                              </p>
                              {chat.latest_message && (
                                <p className="text-sm text-gray-500 truncate">
                                  {chat.latest_message.message}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(chat.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Chat Messages */}
                <Card className="lg:col-span-2">
                  {selectedChat ? (
                    <>
                      <CardHeader className="border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{selectedChat.teacher_info.full_name}</CardTitle>
                            <CardDescription>
                              {t('parent.regarding')} {selectedChat.student_info.full_name}
                              {selectedChat.subject_display && ` • ${selectedChat.subject_display}`}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[450px] p-4">
                          <div className="space-y-4">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender === user.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg p-3 ${
                                    message.sender === user.id
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-semibold">
                                      {message.sender_info.full_name}
                                    </p>
                                    {message.is_edited && (
                                      <Badge variant="outline" className="text-xs">{t('parent.edited')}</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm">{message.message}</p>
                                  {message.file_url && (
                                    <a
                                      href={message.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs mt-2 underline"
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      {t('parent.attachment')}
                                    </a>
                                  )}
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs opacity-70">
                                      {new Date(message.created_at).toLocaleTimeString()}
                                    </p>
                                    {message.sender === user.id && message.is_read && (
                                      <CheckCheck className="w-4 h-4" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        
                        <div className="p-4 border-t">
                          <div className="flex gap-2">
                            <Input
                              placeholder={t('parent.typeMessage')}
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="py-12 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t('parent.noChatSelected')}</h3>
                      <p className="text-gray-600">{t('parent.selectConversationToStartMessaging')}</p>
                    </CardContent>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">{t('parent.totalStudents')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{students.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">{t('parent.averagePerformance')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {students.length > 0
                        ? (students.reduce((sum, s) => sum + s.overall_average, 0) / students.length).toFixed(1)
                        : 0}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">{t('parent.activeChats')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{chats.length}</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{t('parent.quickSummary')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {students.map((student) => (
                      <div key={student.student.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{student.student.full_name}</p>
                            <p className="text-sm text-gray-600">
                              {t('student.level')} {student.level} • {student.total_tests} {t('parent.testsCompleted')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{student.overall_average.toFixed(1)}%</div>
                            <Progress value={student.overall_average} className="w-24 mt-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
