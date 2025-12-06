import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Award, Target, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SubjectStatistic {
  average_score: number;
  test_count: number;
  subject_display: string;
}

export interface SubjectStatistics {
  [subject: string]: SubjectStatistic;
}

interface SubjectRadarChartProps {
  statistics: SubjectStatistics;
  studentName?: string;
}

export const SubjectRadarChart: React.FC<SubjectRadarChartProps> = ({ 
  statistics, 
  studentName 
}) => {
  const { t, dir } = useLanguage();
  
  // Map subject keys to translation keys
  const getSubjectTranslation = (subjectKey: string): string => {
    const subjectMap: Record<string, string> = {
      'math': 'subject.math',
      'mathematics': 'subject.math',
      'science': 'subject.science',
      'english': 'subject.english',
      'arabic': 'subject.arabic',
      'social_studies': 'subject.social_studies',
      'art': 'subject.art',
      'music': 'subject.music',
      'physical_education': 'subject.physical_education',
      'computer_science': 'subject.computer_science',
      'religious_studies': 'subject.religious_studies',
    };
    
    const key = subjectKey.toLowerCase().replace(/ /g, '_');
    return subjectMap[key] ? t(subjectMap[key]) : subjectKey;
  };
  
  // Transform statistics object into array format for recharts
  const chartData = Object.entries(statistics).map(([subject, data]) => ({
    subject: getSubjectTranslation(subject),
    originalSubject: subject,
    score: data.average_score,
    tests: data.test_count,
    fullMark: 100, // Maximum score for reference
  }));

  // Calculate overall stats
  const totalTests = chartData.reduce((sum, item) => sum + item.tests, 0);
  const overallAverage = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length 
    : 0;
  const bestSubject = chartData.length > 0 
    ? chartData.reduce((max, item) => item.score > max.score ? item : max, chartData[0])
    : null;

  // If no data, show a message
  if (chartData.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir={dir}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-500" />
            <CardTitle className="text-2xl">{t('common.subjectPerformance')}</CardTitle>
          </div>
          <CardDescription className="text-base">
            {t('student.completeTestsToSeeChart')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
              <Target className="h-10 w-10 text-purple-500" />
            </div>
            <p className="text-gray-600 text-lg mb-2">{t('common.noDataAvailable')}</p>
            <p className="text-sm text-gray-500">{t('student.startTakingTestsToTrack')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30" dir={dir}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('student.subjectPerformanceRadar')}
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              {studentName ? `${studentName} ${t('student.performanceAcrossSubjects')}` : t('student.performanceAcrossSubjects')}
            </CardDescription>
          </div>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-gray-600">{t('student.bestSubject')}</p>
            </div>
            <p className="font-bold text-lg text-gray-800">{bestSubject?.subject || 'N/A'}</p>
            <p className="text-xs text-amber-600 font-medium">{bestSubject?.score.toFixed(1)}%</p>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-green-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-xs text-gray-600">{t('student.overallAvg')}</p>
            </div>
            <p className="font-bold text-lg text-gray-800">{overallAverage.toFixed(1)}%</p>
            <p className={`text-xs font-medium ${
              overallAverage >= 80 ? 'text-green-600' :
              overallAverage >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {overallAverage >= 80 ? t('student.excellentWork') : overallAverage >= 60 ? t('student.goodWork') : t('student.keepGoing')}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-500" />
              <p className="text-xs text-gray-600">{t('student.testAttempts')}</p>
            </div>
            <p className="font-bold text-lg text-gray-800">{totalTests}</p>
            <p className="text-xs text-purple-600 font-medium">{chartData.length} {t('student.subjectsCount')}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="bg-white rounded-xl p-6 shadow-inner border border-gray-100">
          <ResponsiveContainer width="100%" height={450}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <PolarGrid 
                stroke="#e5e7eb" 
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ 
                  fill: '#374151', 
                  fontSize: 13,
                  fontWeight: 600
                }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ 
                  fill: '#6b7280', 
                  fontSize: 11,
                  fontWeight: 500
                }}
                tickCount={6}
              />
              <Radar
                name={t('student.averageScore')}
                dataKey="score"
                stroke="#8b5cf6"
                fill="url(#colorScore)"
                fillOpacity={0.7}
                strokeWidth={3}
                dot={{
                  r: 5,
                  fill: '#8b5cf6',
                  strokeWidth: 2,
                  stroke: '#fff',
                }}
                activeDot={{
                  r: 7,
                  fill: '#7c3aed',
                  strokeWidth: 3,
                  stroke: '#fff',
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full"></div>
                          <p className="font-bold text-gray-800 text-base">{data.subject}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {t('student.averageScore')}: <span className="font-bold text-purple-600 text-lg">{data.score.toFixed(1)}%</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('student.testsTaken')}: <span className="font-semibold text-gray-800">{data.tests}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '24px' }}
                iconType="circle"
                formatter={(value) => <span className="font-semibold text-gray-700">{value}</span>}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Subject details cards */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-1 bg-purple-500 rounded-full"></div>
            <h4 className="text-base font-bold text-gray-800">{t('student.subjectBreakdown')}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chartData.map((item, index) => {
              const scoreColor = item.score >= 80 ? 'green' : item.score >= 60 ? 'amber' : 'red';
              const gradientFrom = item.score >= 80 ? 'from-green-50' : item.score >= 60 ? 'from-amber-50' : 'from-red-50';
              const gradientTo = item.score >= 80 ? 'to-emerald-50' : item.score >= 60 ? 'to-yellow-50' : 'to-rose-50';
              const borderColor = item.score >= 80 ? 'border-green-200' : item.score >= 60 ? 'border-amber-200' : 'border-red-200';
              
              return (
                <div 
                  key={index} 
                  className={`relative border-2 ${borderColor} rounded-xl p-4 bg-gradient-to-br ${gradientFrom} ${gradientTo} hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group overflow-hidden`}
                >
                  {/* Decorative corner gradient */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${
                    scoreColor === 'green' ? 'from-green-400/20' : 
                    scoreColor === 'amber' ? 'from-amber-400/20' : 
                    'from-red-400/20'
                  } to-transparent rounded-bl-full`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          scoreColor === 'green' ? 'bg-green-500' : 
                          scoreColor === 'amber' ? 'bg-amber-500' : 
                          'bg-red-500'
                        } animate-pulse`}></div>
                        <h5 className="font-bold text-gray-800 text-base group-hover:text-gray-900">{item.subject}</h5>
                      </div>
                      <span className={`text-sm font-bold px-3 py-1.5 rounded-full shadow-sm ${
                        scoreColor === 'green' ? 'bg-green-500 text-white' :
                        scoreColor === 'amber' ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {item.score.toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-3.5 w-3.5 text-gray-500" />
                      <p className="text-sm text-gray-600 font-medium">
                        {item.tests} {t('student.testsCompletedLabel')}
                      </p>
                    </div>
                    
                    {/* Animated progress bar */}
                    <div className="relative bg-white/60 rounded-full h-3 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${
                          scoreColor === 'green' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          scoreColor === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${item.score}%` }}
                      >
                        <div className="h-full w-full bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Performance label */}
                    <div className="mt-2 text-right">
                      <span className={`text-xs font-semibold ${
                        scoreColor === 'green' ? 'text-green-700' :
                        scoreColor === 'amber' ? 'text-amber-700' :
                        'text-red-700'
                      }`}>
                        {item.score >= 90 ? `🌟 ${t('student.outstanding')}` :
                         item.score >= 80 ? `✨ ${t('student.excellent')}` :
                         item.score >= 70 ? `👍 ${t('common.good')}` :
                         item.score >= 60 ? `📈 ${t('student.fair')}` :
                         `💪 ${t('student.keepGoing')}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectRadarChart;
