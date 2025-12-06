import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TeacherAnalytics } from '@/types/api';
import { 
  User, 
  BookOpen, 
  ClipboardCheck, 
  Users, 
  Star, 
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';

interface TeacherAnalyticsCardProps {
  analytics: TeacherAnalytics;
  onClick?: () => void;
}

const TeacherAnalyticsCard = ({ analytics, onClick }: TeacherAnalyticsCardProps) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingBgColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-50 border-green-200';
    if (rating >= 4.0) return 'bg-blue-50 border-blue-200';
    if (rating >= 3.5) return 'bg-yellow-50 border-yellow-200';
    if (rating >= 3.0) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getPerformanceEmoji = (rating: number) => {
    if (rating >= 4.5) return '🌟';
    if (rating >= 4.0) return '⭐';
    if (rating >= 3.5) return '👍';
    if (rating >= 3.0) return '👌';
    return '📈';
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${
        onClick ? 'hover:border-purple-300' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
              {analytics.teacher_info.first_name?.charAt(0) || analytics.teacher_info.username.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {analytics.teacher_info.first_name} {analytics.teacher_info.last_name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="w-3 h-3" />
                {analytics.teacher_info.username}
              </CardDescription>
            </div>
          </div>
          
          {/* Overall Rating Badge */}
          <div className={`px-4 py-2 rounded-xl border-2 ${getRatingBgColor(analytics.overall_rating)}`}>
            <div className="flex items-center gap-1 mb-1">
              <Star className={`w-5 h-5 fill-current ${getRatingColor(analytics.overall_rating)}`} />
              <span className={`text-2xl font-bold ${getRatingColor(analytics.overall_rating)}`}>
                {analytics.overall_rating.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-gray-600 text-center">Overall</p>
          </div>
        </div>

        {/* Subjects Badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          {analytics.subjects_taught.map((subject, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {subject}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Rating Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Students</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-blue-600 fill-current" />
                <span className="font-semibold text-blue-600">
                  {analytics.average_student_rating.toFixed(1)}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500">{analytics.total_student_ratings} ratings</p>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Advisors</span>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-purple-600 fill-current" />
                <span className="font-semibold text-purple-600">
                  {analytics.average_advisor_rating.toFixed(1)}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500">{analytics.total_advisor_ratings} reviews</p>
          </div>
        </div>

        {/* Content Statistics */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Lessons</span>
            </div>
            <span className="font-semibold text-green-600">{analytics.total_lessons_created}</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">MCQ Tests</span>
            </div>
            <span className="font-semibold text-blue-600">{analytics.total_mcq_tests_created}</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700">Q&A Tests</span>
            </div>
            <span className="font-semibold text-purple-600">{analytics.total_qa_tests_created}</span>
          </div>
        </div>

        {/* Student Performance */}
        <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                {analytics.total_students} Students
              </span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {getPerformanceEmoji(analytics.average_student_score / 20)}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Average Score</span>
              <span className="font-semibold">{analytics.average_student_score.toFixed(1)}%</span>
            </div>
            <Progress value={analytics.average_student_score} className="h-2" />
          </div>
        </div>

        {/* Last Activity */}
        {(analytics.last_lesson_created || analytics.last_test_created) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>
                Last activity: {
                  analytics.last_test_created 
                    ? new Date(analytics.last_test_created).toLocaleDateString()
                    : analytics.last_lesson_created
                    ? new Date(analytics.last_lesson_created).toLocaleDateString()
                    : 'N/A'
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherAnalyticsCard;
