import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { authAPI } from '@/lib/api';
import { School, User, Lesson, Progress } from '@/types/api';
import DashboardHeader from '@/components/DashboardHeader';

const AdminDashboard = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const user = authAPI.getCurrentUser();

  useEffect(() => {
    fetchSchools();
    fetchUsers();
    fetchLessons();
    fetchProgress();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await api.get('/schools/');
      setSchools(response.data);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await api.get('/lessons/');
      setLessons(response.data);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
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

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  const getRoleStats = () => {
    const stats = {
      teachers: users.filter(u => u.role === 'teacher').length,
      students: users.filter(u => u.role === 'student').length,
      parents: users.filter(u => u.role === 'parent').length,
      admins: users.filter(u => u.role === 'admin').length,
    };
    return stats;
  };

  const stats = getRoleStats();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unified Header */}
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{schools.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lessons.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {progress.filter(p => p.completed_at).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>User Distribution by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.teachers}</div>
                    <div className="text-sm text-gray-600">Teachers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.students}</div>
                    <div className="text-sm text-gray-600">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats.parents}</div>
                    <div className="text-sm text-gray-600">Parents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{stats.admins}</div>
                    <div className="text-sm text-gray-600">Admins</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schools">
            <Card>
              <CardHeader>
                <CardTitle>School Management</CardTitle>
                <CardDescription>
                  Manage educational institutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schools.map((school) => (
                    <Card key={school.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{school.name}</h4>
                            <p className="text-sm text-gray-600">{school.address}</p>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(school.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage system users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.slice(0, 10).map((u) => (
                    <Card key={u.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{u.first_name} {u.last_name}</h4>
                            <p className="text-sm text-gray-600">{u.username} ({u.email})</p>
                            <p className="text-sm text-gray-600">Role: {u.role} | School: {u.school_name}</p>
                            <p className="text-xs text-gray-500">
                              Status: {u.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>
                  Detailed system statistics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Lesson Distribution by School</h3>
                    <div className="space-y-2">
                      {schools.map((school) => {
                        const schoolLessons = lessons.filter(l => l.school === school.id).length;
                        return (
                          <div key={school.id} className="flex justify-between">
                            <span>{school.name}</span>
                            <span className="font-semibold">{schoolLessons} lessons</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Progress Completion Rate</h3>
                    <div className="text-4xl font-bold text-center">
                      {progress.length > 0
                        ? Math.round((progress.filter(p => p.completed_at).length / progress.length) * 100)
                        : 0}%
                    </div>
                    <p className="text-center text-gray-600 mt-2">
                      {progress.filter(p => p.completed_at).length} of {progress.length} completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
