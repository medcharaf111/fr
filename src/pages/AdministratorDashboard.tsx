import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import DarkModeToggle from '@/components/DarkModeToggle';
import DashboardLayout from '@/components/DashboardLayout';
import { LanguageToggle } from '@/components/LanguageToggle';
import SchoolMapView from '@/components/SchoolMapView';
import StatsCard from '@/components/StatsCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { administratorAPI, authAPI } from '@/lib/api';
import {
  AdminAdvisorPerformance,
  AdminAdvisorTeacherAssignment,
  AdminAdvisorTeacherNote,
  AdminDashboardStats,
  AdminReview,
  AdminSchoolStats,
  AdminTeacherPerformance,
  AdminUserDetail,
} from '@/types/api';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  Edit,
  GraduationCap,
  Plus,
  School,
  Search,
  Star,
  Trash2,
  UserPlus,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdministratorDashboard = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [schools, setSchools] = useState<AdminSchoolStats[]>([]);
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [teacherPerformance, setTeacherPerformance] = useState<AdminTeacherPerformance[]>([]);
  const [advisorPerformance, setAdvisorPerformance] = useState<AdminAdvisorPerformance[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [advisorTeacherAssignments, setAdvisorTeacherAssignments] = useState<AdminAdvisorTeacherAssignment[]>([]);
  const [advisorNotes, setAdvisorNotes] = useState<AdminAdvisorTeacherNote[]>([]);

  // Filters
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [createSchoolDialogOpen, setCreateSchoolDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);

  // Form states
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student' as 'teacher' | 'student' | 'advisor' | 'parent' | 'admin',
    school: 0,
    phone: '',
    date_of_birth: '',
    subjects: [] as string[],
  });

  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
  });

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    fetchDashboardStats();
    fetchSchools();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeacherPerformance();
    } else if (activeTab === 'advisors') {
      fetchAdvisorPerformance();
      fetchAdvisorTeacherAssignments();
    } else if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      const response = await administratorAPI.getDashboardStats();
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      showAlert('Failed to fetch dashboard statistics', 'error');
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await administratorAPI.getAllSchools();
      setSchools(response.data);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      showAlert('Failed to fetch schools', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const params: any = {};
      if (selectedRole && selectedRole !== 'all') params.role = selectedRole;
      if (selectedSchool && selectedSchool !== 'all') params.school_id = selectedSchool;
      if (searchQuery) params.search = searchQuery;

      const response = await administratorAPI.getAllUsers(params);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showAlert('Failed to fetch users', 'error');
    }
  };

  const fetchTeacherPerformance = async () => {
    try {
      const params: any = {};
      if (selectedSchool && selectedSchool !== 'all') params.school_id = selectedSchool;

      const response = await administratorAPI.getTeacherPerformance(params);
      setTeacherPerformance(response.data);
    } catch (error) {
      console.error('Failed to fetch teacher performance:', error);
      showAlert('Failed to fetch teacher performance', 'error');
    }
  };

  const fetchAdvisorPerformance = async () => {
    try {
      const params: any = {};
      if (selectedSchool && selectedSchool !== 'all') params.school_id = selectedSchool;

      const response = await administratorAPI.getAdvisorPerformance(params);
      setAdvisorPerformance(response.data);
    } catch (error) {
      console.error('Failed to fetch advisor performance:', error);
      showAlert('Failed to fetch advisor performance', 'error');
    }
  };

  const fetchReviews = async () => {
    try {
      const params: any = {};
      if (selectedSchool && selectedSchool !== 'all') params.school_id = selectedSchool;

      const response = await administratorAPI.getAllReviews(params);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      showAlert('Failed to fetch reviews', 'error');
    }
  };

  const fetchAdvisorTeacherAssignments = async () => {
    try {
      const params: any = {};
      if (selectedSchool && selectedSchool !== 'all') params.school_id = selectedSchool;

      const response = await administratorAPI.getAdvisorTeacherAssignments(params);
      setAdvisorTeacherAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      showAlert('Failed to fetch advisor-teacher assignments', 'error');
    }
  };

  const fetchAdvisorNotes = async (advisorId?: number, teacherId?: number) => {
    try {
      const params: any = {};
      if (advisorId) params.advisor_id = advisorId;
      if (teacherId) params.teacher_id = teacherId;

      const response = await administratorAPI.getAdvisorTeachersNotes(params);
      setAdvisorNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch advisor notes:', error);
      showAlert('Failed to fetch advisor notes', 'error');
    }
  };

  const handleCreateUser = async () => {
    try {
      await administratorAPI.createUser(newUser);
      showAlert(t('admin.alert.userCreated'), 'success');
      setCreateUserDialogOpen(false);
      fetchUsers();
      // Reset form
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'student',
        school: 0,
        phone: '',
        date_of_birth: '',
        subjects: [],
      });
    } catch (error: any) {
      console.error('Failed to create user:', error);
      showAlert(error.response?.data?.username?.[0] || t('admin.alert.error'), 'error');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await administratorAPI.updateUser(selectedUser.id, selectedUser);
      showAlert(t('admin.alert.userUpdated'), 'success');
      setEditUserDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      showAlert(t('admin.alert.error'), 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await administratorAPI.deleteUser(userId);
      showAlert(t('admin.alert.userDeleted'), 'success');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      showAlert(t('admin.alert.error'), 'error');
    }
  };

  const handleCreateSchool = async () => {
    try {
      await administratorAPI.createSchool(newSchool);
      showAlert(t('admin.alert.schoolCreated'), 'success');
      setCreateSchoolDialogOpen(false);
      fetchSchools();
      setNewSchool({ name: '', address: '' });
    } catch (error) {
      console.error('Failed to create school:', error);
      showAlert(t('admin.alert.error'), 'error');
    }
  };

  const handleDeleteSchool = async (schoolId: number) => {
    if (!confirm('Are you sure you want to delete this school? This will delete all associated users and data.')) return;

    try {
      await administratorAPI.deleteSchool(schoolId);
      showAlert(t('admin.alert.schoolDeleted'), 'success');
      fetchSchools();
    } catch (error) {
      console.error('Failed to delete school:', error);
      showAlert(t('admin.alert.error'), 'error');
    }
  };

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'advisor': return 'bg-purple-500';
      case 'teacher': return 'bg-blue-500';
      case 'student': return 'bg-green-500';
      case 'parent': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, selectedSchool, searchQuery]);

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout 
      userRole="admin" 
      userName={user?.first_name || user?.username || 'Administrator'}
    >
      <div dir={dir} className="space-y-6">
        {/* Language & Theme Toggle Buttons */}
        <div className="flex justify-end gap-2 mb-4 p-3 px-4 bg-card rounded-lg border border-border/50">
          <DarkModeToggle />
          <LanguageToggle
            variant="outline"
            size="default"
          />
        </div>

        {/* Stats Overview */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title={t('admin.stats.totalSchools')}
              value={dashboardStats.total_schools}
              icon={Building2}
              description={t('admin.stats.totalSchools.desc')}
              color="red"
            />
            <StatsCard
              title={t('admin.stats.totalUsers')}
              value={dashboardStats.total_users}
              icon={Users}
              description={t('admin.stats.totalUsers.desc')}
              color="blue"
            />
            <StatsCard
              title={t('admin.stats.teachers')}
              value={dashboardStats.total_teachers}
              icon={GraduationCap}
              description={t('admin.stats.teachers.desc')}
              color="green"
            />
            <StatsCard
              title={t('admin.stats.students')}
              value={dashboardStats.total_students}
              icon={School}
              description={t('admin.stats.students.desc')}
              color="purple"
            />
          </div>
        )}

        {/* Minister Dashboard Access Button - Only for Minister Role */}
        {user?.role === 'minister' && (
          <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{t('admin.ministerCard.title')}</h3>
                    <p className="text-sm text-gray-600">{t('admin.ministerCard.desc')}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/minister')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {t('admin.ministerCard.button')}
                  <ArrowRight className={`${dir === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'} h-5 w-5`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {alert && (
        <Alert className={`mb-4 ${alert.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertDescription className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-10 w-full">
            <TabsTrigger value="overview">{t('admin.tab.overview')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('admin.tab.analytics')}</TabsTrigger>
            <TabsTrigger value="schools">{t('admin.tab.schools')}</TabsTrigger>
            <TabsTrigger value="users">{t('admin.tab.users')}</TabsTrigger>
            <TabsTrigger value="teachers">{t('admin.tab.teachers')}</TabsTrigger>
            <TabsTrigger value="advisors">{t('admin.tab.advisors')}</TabsTrigger>
            <TabsTrigger value="reviews">{t('admin.tab.reviews')}</TabsTrigger>
            <TabsTrigger value="assignments">{t('admin.tab.assignments')}</TabsTrigger>
            <TabsTrigger value="map">{t('admin.tab.map')}</TabsTrigger>
            <TabsTrigger value="forum" onClick={() => navigate('/forum')}>
              <Users className="h-4 w-4 mr-2" />
              Forum
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {dashboardStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{t('admin.overview.totalSchools')}</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.total_schools}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{t('admin.overview.totalUsers')}</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.total_users}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dashboardStats.total_teachers} {t('admin.overview.totalUsers.details').split(', ')[0]}, {dashboardStats.total_students} {t('admin.overview.totalUsers.details').split(', ')[1]}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{t('admin.overview.totalContent')}</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.total_lessons + dashboardStats.total_mcq_tests + dashboardStats.total_qa_tests}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dashboardStats.total_lessons} {t('admin.overview.totalContent.details').split(', ')[0]}, {dashboardStats.total_mcq_tests + dashboardStats.total_qa_tests} {t('admin.overview.totalContent.details').split(', ')[1]}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{t('admin.overview.avgRating')}</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.avg_teacher_rating?.toFixed(1) || 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t('admin.overview.avgRating.outOf')}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('admin.overview.advisors')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{dashboardStats.total_advisors}</div>
                      <p className="text-sm text-gray-600 mt-2">
                        {dashboardStats.total_advisor_reviews} {t('admin.overview.advisors.reviews')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('admin.overview.parents')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{dashboardStats.total_parents}</div>
                      <p className="text-sm text-gray-600 mt-2">{t('admin.overview.parents.tracking')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('admin.overview.relationships')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{dashboardStats.active_relationships}</div>
                      <p className="text-sm text-gray-600 mt-2">{t('admin.overview.relationships.connections')}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('admin.schools.title')}</CardTitle>
                    <CardDescription>{t('admin.schools.manage')}</CardDescription>
                  </div>
                  <Dialog open={createSchoolDialogOpen} onOpenChange={setCreateSchoolDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                        {t('admin.schools.addNew')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('admin.createSchool.title')}</DialogTitle>
                        <DialogDescription>{t('admin.users.addNewDescription')}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="school-name">{t('admin.createSchool.name')}</Label>
                          <Input
                            id="school-name"
                            value={newSchool.name}
                            onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                            placeholder={t('admin.createSchool.name')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="school-address">{t('admin.createSchool.address')}</Label>
                          <Input
                            id="school-address"
                            value={newSchool.address}
                            onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                            placeholder={t('admin.createSchool.address')}
                          />
                        </div>
                        <Button onClick={handleCreateSchool} className="w-full">{t('admin.createSchool.create')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.schools.table.name')}</TableHead>
                      <TableHead>{t('admin.schools.table.address')}</TableHead>
                      <TableHead>{t('admin.schools.table.users')}</TableHead>
                      <TableHead>{t('admin.schools.table.teachers')}</TableHead>
                      <TableHead>{t('admin.schools.table.students')}</TableHead>
                      <TableHead>Avg Rating</TableHead>
                      <TableHead>{t('admin.schools.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.address || 'N/A'}</TableCell>
                        <TableCell>{school.total_users}</TableCell>
                        <TableCell>{school.total_teachers}</TableCell>
                        <TableCell>{school.total_students}</TableCell>
                        <TableCell>
                          {school.avg_teacher_rating ? (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              {school.avg_teacher_rating.toFixed(1)}
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSchool(school.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{t('admin.users.title')}</CardTitle>
                    <CardDescription>{t('admin.users.fullCRUD')}</CardDescription>
                  </div>
                  <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                        {t('admin.users.addNew')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t('admin.createUser.title')}</DialogTitle>
                        <DialogDescription>{t('admin.users.addNewDescription')}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">{t('admin.createUser.username')}</Label>
                            <Input
                              id="username"
                              value={newUser.username}
                              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">{t('admin.createUser.email')}</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newUser.email}
                              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">{t('admin.createUser.password')}</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first_name">{t('admin.createUser.firstName')}</Label>
                            <Input
                              id="first_name"
                              value={newUser.first_name}
                              onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last_name">{t('admin.createUser.lastName')}</Label>
                            <Input
                              id="last_name"
                              value={newUser.last_name}
                              onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="role">{t('admin.createUser.role')}</Label>
                            <Select
                              value={newUser.role}
                              onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="advisor">Advisor</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="director">School Director</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="school">{t('admin.createUser.school')}</Label>
                            <Select
                              value={newUser.school.toString()}
                              onValueChange={(value) => setNewUser({ ...newUser, school: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin.createUser.selectSchool')} />
                              </SelectTrigger>
                              <SelectContent>
                                {schools.map((school) => (
                                  <SelectItem key={school.id} value={school.id.toString()}>
                                    {school.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">{t('admin.createUser.phone')}</Label>
                            <Input
                              id="phone"
                              value={newUser.phone}
                              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="date_of_birth">{t('admin.createUser.dateOfBirth')}</Label>
                            <Input
                              id="date_of_birth"
                              type="date"
                              value={newUser.date_of_birth}
                              onChange={(e) => setNewUser({ ...newUser, date_of_birth: e.target.value })}
                            />
                          </div>
                        </div>

                        <Button onClick={handleCreateUser} className="w-full">{t('admin.createUser.create')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className={`absolute ${dir === 'rtl' ? 'right-2' : 'left-2'} top-2.5 h-4 w-4 text-muted-foreground`} />
                      <Input
                        placeholder={t('admin.users.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={dir === 'rtl' ? 'pr-8' : 'pl-8'}
                      />
                    </div>
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('admin.users.filterRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.users.allRoles')}</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="advisor">Advisors</SelectItem>
                      <SelectItem value="parent">Parents</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={t('admin.users.filterSchool')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.users.allSchools')}</SelectItem>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.users.table.user')}</TableHead>
                        <TableHead>{t('admin.users.table.role')}</TableHead>
                        <TableHead>{t('admin.users.table.school')}</TableHead>
                        <TableHead>{t('admin.users.table.email')}</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>{t('admin.users.table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.school_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.role === 'teacher' && (
                                <>
                                  <div>{user.total_students} {t('admin.stats.userStats.students')}</div>
                                  <div>{user.total_lessons_created} {t('admin.stats.userStats.lessons')}</div>
                                  {user.average_rating_from_students && (
                                    <div className="flex items-center">
                                      <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                      {user.average_rating_from_students.toFixed(1)}
                                    </div>
                                  )}
                                </>
                              )}
                              {user.role === 'student' && (
                                <>
                                  <div>{user.total_teachers} {t('admin.stats.userStats.teachers')}</div>
                                  <div>{user.total_lessons_completed} {t('admin.stats.userStats.completed')}</div>
                                </>
                              )}
                              {user.role === 'advisor' && (
                                <>
                                  <div>{user.total_teachers_supervised} {t('admin.stats.userStats.supervised')}</div>
                                  <div>{user.total_reviews_given} {t('admin.stats.userStats.reviews')}</div>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditUserDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teacher Performance Tab */}
          <TabsContent value="teachers">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.teachers.performanceMetrics')}</CardTitle>
                <CardDescription>{t('admin.teachers.effectiveness')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.teachers.table.teacher')}</TableHead>
                      <TableHead>{t('admin.teachers.table.subjects')}</TableHead>
                      <TableHead>{t('admin.teachers.table.students')}</TableHead>
                      <TableHead>{t('admin.teachers.table.content')}</TableHead>
                      <TableHead>{t('admin.teachers.table.rating')}</TableHead>
                      <TableHead>{t('admin.teachers.table.advisor')}</TableHead>
                      <TableHead>{t('admin.teachers.table.progress')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherPerformance.map((teacher) => (
                      <TableRow key={teacher.teacher_id}>
                        <TableCell className="font-medium">{teacher.teacher_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacher.subjects.map((subject, idx) => (
                              <Badge key={idx} variant="outline">{subject}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{teacher.total_students}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{teacher.total_lessons_created} {t('admin.teachers.lessons')}</div>
                            <div>{teacher.total_tests_created} {t('admin.teachers.tests')}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            {teacher.avg_rating.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>{teacher.advisor_name}</TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${teacher.progress_percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{teacher.progress_percentage.toFixed(0)}%</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advisor Performance Tab */}
          <TabsContent value="advisors">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.advisors.performanceMetrics')}</CardTitle>
                <CardDescription>{t('admin.advisors.effectiveness')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.advisors.table.advisor')}</TableHead>
                      <TableHead>{t('admin.advisors.table.subject')}</TableHead>
                      <TableHead>{t('admin.advisors.table.teachers')}</TableHead>
                      <TableHead>{t('admin.advisors.table.reviews')}</TableHead>
                      <TableHead>{t('admin.advisors.table.notifications')}</TableHead>
                      <TableHead>{t('admin.advisors.table.responseTime')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advisorPerformance.map((advisor) => (
                      <TableRow key={advisor.advisor_id}>
                        <TableCell className="font-medium">{advisor.advisor_name}</TableCell>
                        <TableCell>
                          <Badge>{advisor.advisor_subject}</Badge>
                        </TableCell>
                        <TableCell>{advisor.total_teachers_supervised}</TableCell>
                        <TableCell>{advisor.total_reviews_given}</TableCell>
                        <TableCell>{advisor.total_notifications_reviewed}</TableCell>
                        <TableCell>{advisor.average_response_time_hours.toFixed(1)}h</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.reviews.title')}</CardTitle>
                <CardDescription>{t('admin.reviews.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getRoleBadgeColor(review.reviewer_role)}>
                              {review.reviewer_role}
                            </Badge>
                            <span className="font-medium">{review.reviewer}</span>
                            {review.reviewed && (
                              <>
                                <span className="text-gray-500">→</span>
                                <Badge className={getRoleBadgeColor(review.reviewed_role!)}>
                                  {review.reviewed_role}
                                </Badge>
                                <span>{review.reviewed}</span>
                              </>
                            )}
                          </div>
                          {review.content_title && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">{review.content_type}:</span> {review.content_title}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="font-medium">{review.rating}/5</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-gray-500">{review.school}</span>
                          </div>
                          {(review.remarks || review.comments) && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              "{review.remarks || review.comments}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.assignments.title')}</CardTitle>
                <CardDescription>{t('admin.assignments.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {advisorTeacherAssignments.map((assignment) => (
                    <Card key={assignment.advisor_id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{assignment.advisor_name}</CardTitle>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge>{assignment.subject}</Badge>
                              <span className="text-sm text-muted-foreground">{assignment.school}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{assignment.total_teachers}</div>
                            <div className="text-sm text-gray-600">{t('admin.assignments.teachers')}</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {assignment.teachers.map((teacher) => (
                            <div key={teacher.id} className="border rounded p-3">
                              <div className="font-medium mb-1">{teacher.name}</div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {teacher.subjects.map((subject, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                              </div>
                              <div className="text-sm text-gray-600">
                                {teacher.total_students} {t('admin.assignments.students')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <SchoolMapView />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdministratorDashboard;
