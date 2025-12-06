import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import React from 'react';

interface SpellingGrammar {
  has_issues: boolean;
  severity: 'minor' | 'moderate' | 'severe';
  examples: string[];
  count: number;
}

interface Comprehension {
  has_issues: boolean;
  severity: 'minor' | 'moderate' | 'severe';
  problems: string[];
  misunderstood_questions: number[];
}

interface Completeness {
  incomplete_count: number;
  details: string[];
  incomplete_questions: number[];
}

interface CriticalThinking {
  level: 'weak' | 'developing' | 'good' | 'strong';
  observations: string[];
  needs_improvement: boolean;
}

interface AIAnalysis {
  overall_assessment: string;
  spelling_grammar: SpellingGrammar;
  comprehension: Comprehension;
  completeness: Completeness;
  critical_thinking: CriticalThinking;
  strengths: string[];
  recommendations_for_teacher: string[];
  priority_areas: string[];
  confidence_score: number;
}

interface StudentWeaknessAnalysisProps {
  analysis: AIAnalysis;
  studentName: string;
}

const StudentWeaknessAnalysis: React.FC<StudentWeaknessAnalysisProps> = ({ 
  analysis, 
  studentName 
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'moderate':
        return 'text-amber-700 bg-amber-100 border-amber-300';
      case 'minor':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'strong':
        return 'text-green-700 bg-green-100';
      case 'good':
        return 'text-blue-700 bg-blue-100';
      case 'developing':
        return 'text-yellow-700 bg-yellow-100';
      case 'weak':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                AI Analysis for {studentName}
                <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Comprehensive analysis of student's responses and learning patterns
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">AI Confidence</div>
              <div className={`text-2xl font-bold ${
                analysis.confidence_score >= 80 ? 'text-green-600' :
                analysis.confidence_score >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {analysis.confidence_score}%
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white/70 rounded-lg p-4 border border-purple-200">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              Overall Assessment
            </h4>
            <p className="text-gray-700 leading-relaxed">{analysis.overall_assessment}</p>
          </div>
        </CardContent>
      </Card>

      {/* Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spelling & Grammar */}
        {analysis.spelling_grammar.has_issues && (
          <Card className={`border-2 ${getSeverityColor(analysis.spelling_grammar.severity)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <CardTitle className="text-lg">Spelling & Grammar</CardTitle>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(analysis.spelling_grammar.severity)}`}>
                  {analysis.spelling_grammar.severity.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Found {analysis.spelling_grammar.count} issue{analysis.spelling_grammar.count !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {analysis.spelling_grammar.examples.slice(0, 5).map((example, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{example}</span>
                  </div>
                ))}
                {analysis.spelling_grammar.examples.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{analysis.spelling_grammar.examples.length - 5} more issues
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comprehension Issues */}
        {analysis.comprehension.has_issues && (
          <Card className={`border-2 ${getSeverityColor(analysis.comprehension.severity)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <CardTitle className="text-lg">Comprehension</CardTitle>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(analysis.comprehension.severity)}`}>
                  {analysis.comprehension.severity.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Misunderstood {analysis.comprehension.misunderstood_questions.length} question{analysis.comprehension.misunderstood_questions.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {analysis.comprehension.problems.map((problem, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{problem}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completeness */}
        {analysis.completeness.incomplete_count > 0 && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">Incomplete Answers</CardTitle>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-200 text-orange-800">
                  {analysis.completeness.incomplete_count} QUESTIONS
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.completeness.details.map((detail, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                    <span className="text-gray-700">{detail}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Critical Thinking */}
        <Card className={`border-2 ${getLevelColor(analysis.critical_thinking.level)} bg-opacity-50`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <CardTitle className="text-lg">Critical Thinking</CardTitle>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(analysis.critical_thinking.level)}`}>
                {analysis.critical_thinking.level.toUpperCase()}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.critical_thinking.observations.map((obs, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{obs}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Student Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/70 rounded-lg p-3 border border-green-200">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations for Teacher */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Recommendations for Teacher</CardTitle>
          </div>
          <CardDescription>
            Actionable suggestions to help improve student performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.recommendations_for_teacher.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white/70 rounded-lg p-4 border border-blue-200">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <span className="text-sm text-gray-700 pt-1">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Areas */}
      {analysis.priority_areas && analysis.priority_areas.length > 0 && (
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Priority Focus Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.priority_areas.map((area, idx) => (
                <span 
                  key={idx}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold shadow-md"
                >
                  {area}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentWeaknessAnalysis;
