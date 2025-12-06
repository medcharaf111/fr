import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, Trophy, FileText, Award, Zap, BookOpen, Target, NotebookPen, Languages, Users, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { authAPI } from '@/lib/api';
import { Progress, Portfolio, StatisticsResponse, ProgressAnalysisResponse } from '@/types/api';
import StudentRelationships from './StudentRelationships';
import TeacherTimelineViewer from '@/components/TeacherTimelineViewer';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import SubjectRadarChart from '@/components/SubjectRadarChart';
import StudentProgressAnalysis from '@/components/StudentProgressAnalysis';
import StudentNotebook from '@/components/StudentNotebook';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import DarkModeToggle from '@/components/DarkModeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

interface GamificationData {
  student: string;
  xp_points: number;
  level: number;
  streak_days: number;
  total_tests: number;
  xp_for_next_level: number;
  xp_progress_in_current_level: number;
  level_progress_percentage: number;
}

const StudentDashboard = () => {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [progressAnalysis, setProgressAnalysis] = useState<ProgressAnalysisResponse | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const { t, language, setLanguage, dir } = useLanguage();
  const user = authAPI.getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProgress();
    fetchPortfolio();
    fetchStatistics();
    fetchProgressAnalysis();
    fetchGamification();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.get('/progress/');
      setProgress(response.data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const response = await api.get('/portfolios/');
      if (response.data.length > 0) {
        setPortfolio(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/portfolios/statistics/');
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchProgressAnalysis = async () => {
    try {
      const response = await api.get('/portfolios/progress_analysis/');
      setProgressAnalysis(response.data);
    } catch (error) {
      console.error('Failed to fetch progress analysis:', error);
    }
  };

  const fetchGamification = async () => {
    try {
      const response = await api.get('/portfolios/gamification/');
      setGamification(response.data);
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    window.location.href = '/';
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout 
      userRole="student" 
      userName={user?.first_name || user?.username || 'Student'}
    >
      {/* Language & Theme Toggle Buttons */}
      <div className="flex justify-end gap-2 mb-4 p-3 px-4 bg-card rounded-lg border border-border/50">
        <DarkModeToggle />
        <LanguageToggle
          variant="outline"
          size="default"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8" dir={dir}>
        <StatsCard
          title={t('student.xpPoints')}
          value={gamification?.xp_points || 0}
          icon={Zap}
          description={`${t('student.level')} ${gamification?.level || 1}`}
          color="green"
        />
        <StatsCard
          title={t('student.testAttempts')}
          value={gamification?.total_tests || 0}
          icon={ClipboardCheck}
          description={t('student.testsCompleted')}
          color="blue"
        />
        <StatsCard
          title={t('student.studyStreak')}
          value={gamification?.streak_days || 0}
          icon={Trophy}
          description={t('student.daysInRow')}
          color="orange"
        />
        <StatsCard
          title={t('student.subjects')}
          value={progress.length}
          icon={BookOpen}
          description={t('student.currentlyStudying')}
          color="purple"
        />
      </div>

      {/* Enhanced Quick Actions Bar */}
      <div className="mb-8" dir={dir}>
        <Card className="border-0 shadow-sm bg-muted/50 dark:bg-muted/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('student.quickActions')}</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate('/mcq-test')}
                variant="outline"
                className="group h-auto p-4 border-2 border-blue-200 hover:border-accent hover:bg-accent/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <ClipboardCheck className="h-5 w-5 text-blue-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-blue-900 transition-colors">
                      {t('student.mcqTest')}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-blue-700 transition-colors">
                      {t('student.takeQuiz')}
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/qa-test')}
                variant="outline"
                className="group h-auto p-4 border-2 border-green-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-500/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-5 w-5 text-green-700" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-green-900 transition-colors">
                      {t('student.qaTest')}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-green-700 transition-colors">
                      {t('student.openEnded')}
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/vault/student')}
                variant="outline"
                className="group h-auto p-4 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:shadow-lg transition-all duration-300 sm:col-span-2 lg:col-span-1"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-5 w-5 text-purple-700" />
                  </div>
                  <div className="text-left">

                    <div className="font-semibold text-foreground group-hover:text-purple-900 transition-colors">
                      {t('student.vaultLibrary')}
                    </div>
                    <div className="text-xs text-muted-foreground group-hover:text-purple-700 transition-colors">
                      {t('student.exploreContent')}
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="relationships" className="space-y-6" dir={dir}>
        {/* Modern Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border p-2">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1 bg-transparent h-auto">
            <TabsTrigger 
              value="relationships"
              className="flex-col h-auto py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('student.myTeachers')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="timeline"
              className="flex-col h-auto py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
            >
              <Calendar className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('student.teacherTimeline')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notebook"
              className="flex-col h-auto py-3 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm"
            >
              <NotebookPen className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('student.myNotebook')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="progress"
              className="flex-col h-auto py-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('student.myProgress')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="progress-analysis"
              className="flex-col h-auto py-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
            >
              <Award className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('student.learningJourney')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="portfolio"
              className="flex-col h-auto py-3 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:shadow-sm"
            >
              <BookOpen className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{t('student.myPortfolio')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

          <TabsContent
            value="relationships"
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <StudentRelationships />
          </TabsContent>

          <TabsContent
            value="timeline"
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <TeacherTimelineViewer />
          </TabsContent>

          <TabsContent
            value="notebook"
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <StudentNotebook />
          </TabsContent>

          <TabsContent
            value="progress"
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  {t('student.myProgress')}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('student.trackLearningJourney')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {progress.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                      <Trophy className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-gray-700 text-lg font-medium mb-2">{t('student.noProgressYet')}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{t('student.completeToSeeProgress')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {progress.map((p) => (
                      <Card key={p.id} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{p.lesson_title}</h4>
                              <p className="text-sm text-gray-600">{t('student.score')}: {p.score || t('student.notGradedYet')}</p>
                              <p className="text-sm text-gray-600">
                                {t('common.status')}: {p.completed_at ? t('student.completed') : t('student.inProgress')}
                              </p>
                              {p.completed_at && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {t('student.completedOn')}: {new Date(p.completed_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="ml-4 text-right">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-2 border-blue-300">
                                <span className="text-xl font-bold text-blue-700">
                                  {p.score || 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="progress-analysis"
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            {progressAnalysis && progressAnalysis.analysis ? (
              <StudentProgressAnalysis
                analysis={progressAnalysis.analysis}
                studentName={user?.first_name || user?.username || 'Student'}
              />
            ) : (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    {t('student.learningJourneyAnalysis')}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {t('student.trackImprovementPatterns')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('student.loadingAnalysis')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent
            value="portfolio"
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          >
            <div className="space-y-6">
              {/* Gamification Stats */}
              {gamification && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold">{t('student.level')} {gamification.level}</CardTitle>
                        <Trophy className="h-8 w-8 text-yellow-300" />
                      </div>
                      <CardDescription className="text-purple-100">
                        {t('student.yourCurrentLevel')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-100">{t('student.progressToLevel')} {gamification.level + 1}</span>
                          <span className="font-semibold">{Math.round(gamification.level_progress_percentage)}%</span>
                        </div>
                        <ProgressBar value={gamification.level_progress_percentage} className="h-2 bg-purple-800" />
                        <p className="text-xs text-purple-100 mt-2">
                          {gamification.xp_for_next_level} {t('student.xpNeededForNextLevel')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-700 text-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold">{gamification.xp_points} XP</CardTitle>
                        <Zap className="h-8 w-8 text-yellow-300" />
                      </div>
                      <CardDescription className="text-orange-100">
                        {t('student.totalExperiencePoints')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-sm text-orange-100">
                          {t('student.earnedFromTests').replace('{count}', gamification.total_tests.toString())}
                        </p>
                        <p className="text-xs text-orange-100">
                          {t('student.keepCompletingTests')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-700 text-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold">{gamification.streak_days} {t('time.days')}</CardTitle>
                        <Award className="h-8 w-8 text-yellow-300" />
                      </div>
                      <CardDescription className="text-green-100">
                        {t('student.learningStreak')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        <p className="text-sm text-green-100">
                          {gamification.streak_days > 0 
                            ? t('student.keepItUp').replace('{count}', gamification.streak_days.toString())
                            : t('student.completeToStartStreak')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Subject Performance Radar Chart */}
              {statistics && (
                <SubjectRadarChart 
                  statistics={statistics.statistics}
                  studentName={user?.first_name || user?.username}
                />
              )}

              {/* Portfolio Summary */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-purple-600" />
                    <CardTitle className="text-2xl">{t('student.myPortfolio')}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {t('student.yourLearningAchievements')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {portfolio ? (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-bold text-gray-800">{t('student.summary')}</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{portfolio.summary}</p>
                      </div>
                      
                      {/* Test Results Section */}
                      {portfolio.test_results && portfolio.test_results.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <ClipboardCheck className="h-5 w-5 text-purple-600" />
                              <h3 className="text-lg font-bold text-gray-800">{t('student.recentTestResults')}</h3>
                            </div>
                            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              {t('student.last10Tests')}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {portfolio.test_results.slice(-10).reverse().map((result, index) => {
                              const scoreColor = result.score >= 80 ? 'green' : result.score >= 60 ? 'amber' : 'red';
                              
                              return (
                                <div 
                                  key={index} 
                                  className="group relative flex justify-between items-center p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 bg-white hover:shadow-md transition-all duration-300"
                                >
                                  {/* Left gradient accent */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                                    scoreColor === 'green' ? 'bg-gradient-to-b from-green-400 to-green-600' :
                                    scoreColor === 'amber' ? 'bg-gradient-to-b from-amber-400 to-amber-600' :
                                    'bg-gradient-to-b from-red-400 to-red-600'
                                  }`}></div>
                                  
                                  <div className="flex-1 ml-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                                        result.test_type === 'MCQ' 
                                          ? 'bg-blue-100 text-blue-700' 
                                          : 'bg-purple-100 text-purple-700'
                                      }`}>
                                        {result.test_type}
                                      </span>
                                      <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                                        {result.test_title}
                                      </p>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">{result.lesson_name}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                        {new Date(result.date).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          year: 'numeric' 
                                        })}
                                      </span>
                                      {result.attempt > 1 && (
                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                                          <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                                          {t('student.attempt')} {result.attempt}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2">
                                    <div className={`px-4 py-2 rounded-lg text-base font-bold shadow-sm ${
                                      scoreColor === 'green' ? 'bg-green-500 text-white' :
                                      scoreColor === 'amber' ? 'bg-amber-500 text-white' :
                                      'bg-red-500 text-white'
                                    }`}>
                                      {result.score.toFixed(0)}%
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      scoreColor === 'green' ? 'text-green-600' :
                                      scoreColor === 'amber' ? 'text-amber-600' :
                                      'text-red-600'
                                    }`}>
                                      {result.score >= 90 ? t('student.outstanding') :
                                       result.score >= 80 ? t('student.excellent') :
                                       result.score >= 70 ? t('common.good') :
                                       result.score >= 60 ? t('student.fair') :
                                       t('student.needsWork')}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Achievements Section */}
                      {portfolio.achievements && portfolio.achievements.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Award className="h-5 w-5 text-amber-500" />
                            <h3 className="text-lg font-bold text-gray-800">{t('student.achievements')}</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {portfolio.achievements.map((achievement, index) => (
                              <Card key={index} className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                                <CardContent className="pt-4">
                                  <p className="text-sm">{JSON.stringify(achievement)}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-4 border-t">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        {t('student.lastUpdated')}: {new Date(portfolio.updated_at).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                        <Trophy className="h-10 w-10 text-purple-500" />
                      </div>
                      <p className="text-gray-600 text-lg mb-2">{t('student.portfolioNotGenerated')}</p>
                      <p className="text-sm text-gray-500">{t('student.completeTestsToBuildPortfolio')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
};

export default StudentDashboard;
