import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import advisorAPI from '@/lib/advisorAPI';
import { AdvisorDashboardStats } from '@/types/api';
import { Users, ClipboardList, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  variant = 'default'
}) => {
  const bgColors = {
    default: 'bg-blue-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50',
  };

  const iconColors = {
    default: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${bgColors[variant]}`}>
          <div className={iconColors[variant]}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp
              className={`h-4 w-4 mr-1 ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {trend === 'up' ? 'Improving' : trend === 'down' ? 'Needs attention' : 'Stable'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdvisorStats: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdvisorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await advisorAPI.getAdvisorDashboardStats();
      setStats(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching advisor stats:', err);
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error || 'Unable to load statistics'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned Teachers"
          value={stats.total_assigned_teachers}
          icon={<Users className="h-4 w-4" />}
          description={`Active: ${stats.active_assignments}`}
          variant="default"
        />

        <StatCard
          title="Upcoming Inspections"
          value={stats.upcoming_inspections}
          icon={<Calendar className="h-4 w-4" />}
          description="Scheduled meetings"
          variant={stats.upcoming_inspections > 0 ? 'warning' : 'success'}
        />

        <StatCard
          title="Pending Reports"
          value={stats.pending_reports}
          icon={<ClipboardList className="h-4 w-4" />}
          description="Awaiting completion"
          variant={stats.pending_reports > 3 ? 'danger' : 'default'}
        />

        <StatCard
          title="Avg Performance"
          value={stats.average_teacher_performance.toFixed(1)}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Teacher rating"
          variant={
            stats.average_teacher_performance >= 4
              ? 'success'
              : stats.average_teacher_performance >= 3
              ? 'default'
              : 'warning'
          }
        />
      </div>

      {/* Additional Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Subjects Covered */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Subjects Covered</CardTitle>
            <CardDescription>Your areas of advisory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.subjects_covered.length > 0 ? (
                stats.subjects_covered.map((subject) => (
                  <Badge key={subject} variant="outline">
                    {t(`subject.${subject}`)}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No subjects assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CardDescription>Completed activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Inspections</span>
                <span className="text-lg font-semibold">{stats.completed_inspections_this_month}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Teachers</span>
                <span className="text-lg font-semibold">{stats.active_assignments}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {stats.recent_activity && stats.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your assigned teachers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_activity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="mt-1">
                    {activity.type === 'inspection' ? (
                      <Calendar className="h-4 w-4 text-blue-600" />
                    ) : activity.type === 'report' ? (
                      <ClipboardList className="h-4 w-4 text-green-600" />
                    ) : (
                      <Users className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvisorStats;
