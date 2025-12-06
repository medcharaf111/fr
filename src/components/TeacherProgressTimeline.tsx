import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TeacherProgress } from '@/types/api';
import { BookOpen, TrendingUp, CheckCircle2, Target } from 'lucide-react';

interface TeacherProgressTimelineProps {
  progressList: TeacherProgress[];
  teacherName?: string;
}

const TeacherProgressTimeline = ({ progressList, teacherName }: TeacherProgressTimelineProps) => {
  if (progressList.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No progress data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {teacherName && (
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-800">{teacherName}'s Progress</h3>
          <p className="text-gray-600">Curriculum progress across subjects and grades</p>
        </div>
      )}

      {progressList.map((progress) => (
        <Card key={progress.id} className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  {progress.subject_display}
                </CardTitle>
                <CardDescription className="mt-1">
                  {progress.grade_level_display}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-base px-3 py-1">
                Ch. {progress.chapter_number} / {progress.total_chapters}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Current Chapter */}
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-700">Current Chapter</span>
              </div>
              <p className="text-lg font-bold text-green-700 ml-7">
                {progress.current_chapter}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-semibold text-purple-600">
                  {progress.progress_percentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={progress.progress_percentage} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Chapter {progress.chapter_number}</span>
                <span>{progress.total_chapters - progress.chapter_number} chapters remaining</span>
              </div>
            </div>

            {/* Milestones */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="w-4 h-4 text-blue-600" />
                  <p className="text-lg font-bold text-blue-600">{progress.chapter_number}</p>
                </div>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              
              <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <p className="text-lg font-bold text-purple-600">
                    {progress.chapter_number + 1}
                  </p>
                </div>
                <p className="text-xs text-gray-600">Next Up</p>
              </div>
              
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                  <p className="text-lg font-bold text-gray-600">{progress.total_chapters}</p>
                </div>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>

            {/* Timeline Info */}
            <div className="pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
              <span>Started: {new Date(progress.started_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(progress.updated_at).toLocaleDateString()}</span>
            </div>

            {/* Progress Status */}
            {progress.progress_percentage >= 75 && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Excellent progress! Nearly complete 🎉
                </span>
              </div>
            )}
            {progress.progress_percentage >= 50 && progress.progress_percentage < 75 && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">
                  Great progress! More than halfway there 👏
                </span>
              </div>
            )}
            {progress.progress_percentage < 25 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                <Target className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700 font-medium">
                  Just getting started 🚀
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TeacherProgressTimeline;
