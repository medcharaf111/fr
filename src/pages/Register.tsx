import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { authAPI } from '@/lib/api';
import api from '@/lib/api';
import { School } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';
import { School as SchoolIcon, ArrowLeft, UserPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const Register = () => {
  const { t, dir } = useLanguage();
  
  const SUBJECT_OPTIONS = [
    { value: 'math', label: t('subject.math') },
    { value: 'science', label: t('subject.science') },
    { value: 'english', label: t('subject.english') },
    { value: 'arabic', label: t('subject.arabic') },
    { value: 'social_studies', label: t('subject.social_studies') },
    { value: 'art', label: t('subject.art') },
    { value: 'music', label: t('subject.music') },
    { value: 'physical_education', label: t('subject.physical_education') },
    { value: 'computer_science', label: t('subject.computer_science') },
    { value: 'religious_studies', label: t('subject.religious_studies') },
  ];
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: '',
    school: '2', // Default to Virtual School (ID: 2)
    subjects: [] as string[],
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : prev.subjects.length < 3
        ? [...prev.subjects, subject]
        : prev.subjects;
      return { ...prev, subjects };
    });
  };

  const handleAdvisorSubjectSelect = (subject: string) => {
    setFormData(prev => ({ ...prev, subjects: [subject] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate teacher subjects
    if (formData.role === 'teacher' && formData.subjects.length === 0) {
      toast({
        title: t('register.failed'),
        description: t('register.validation.teacherSubjects'),
        variant: 'destructive',
      });
      return;
    }
    
    // Validate advisor subject
    if (formData.role === 'advisor' && formData.subjects.length !== 1) {
      toast({
        title: t('register.failed'),
        description: t('register.validation.advisorSubject'),
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.register({
        ...formData,
        school: parseInt(formData.school),
      });
      authAPI.setTokens(response.access, response.refresh, response.user);
      toast({
        title: t('register.success'),
        description: `${t('register.welcomeTo')}, ${response.user.first_name || response.user.username}!`,
      });
      // Redirect based on role
      switch (response.user.role) {
        case 'teacher':
          navigate('/teacher');
          break;
        case 'student':
          navigate('/student');
          break;
        case 'parent':
          navigate('/parent');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'advisor':
          navigate('/advisor');
          break;
        case 'director':
          navigate('/director');
          break;
        case 'cnp':
          navigate('/cnp');
          break;
        case 'gdhr':
          navigate('/gdhr');
          break;
        case 'minister':
          navigate('/minister');
          break;
        case 'secretary':
          navigate('/secretary');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      toast({
        title: t('register.failed'),
        description: t('register.checkInfo'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" dir={dir} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Dark Background like footer */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Language Toggle */}
      <div className="absolute top-8 right-8 z-20">
        <LanguageToggle />
      </div>

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-20">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-gray-400 hover:text-white hover:bg-white/10"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('register.backHome')}
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        {/* Logo at top */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Native OS" className="w-10 h-10" />
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Native OS
            </h2>
          </div>
        </div>

        <Card className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-2xl mt-20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <UserPlus className="w-8 h-8 text-blue-400" />
              {t('register.title')}
            </CardTitle>
            <CardDescription className="text-gray-400 text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('register.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('register.firstName')}</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('register.lastName')}</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="username" className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('register.username')}</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
                required
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('register.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
                required
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('register.password')}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
                required
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('register.role')}</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <SelectValue placeholder={t('register.role.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">{t('register.role.student')}</SelectItem>
                  <SelectItem value="parent">{t('register.role.parent')}</SelectItem>
                  <SelectItem value="teacher">{t('register.role.teacher')}</SelectItem>
                  <SelectItem value="advisor">{t('register.role.advisor')}</SelectItem>
                  <SelectItem value="director">{t('register.role.director')}</SelectItem>
                  <SelectItem value="delegation">{t('register.role.delegation')}</SelectItem>
                  <SelectItem value="cnp">{t('register.role.cnp')}</SelectItem>
                  <SelectItem value="inspector">{t('register.role.inspector')}</SelectItem>
                  <SelectItem value="gpi">{t('register.role.gpi')}</SelectItem>
                  <SelectItem value="gdhr">{t('register.role.gdhr')}</SelectItem>
                  <SelectItem value="admin">{t('register.role.admin')}</SelectItem>
                  <SelectItem value="minister">{t('register.role.minister')}</SelectItem>
                  <SelectItem value="secretary">{t('register.role.secretary')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.role === 'teacher' && (
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('register.subjects.teacher')}</Label>
                <div className="grid grid-cols-2 gap-2 p-4 border border-gray-600 rounded-md bg-gray-700/30">
                  {SUBJECT_OPTIONS.map(subject => (
                    <div key={subject.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject.value}
                        checked={formData.subjects.includes(subject.value)}
                        onCheckedChange={() => handleSubjectToggle(subject.value)}
                        disabled={!formData.subjects.includes(subject.value) && formData.subjects.length >= 3}
                      />
                      <label
                        htmlFor={subject.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {subject.label}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t('register.subjects.selected')}: {formData.subjects.length} {t('register.subjects.of')} 3
                </p>
              </div>
            )}
            
            {formData.role === 'advisor' && (
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('register.subjects.advisor')}</Label>
                <RadioGroup 
                  value={formData.subjects[0] || ''} 
                  onValueChange={handleAdvisorSubjectSelect}
                  className="grid grid-cols-2 gap-2 p-4 border border-gray-600 rounded-md bg-gray-700/30"
                >
                  {SUBJECT_OPTIONS.map(subject => (
                    <div key={subject.value} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={subject.value} 
                        id={`advisor-${subject.value}`}
                      />
                      <label
                        htmlFor={`advisor-${subject.value}`}
                        className="text-sm font-medium leading-none cursor-pointer text-gray-300"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {subject.label}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
                {formData.subjects.length === 1 && (
                  <p className="text-xs text-blue-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {t('register.subjects.selected')}: {SUBJECT_OPTIONS.find(s => s.value === formData.subjects[0])?.label}
                  </p>
                )}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-6 shadow-lg transition-all" 
              disabled={loading}
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
            >
              {loading ? t('register.loading') : t('register.button')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('register.haveAccount')}{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-400 hover:text-blue-300 font-semibold underline"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {t('register.loginLink')}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Register;
