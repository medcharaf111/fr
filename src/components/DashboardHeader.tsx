import Notifications from '@/components/Notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from '@/types/api';
import { LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
}

const SUBJECT_LABELS: { [key: string]: string } = {
  math: 'Mathematics',
  science: 'Science',
  english: 'English',
  arabic: 'Arabic',
  social_studies: 'Social Studies',
  art: 'Art',
  music: 'Music',
  physical_education: 'Physical Education',
  computer_science: 'Computer Science',
  religious_studies: 'Religious Studies',
};

const GRADE_LABELS: { [key: string]: string } = {
  '1': '1st Grade',
  '2': '2nd Grade',
  '3': '3rd Grade',
  '4': '4th Grade',
  '5': '5th Grade',
  '6': '6th Grade',
};

const DashboardHeader = ({ user, onLogout }: DashboardHeaderProps) => {
  const { t } = useLanguage();
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (user && user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user && user.username ? user.username.substring(0, 2).toUpperCase() : 'U';
  };

  // Get role display name
  const getRoleDisplay = () => {
    if (!user || !user.role) return t('welcome.user');
    return t(`role.${user.role}`);
  };

  // Get role-specific information
  const getRoleInfo = () => {
    if (!user) return null;
    
    if (user.role === 'teacher' && user.subjects && user.subjects.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-muted-foreground">{t('teacherDash.tabs.lessons')}:</span>
          {user.subjects.map((subject) => (
            <Badge key={subject} variant="secondary">
              {t(`subject.${subject}`) || subject}
            </Badge>
          ))}
        </div>
      );
    }

    if (user.role === 'advisor' && user.subjects && user.subjects.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-muted-foreground">{t('register.subjects.advisor')}:</span>
          <Badge variant="secondary">
            {t(`subject.${user.subjects[0]}`) || user.subjects[0]}
          </Badge>
        </div>
      );
    }

    if (user.role === 'student') {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {user.grade_level && (
            <>
              <span className="text-sm text-muted-foreground">Grade:</span>
              <Badge variant="secondary">
                {GRADE_LABELS[user.grade_level] || `Grade ${user.grade_level}`}
              </Badge>
            </>
          )}
          <span className="text-sm text-muted-foreground">School:</span>
          <Badge variant="outline">{user.school_name}</Badge>
        </div>
      );
    }

    if (user.role === 'admin' || user.role === 'parent') {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-muted-foreground">School:</span>
          <Badge variant="outline">{user.school_name}</Badge>
        </div>
      );
    }

    if (user.role === 'inspector' || user.role === 'gpi') {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Department:</span>
          <Badge variant="secondary">Pedagogical Inspection</Badge>
        </div>
      );
    }

    return null;
  };

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left side - User info */}
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 border-2 border-muted">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || 'User'}`} alt={user?.username || 'User'} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* User details */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.username || 'User'}
                </h1>
                <Badge variant="default" className="text-xs">
                  {getRoleDisplay()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              {getRoleInfo()}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            <Notifications />
            <Button onClick={onLogout} variant="outline" size="default">
              <LogOut className="h-4 w-4 mr-2" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
