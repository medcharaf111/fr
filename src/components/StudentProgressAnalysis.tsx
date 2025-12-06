import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Lightbulb,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle
} from 'lucide-react';
import React from 'react';

interface ProgressAnalysis {
  has_data: boolean;
  message?: string;
  total_analyses?: number;
  date_range?: {
    first: string;
    last: string;
  };
  improvement_trends?: {
    spelling_grammar: {
      improving: boolean;
      history: Array<{
        date: string;
        severity: string;
        count: number;
        subject: string;
      }>;
    };
    comprehension: {
      improving: boolean;
      history: Array<{
        date: string;
        severity: string;
        problems_count: number;
        subject: string;
      }>;
    };
    critical_thinking: {
      improving: boolean;
      history: Array<{
        date: string;
        level: string;
        subject: string;
      }>;
    };
  };
  persistent_issues?: {
    spelling_errors: Array<{ error: string; occurrences: number }>;
    comprehension_problems: Array<{ problem: string; occurrences: number }>;
  };
  strengths_identified?: Array<{
    strength: string;
    date: string;
    subject: string;
  }>;
  recommendations_history?: Array<{
    recommendation: string;
    date: string;
    subject: string;
  }>;
  by_subject?: {
    [subject: string]: {
      test_count: number;
      recent_analysis: any;
    };
  };
}

interface StudentProgressAnalysisProps {
  analysis: ProgressAnalysis;
  studentName: string;
  showTeacherRecommendations?: boolean; // Only show to teachers, not students
}

const StudentProgressAnalysis: React.FC<StudentProgressAnalysisProps> = ({ 
  analysis, 
  studentName,
  showTeacherRecommendations = false 
}) => {
  if (!analysis.has_data) {
    return (
      <Card className="border-2 border-dashed border-border bg-gradient-to-br from-muted via-muted/80 to-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
            Progress Analysis
          </CardTitle>
          <CardDescription>{analysis.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Complete more Q&A tests to see progress trends and improvement patterns
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (improving: boolean | undefined) => {
    if (improving === undefined) return <Minus className="h-5 w-5 text-muted-foreground" />;
    return improving ? (
      <TrendingUp className="h-5 w-5 text-green-600" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-600" />
    );
  };

  const getTrendColor = (improving: boolean | undefined) => {
    if (improving === undefined) return 'bg-muted text-muted-foreground border-muted-foreground/20';
    return improving
      ? 'bg-green-500/10 text-green-600 border-green-500/30'
      : 'bg-red-500/10 text-red-600 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-border bg-gradient-to-br from-muted via-muted/80 to-muted shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-foreground" />
                Progress Analysis for {studentName}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Historical trends and improvement patterns based on {analysis.total_analyses} Q&A test{analysis.total_analyses !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            {analysis.date_range && (
              <div className="text-right bg-background/90 px-4 py-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Period</span>
                </div>
                <div className="text-xs text-foreground">
                  {new Date(analysis.date_range.first).toLocaleDateString()} - {new Date(analysis.date_range.last).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Improvement Trends */}
      {analysis.improvement_trends && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Spelling & Grammar Trend */}
          <Card className={`border-2 ${getTrendColor(analysis.improvement_trends.spelling_grammar.improving)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Spelling & Grammar</CardTitle>
                {getTrendIcon(analysis.improvement_trends.spelling_grammar.improving)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getTrendColor(analysis.improvement_trends.spelling_grammar.improving)}>
                    {analysis.improvement_trends.spelling_grammar.improving ? 'Improving' : 'Needs Focus'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {analysis.improvement_trends.spelling_grammar.history.length} test{analysis.improvement_trends.spelling_grammar.history.length !== 1 ? 's' : ''} tracked
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comprehension Trend */}
          <Card className={`border-2 ${getTrendColor(analysis.improvement_trends.comprehension.improving)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Comprehension</CardTitle>
                {getTrendIcon(analysis.improvement_trends.comprehension.improving)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getTrendColor(analysis.improvement_trends.comprehension.improving)}>
                    {analysis.improvement_trends.comprehension.improving ? 'Improving' : 'Needs Focus'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {analysis.improvement_trends.comprehension.history.length} test{analysis.improvement_trends.comprehension.history.length !== 1 ? 's' : ''} tracked
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Thinking Trend */}
          <Card className={`border-2 ${getTrendColor(analysis.improvement_trends.critical_thinking.improving)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Critical Thinking</CardTitle>
                {getTrendIcon(analysis.improvement_trends.critical_thinking.improving)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getTrendColor(analysis.improvement_trends.critical_thinking.improving)}>
                    {analysis.improvement_trends.critical_thinking.improving ? 'Improving' : 'Needs Focus'}
                  </Badge>
                </div>
                {analysis.improvement_trends.critical_thinking.history.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Current level: <span className="font-semibold capitalize">
                      {analysis.improvement_trends.critical_thinking.history[analysis.improvement_trends.critical_thinking.history.length - 1].level}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Strengths */}
      {analysis.strengths_identified && analysis.strengths_identified.length > 0 && (
        <Card className="border-2 border-border bg-gradient-to-br from-muted via-muted/80 to-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-foreground" />
              <CardTitle className="text-lg">Recent Strengths Identified</CardTitle>
            </div>
            <CardDescription>
              Positive patterns and capabilities demonstrated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.strengths_identified.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-background/80 p-3 rounded-lg border border-border">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{item.strength}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.subject}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Recommendations - Only visible to teachers */}
      {showTeacherRecommendations && analysis.recommendations_history && analysis.recommendations_history.length > 0 && (
        <Card className="border-2 border-border bg-gradient-to-br from-muted via-muted/80 to-muted">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-foreground" />
              <CardTitle className="text-lg">Teacher Recommendations</CardTitle>
            </div>
            <CardDescription>
              AI-suggested focus areas for instruction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations_history.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-background/80 p-4 rounded-lg border border-border">
                  <div className="flex-shrink-0 w-7 h-7 bg-muted-foreground text-muted rounded-full flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{item.recommendation}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.subject}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Subject Summary */}
      {analysis.by_subject && Object.keys(analysis.by_subject).length > 0 && (
        <Card className="border-2 border-border bg-muted/50 dark:bg-muted/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-foreground" />
              <CardTitle className="text-lg">Analysis by Subject</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(analysis.by_subject).map(([subject, data]) => (
                <div key={subject} className="bg-background/80 p-4 rounded-lg border border-border text-center">
                  <div className="text-2xl font-bold text-foreground">{data.test_count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{subject.replace('_', ' ')}</div>
                  <div className="text-xs text-muted-foreground mt-1">test{data.test_count !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Persistent Issues */}
      {analysis.persistent_issues && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recurring Spelling Errors */}
          {analysis.persistent_issues.spelling_errors.length > 0 && (
            <Card className="border-2 border-border bg-muted/50 dark:bg-muted/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-foreground" />
                  <CardTitle className="text-lg">Recurring Spelling Issues</CardTitle>
                </div>
                <CardDescription>
                  Errors that appear multiple times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.persistent_issues.spelling_errors.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-background/80 p-3 rounded-lg border border-border">
                      <span className="text-sm text-foreground">{item.error}</span>
                      <Badge variant="secondary" className="bg-muted text-foreground">
                        {item.occurrences}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recurring Comprehension Problems */}
          {analysis.persistent_issues.comprehension_problems.length > 0 && (
            <Card className="border-2 border-border bg-muted/50 dark:bg-muted/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-foreground" />
                  <CardTitle className="text-lg">Recurring Comprehension Issues</CardTitle>
                </div>
                <CardDescription>
                  Understanding problems that persist
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.persistent_issues.comprehension_problems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-background/80 p-3 rounded-lg border border-border">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{item.problem}</p>
                      </div>
                      <Badge variant="secondary" className="bg-muted text-foreground flex-shrink-0">
                        {item.occurrences}x
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentProgressAnalysis;
