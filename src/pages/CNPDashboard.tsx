import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/DashboardHeader';
import StatsCard from '@/components/StatsCard';
import { authAPI, cnpAPI } from '@/lib/api';
import { CNPTeacherGuide, CNPDashboardStats } from '@/types/api';
import { Upload, FileText, BookOpen, CheckCircle, Clock, Archive, Download, Eye, TrendingUp, Filter, Search, X, Edit, Trash2, Languages } from 'lucide-react';

const SUBJECT_OPTIONS = [
  { value: 'math', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'english', label: 'English' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'french', label: 'French' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'islamic_education', label: 'Islamic Education' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'civics', label: 'Civics' },
  { value: 'technology', label: 'Technology' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'physical_education', label: 'Physical Education' },
];

const GRADE_OPTIONS = [
  { value: 'grade_1', label: '1st Grade' },
  { value: 'grade_2', label: '2nd Grade' },
  { value: 'grade_3', label: '3rd Grade' },
  { value: 'grade_4', label: '4th Grade' },
  { value: 'grade_5', label: '5th Grade' },
  { value: 'grade_6', label: '6th Grade' },
  { value: 'grade_7', label: '7th Grade' },
  { value: 'grade_8', label: '8th Grade' },
  { value: 'grade_9', label: '9th Grade' },
  { value: 'grade_10', label: '10th Grade' },
  { value: 'grade_11', label: '11th Grade' },
  { value: 'grade_12', label: '12th Grade' },
];

const GUIDE_TYPE_OPTIONS = [
  { value: 'yearly', label: 'Yearly Program/Curriculum' },
  { value: 'unit', label: 'Unit/Chapter Guide' },
  { value: 'lesson', label: 'Single Lesson Guide' },
  { value: 'assessment', label: 'Assessment/Evaluation Guide' },
  { value: 'resource', label: 'Additional Resources' },
];

const STATUS_BADGE_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  archived: 'bg-gray-100 text-gray-800 border-gray-300',
};

const CNPDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language, setLanguage, dir } = useLanguage();
  const [user, setUser] = useState(authAPI.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CNPDashboardStats | null>(null);
  const [guides, setGuides] = useState<CNPTeacherGuide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<CNPTeacherGuide[]>([]);
  
  // Filters
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload form state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    subject: '',
    grade_level: '',
    guide_type: 'lesson',
    academic_year: '2024-2025',
    keywords: '',
    topics_covered: '',
    learning_objectives: '',
    cnp_notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser || currentUser.role !== 'cnp') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [guides, subjectFilter, gradeFilter, statusFilter, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, guidesRes] = await Promise.all([
        cnpAPI.getDashboardStats(),
        cnpAPI.getAllGuides(),
      ]);
      
      setStats(statsRes.data);
      setGuides(guidesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('common.error'),
        description: t('cnp.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const applyFilters = () => {
    let filtered = [...guides];

    if (subjectFilter !== 'all') {
      filtered = filtered.filter(g => g.subject === subjectFilter);
    }

    if (gradeFilter !== 'all') {
      filtered = filtered.filter(g => g.grade_level === gradeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.keywords.some(k => k.toLowerCase().includes(query))
      );
    }

    setFilteredGuides(filtered);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: t('cnp.invalidFile'),
          description: t('cnp.selectPDF'),
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: t('cnp.noFileSelected'),
        description: t('cnp.selectPDF'),
        variant: 'destructive',
      });
      return;
    }

    if (!uploadForm.title || !uploadForm.subject || !uploadForm.grade_level) {
      toast({
        title: t('cnp.missingFields'),
        description: t('cnp.fillRequired'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf_file', selectedFile);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('subject', uploadForm.subject);
      formData.append('grade_level', uploadForm.grade_level);
      formData.append('guide_type', uploadForm.guide_type);
      formData.append('academic_year', uploadForm.academic_year);
      formData.append('cnp_notes', uploadForm.cnp_notes);
      
      // Handle arrays
      const keywords = uploadForm.keywords.split(',').map(k => k.trim()).filter(k => k);
      const topics = uploadForm.topics_covered.split(',').map(t => t.trim()).filter(t => t);
      const objectives = uploadForm.learning_objectives.split(',').map(o => o.trim()).filter(o => o);
      
      formData.append('keywords', JSON.stringify(keywords));
      formData.append('topics_covered', JSON.stringify(topics));
      formData.append('learning_objectives', JSON.stringify(objectives));

      await cnpAPI.createGuide(formData);

      toast({
        title: t('common.success'),
        description: t('cnp.uploadSuccess'),
      });

      setUploadDialogOpen(false);
      resetUploadForm();
      fetchData();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.detail || t('cnp.uploadFailed'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      subject: '',
      grade_level: '',
      guide_type: 'lesson',
      academic_year: '2024-2025',
      keywords: '',
      topics_covered: '',
      learning_objectives: '',
      cnp_notes: '',
    });
    setSelectedFile(null);
  };

  const handleDownload = async (guide: CNPTeacherGuide) => {
    try {
      const response = await cnpAPI.downloadGuide(guide.id);
      window.open(response.data.file_url, '_blank');
      
      toast({
        title: t('cnp.downloadStarted'),
        description: `${t('cnp.downloadingFile')} ${guide.title}`,
      });
    } catch (error) {
      toast({
        title: t('cnp.downloadFailed'),
        description: t('cnp.downloadFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('cnp.deleteConfirm'))) return;

    try {
      await cnpAPI.deleteGuide(id);
      toast({
        title: t('common.success'),
        description: t('cnp.deleteSuccess'),
      });
      fetchData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('cnp.deleteFailed'),
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setSubjectFilter('all');
    setGradeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <DashboardLayout userRole="cnp" userName={user?.first_name || user?.username || 'CNP'}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="cnp" userName={user?.first_name || user?.username || 'CNP'}>
      {user && (
        <DashboardHeader
          user={user}
          onLogout={handleLogout}
        />
      )}

      <div className="p-6 space-y-6" dir={dir}>
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Languages className="h-4 w-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </Button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title={t('cnp.stats.myUploads')}
              value={stats.my_uploads || 0}
              icon={FileText}
              color="blue"
            />
            <StatsCard
              title={t('cnp.stats.pendingReview')}
              value={stats.pending_review}
              icon={Clock}
              color="orange"
            />
            <StatsCard
              title={t('cnp.stats.approved')}
              value={stats.approved}
              icon={CheckCircle}
              color="green"
            />
            <StatsCard
              title={t('cnp.stats.totalUsage')}
              value={stats.total_usage}
              icon={TrendingUp}
              color="purple"
            />
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="guides" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="guides">
                <BookOpen className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                {t('cnp.tabs.allGuides')}
              </TabsTrigger>
              <TabsTrigger value="statistics">
                <TrendingUp className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                {t('cnp.tabs.statistics')}
              </TabsTrigger>
            </TabsList>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                  {t('cnp.uploadGuide')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('cnp.uploadDialog.title')}</DialogTitle>
                  <DialogDescription>
                    {t('cnp.uploadDialog.description')}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="file">{t('cnp.uploadDialog.pdfFile')} *</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="mt-1"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('cnp.uploadDialog.selectedFile')}: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="title">{t('cnp.uploadDialog.fieldTitle')} *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder={t('cnp.uploadDialog.titlePlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">{t('cnp.uploadDialog.fieldDescription')}</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder={t('cnp.uploadDialog.descriptionPlaceholder')}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subject">{t('cnp.uploadDialog.subject')} *</Label>
                      <Select
                        value={uploadForm.subject}
                        onValueChange={(value) => setUploadForm({ ...uploadForm, subject: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('cnp.uploadDialog.subjectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="grade">{t('cnp.uploadDialog.gradeLevel')} *</Label>
                      <Select
                        value={uploadForm.grade_level}
                        onValueChange={(value) => setUploadForm({ ...uploadForm, grade_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('cnp.uploadDialog.gradePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guide_type">{t('cnp.uploadDialog.guideType')}</Label>
                      <Select
                        value={uploadForm.guide_type}
                        onValueChange={(value) => setUploadForm({ ...uploadForm, guide_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GUIDE_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="academic_year">{t('cnp.uploadDialog.academicYear')}</Label>
                      <Input
                        id="academic_year"
                        value={uploadForm.academic_year}
                        onChange={(e) => setUploadForm({ ...uploadForm, academic_year: e.target.value })}
                        placeholder={t('cnp.uploadDialog.yearPlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="keywords">{t('cnp.uploadDialog.keywords')}</Label>
                    <Input
                      id="keywords"
                      value={uploadForm.keywords}
                      onChange={(e) => setUploadForm({ ...uploadForm, keywords: e.target.value })}
                      placeholder={t('cnp.uploadDialog.keywordsPlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="topics">{t('cnp.uploadDialog.topicsCovered')}</Label>
                    <Textarea
                      id="topics"
                      value={uploadForm.topics_covered}
                      onChange={(e) => setUploadForm({ ...uploadForm, topics_covered: e.target.value })}
                      placeholder={t('cnp.uploadDialog.topicsPlaceholder')}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="objectives">{t('cnp.uploadDialog.learningObjectives')}</Label>
                    <Textarea
                      id="objectives"
                      value={uploadForm.learning_objectives}
                      onChange={(e) => setUploadForm({ ...uploadForm, learning_objectives: e.target.value })}
                      placeholder={t('cnp.uploadDialog.objectivesPlaceholder')}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">{t('cnp.uploadDialog.cnpNotes')}</Label>
                    <Textarea
                      id="notes"
                      value={uploadForm.cnp_notes}
                      onChange={(e) => setUploadForm({ ...uploadForm, cnp_notes: e.target.value })}
                      placeholder={t('cnp.uploadDialog.notesPlaceholder')}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleUploadSubmit} disabled={uploading}>
                    {uploading ? `${t('cnp.uploadDialog.uploading')}...` : t('cnp.uploadDialog.upload')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="guides" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Filter className={`h-5 w-5 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                    {t('cnp.filters.title')}
                  </span>
                  {(subjectFilter !== 'all' || gradeFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                      {t('cnp.filters.clearFilters')}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>{t('cnp.filters.search')}</Label>
                    <div className="relative">
                      <Search className={`absolute ${dir === 'rtl' ? 'right-2' : 'left-2'} top-2.5 h-4 w-4 text-muted-foreground`} />
                      <Input
                        placeholder={t('cnp.filters.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={dir === 'rtl' ? 'pr-8' : 'pl-8'}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>{t('cnp.filters.subject')}</Label>
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('cnp.filters.allSubjects')}</SelectItem>
                        {SUBJECT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('cnp.filters.grade')}</Label>
                    <Select value={gradeFilter} onValueChange={setGradeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('cnp.filters.allGrades')}</SelectItem>
                        {GRADE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('cnp.filters.status')}</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('cnp.filters.allStatus')}</SelectItem>
                        <SelectItem value="pending">{t('cnp.status.pending')}</SelectItem>
                        <SelectItem value="approved">{t('cnp.status.approved')}</SelectItem>
                        <SelectItem value="archived">{t('cnp.status.archived')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Showing {filteredGuides.length} of {guides.length} guides
                </div>
              </CardContent>
            </Card>

            {/* Guides List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredGuides.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('cnp.noGuidesFound')}</p>
                    <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                      <Upload className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                      {t('cnp.uploadFirstGuide')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredGuides.map((guide) => (
                  <Card key={guide.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{guide.title}</CardTitle>
                          <CardDescription className="mt-2">{guide.description}</CardDescription>
                        </div>
                        <Badge className={STATUS_BADGE_COLORS[guide.status]}>
                          {t(`cnp.status.${guide.status}`)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('cnp.table.subject')}:</span>
                          <p className="font-medium">{guide.subject_display}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('cnp.table.grade')}:</span>
                          <p className="font-medium">{guide.grade_level_display}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('cnp.table.type')}:</span>
                          <p className="font-medium">{guide.guide_type_display}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('cnp.table.year')}:</span>
                          <p className="font-medium">{guide.academic_year}</p>
                        </div>
                      </div>

                      {guide.keywords.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{t('cnp.table.keywords')}:</p>
                          <div className="flex flex-wrap gap-1">
                            {guide.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Eye className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                            {guide.usage_count} {t('cnp.table.uses')}
                          </span>
                          <span className="flex items-center">
                            <Download className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                            {guide.download_count} {t('cnp.table.downloads')}
                          </span>
                          <span>{guide.file_size_mb} MB</span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(guide)}
                          >
                            <Download className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                            {t('cnp.table.download')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(guide.id)}
                          >
                            <Trash2 className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
                            {t('cnp.table.delete')}
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {t('cnp.table.uploadedBy')} {guide.uploaded_by_name} {t('cnp.table.on')} {new Date(guide.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Subject */}
              {stats && stats.by_subject && stats.by_subject.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('cnp.statistics.bySubject')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.by_subject.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{item.name}</span>
                          <Badge>{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* By Grade */}
              {stats && stats.by_grade && stats.by_grade.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('cnp.statistics.byGrade')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.by_grade.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{item.name}</span>
                          <Badge>{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* By Type */}
              {stats && stats.by_type && stats.by_type.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('cnp.statistics.byType')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.by_type.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">{item.name}</span>
                          <Badge>{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CNPDashboard;
