import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { authAPI } from '@/lib/api';
import { LogOut } from 'lucide-react';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: string;
  userName: string;
}

const DashboardLayout = ({ children, userRole, userName }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const getRoleColor = () => {
    const colors: Record<string, string> = {
      teacher: 'from-blue-500 to-cyan-500',
      student: 'from-green-500 to-emerald-500',
      parent: 'from-purple-500 to-pink-500',
      admin: 'from-red-500 to-orange-500',
      advisor: 'from-indigo-500 to-purple-500',
      director: 'from-teal-500 to-cyan-500',
      delegation: 'from-orange-500 to-red-500',
      cnp: 'from-yellow-500 to-amber-500',
      inspector: 'from-violet-500 to-purple-500',
      gpi: 'from-fuchsia-500 to-pink-500',
      minister: 'from-rose-500 to-red-500',
    };
    return colors[userRole] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className={`bg-gradient-to-r ${getRoleColor()} shadow-lg`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <img src="/logo.png" alt="Native OS" className="w-6 h-6" />
                <span className="text-white font-bold text-sm">NATIVE OS</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {userRole ? t(`role.${userRole}`) : t('welcome.user')} {t('nav.dashboard')}
                </h1>
                <p className="text-white/80 text-sm">{t('welcome.back')}, {userName || t('welcome.user')}!</p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Native OS - Digital Education Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
