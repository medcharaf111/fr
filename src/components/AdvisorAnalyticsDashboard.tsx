import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { advisorReviewAPI } from '@/lib/api';
import { AdvisorAnalytics } from '@/types/api';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  AlertTriangle,
  Star,
  Clock,
  BarChart3,
  FileCheck,
  Bell,
} from 'lucide-react';

// Recharts for interactive charts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Area,
} from 'recharts';

const AdvisorAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdvisorAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await advisorReviewAPI.getAdvisorAnalytics();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch advisor analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchAnalytics} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Advisor Info Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Advisor Analytics Dashboard</CardTitle>
          <CardDescription>
            {data.advisor_info.name} • {data.advisor_info.subject} • {data.advisor_info.school}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teachers Supervised
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.overview.total_teachers_supervised}</div>
                <p className="text-xs text-muted-foreground">Active teachers in your subject</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Reviews Given
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.overview.total_reviews_given}</div>
                <p className="text-xs text-muted-foreground">
                  {data.overview.approval_rate}% approval rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(data.overview.avg_response_time_hours)}h
                </div>
                <p className="text-xs text-muted-foreground">Time to review content</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Average Rating Given
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-yellow-600">
                  {data.overview.avg_rating_given.toFixed(1)} / 5
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Across all {data.review_breakdown.total} reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending:</span>
                    <Badge variant="destructive">{data.overview.pending_notifications}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Handled:</span>
                    <Badge>{data.notifications.total}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Confirmation Rate:</span>
                    <Badge variant="outline">{data.notifications.confirmation_rate}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Review Breakdown by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="font-medium">Lesson Reviews</span>
                  <Badge>{data.review_breakdown.lesson_reviews}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="font-medium">MCQ Test Reviews</span>
                  <Badge>{data.review_breakdown.mcq_test_reviews}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="font-medium">QA Test Reviews</span>
                  <Badge>{data.review_breakdown.qa_test_reviews}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Top Performing Teachers
                </CardTitle>
                <CardDescription>Highest student scores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.teacher_performance.top_performers.map((teacher, idx) => (
                  <div key={teacher.teacher_id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{idx + 1}</span>
                          <p className="font-semibold">{teacher.teacher_name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{teacher.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {teacher.subjects.join(', ')}
                        </p>
                      </div>
                      <Badge className="bg-green-500">
                        {teacher.avg_student_score}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                      <div>
                        <span className="text-muted-foreground">Students:</span>
                        <p className="font-medium">{teacher.students}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Content:</span>
                        <p className="font-medium">
                          {teacher.lessons_created + teacher.tests_created}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Your Rating:</span>
                        <p className="font-medium">{teacher.avg_advisor_rating.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Needs Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  Teachers Needing Support
                </CardTitle>
                <CardDescription>Requires attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.teacher_performance.needs_support.length > 0 ? (
                  data.teacher_performance.needs_support.map((teacher) => (
                    <div key={teacher.teacher_id} className="p-3 border rounded-lg border-amber-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{teacher.teacher_name}</p>
                          <p className="text-xs text-muted-foreground">{teacher.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {teacher.subjects.join(', ')}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {teacher.avg_student_score}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                        <div>
                          <span className="text-muted-foreground">Students:</span>
                          <p className="font-medium">{teacher.students}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recent:</span>
                          <p className="font-medium">{teacher.recent_activity_30d}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Reviews:</span>
                          <p className="font-medium">{teacher.total_reviews}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All teachers are performing well! 🎉
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Teachers List */}
          <Card>
            <CardHeader>
              <CardTitle>All Teachers ({data.teacher_performance.all_teachers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.teacher_performance.all_teachers.map((teacher) => (
                  <div
                    key={teacher.teacher_id}
                    className="flex items-center justify-between p-3 hover:bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{teacher.teacher_name}</p>
                        {teacher.needs_attention && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {teacher.subjects.join(', ')} • {teacher.students} students
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={teacher.avg_student_score > 70 ? 'default' : 'destructive'}>
                        Avg: {teacher.avg_student_score}%
                      </Badge>
                      <Badge variant="outline">
                        Rating: {teacher.avg_advisor_rating.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Summary</CardTitle>
              <CardDescription>Your review activity and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded">
                  <p className="text-3xl font-bold">{data.review_breakdown.total}</p>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <p className="text-3xl font-bold text-green-600">
                    {data.overview.approval_rate}%
                  </p>
                  <p className="text-sm text-muted-foreground">Approval Rate</p>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <p className="text-3xl font-bold text-yellow-600">
                    {data.overview.avg_rating_given.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round(data.overview.avg_response_time_hours)}h
                  </p>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Review Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      { type: 'Lessons', count: data.review_breakdown.lesson_reviews },
                      { type: 'MCQ Tests', count: data.review_breakdown.mcq_test_reviews },
                      { type: 'QA Tests', count: data.review_breakdown.qa_test_reviews },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {/* Reviews & Rating Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Review Activity & Ratings (Last 12 Months)
              </CardTitle>
              <CardDescription>Your review volume and average ratings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <ComposedChart data={data.monthly_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="reviews_given" fill="#3b82f6" name="Reviews Given" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avg_rating_given"
                      stroke="#f59e0b"
                      name="Avg Rating"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Content Creation */}
          <Card>
            <CardHeader>
              <CardTitle>Supervised Teachers' Content Creation</CardTitle>
              <CardDescription>Lessons and tests created by your teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={data.monthly_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="lessons_created"
                      stroke="#10b981"
                      name="Lessons"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="tests_created"
                      stroke="#8b5cf6"
                      name="Tests"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Student Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Trend</CardTitle>
              <CardDescription>Average scores and submission volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <ComposedChart data={data.monthly_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_name" />
                    <YAxis yAxisId="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="submissions"
                      fill="#93c5fd"
                      stroke="#3b82f6"
                      name="Submissions"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avg_student_score"
                      stroke="#ef4444"
                      name="Avg Score (%)"
                      strokeWidth={3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvisorAnalyticsDashboard;
