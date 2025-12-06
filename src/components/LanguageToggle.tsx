import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className = '',
  variant = 'outline',
  size = 'default'
}) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleLanguage}
      className={`gap-2 ${className}`}
      title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      <Languages className="h-4 w-4" />
      <span className="font-medium">
        {language === 'en' ? 'العربية' : 'English'}
      </span>
    </Button>
  );
};
