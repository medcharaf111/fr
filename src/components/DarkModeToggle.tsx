import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import React from 'react';

interface DarkModeToggleProps {
  className?: string;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  className = ''
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Sun className="h-4 w-4" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      />
      <Moon className="h-4 w-4" />
    </div>
  );
};

export default DarkModeToggle;
