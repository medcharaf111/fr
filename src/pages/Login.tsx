import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { School, ArrowLeft, LogIn } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, dir } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.login(username, password);
      authAPI.setTokens(response.access, response.refresh, response.user);
      toast({
        title: t('login.success'),
        description: `${t('login.welcome')}, ${response.user.first_name || response.user.username}!`,
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
        case 'delegation':
          navigate('/delegation');
          break;
        case 'cnp':
          navigate('/cnp');
          break;
        case 'inspector':
          navigate('/inspector');
          break;
        case 'gpi':
          navigate('/gpi');
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
        title: t('login.failed'),
        description: t('login.invalidCredentials'),
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
          {t('login.backHome')}
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        {/* Logo at top */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Native OS" className="w-10 h-10" />
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Native OS
            </h2>
          </div>
        </div>

        <Card className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <LogIn className="w-8 h-8 text-blue-400" />
              {t('login.title')}
            </CardTitle>
            <CardDescription className="text-gray-400 text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('login.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('login.username')}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
                placeholder={t('login.username.placeholder')}
                required
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-300 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
                placeholder={t('login.password.placeholder')}
                required
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-6 shadow-lg transition-all" 
              disabled={loading}
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
            >
              {loading ? t('login.loading') : t('login.button')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
              {t('login.noAccount')}{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-400 hover:text-blue-300 font-semibold underline"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {t('login.registerLink')}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Login;
