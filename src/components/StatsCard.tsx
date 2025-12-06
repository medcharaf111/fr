import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatsCard = ({ title, value, icon: Icon, description, color = 'blue', trend }: StatsCardProps) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
      icon: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 dark:bg-gradient-to-br dark:from-blue-900 dark:to-blue-800 dark:text-blue-300',
      trend: 'text-blue-600 dark:text-blue-400',
      card: 'hover:shadow-blue-200/50 border-blue-100/50 dark:hover:shadow-blue-500/10 dark:border-blue-800/50',
      glow: 'shadow-blue-500/20 dark:shadow-blue-500/10',
    },
    green: {
      bg: 'from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700',
      icon: 'bg-gradient-to-br from-green-100 to-emerald-200 text-green-700 dark:bg-gradient-to-br dark:from-green-900 dark:to-emerald-800 dark:text-green-300',
      trend: 'text-green-600 dark:text-green-400',
      card: 'hover:shadow-green-200/50 border-green-100/50 dark:hover:shadow-green-500/10 dark:border-green-800/50',
      glow: 'shadow-green-500/20 dark:shadow-green-500/10',
    },
    purple: {
      bg: 'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
      icon: 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 dark:bg-gradient-to-br dark:from-purple-900 dark:to-purple-800 dark:text-purple-300',
      trend: 'text-purple-600 dark:text-purple-400',
      card: 'hover:shadow-purple-200/50 border-purple-100/50 dark:hover:shadow-purple-500/10 dark:border-purple-800/50',
      glow: 'shadow-purple-500/20 dark:shadow-purple-500/10',
    },
    orange: {
      bg: 'from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700',
      icon: 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 dark:bg-gradient-to-br dark:from-orange-900 dark:to-orange-800 dark:text-orange-300',
      trend: 'text-orange-600 dark:text-orange-400',
      card: 'hover:shadow-orange-200/50 border-orange-100/50 dark:hover:shadow-orange-500/10 dark:border-orange-800/50',
      glow: 'shadow-orange-500/20 dark:shadow-orange-500/10',
    },
    red: {
      bg: 'from-red-500 to-red-600 dark:from-red-600 dark:to-red-700',
      icon: 'bg-gradient-to-br from-red-100 to-red-200 text-red-700 dark:bg-gradient-to-br dark:from-red-900 dark:to-red-800 dark:text-red-300',
      trend: 'text-red-600 dark:text-red-400',
      card: 'hover:shadow-red-200/50 border-red-100/50 dark:hover:shadow-red-500/10 dark:border-red-800/50',
      glow: 'shadow-red-500/20 dark:shadow-red-500/10',
    },
    cyan: {
      bg: 'from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700',
      icon: 'bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-700 dark:bg-gradient-to-br dark:from-cyan-900 dark:to-cyan-800 dark:text-cyan-300',
      trend: 'text-cyan-600 dark:text-cyan-400',
      card: 'hover:shadow-cyan-200/50 border-cyan-100/50 dark:hover:shadow-cyan-500/10 dark:border-cyan-800/50',
      glow: 'shadow-cyan-500/20 dark:shadow-cyan-500/10',
    },
    pink: {
      bg: 'from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700',
      icon: 'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700 dark:bg-gradient-to-br dark:from-pink-900 dark:to-pink-800 dark:text-pink-300',
      trend: 'text-pink-600 dark:text-pink-400',
      card: 'hover:shadow-pink-200/50 border-pink-100/50 dark:hover:shadow-pink-500/10 dark:border-pink-800/50',
      glow: 'shadow-pink-500/20 dark:shadow-pink-500/10',
    },
  };

  const colors = colorClasses[color];

  return (
    <Card className={`group overflow-hidden hover:scale-[1.02] hover:shadow-xl hover:${colors.glow} transition-all duration-500 border-0 ${colors.card} relative`}>
      {/* Animated top border */}
      <div className={`h-1 bg-gradient-to-r ${colors.bg} group-hover:h-1.5 transition-all duration-300`} />

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-gradient-to-br from-foreground to-transparent pointer-events-none dark:opacity-[0.04]" />

      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
              {trend && (
                <Badge variant={trend.isPositive ? "default" : "secondary"} className="text-xs px-2 py-0">
                  {trend.isPositive ? '↗' : '↘'} {trend.value}
                </Badge>
              )}
            </div>

            <div className="mb-2">
              <h3 className="text-3xl font-bold text-foreground transition-colors mb-1 leading-none">
                {typeof value === 'number' && value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Mini progress indicator for certain metrics */}
            {(title.toLowerCase().includes('xp') || title.toLowerCase().includes('level')) && typeof value === 'number' && (
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${colors.bg} transition-all duration-1000 ease-out rounded-full`}
                    style={{ width: `${Math.min((value % 100), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Enhanced icon with gradient and animation */}
          <div className={`p-3 rounded-xl ${colors.icon} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative`}>
            <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </div>
        </div>

        {/* Floating particles effect on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity duration-500">
          <div className="w-1 h-1 bg-current rounded-full animate-ping" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-40 transition-opacity duration-700 delay-100">
          <div className="w-0.5 h-0.5 bg-current rounded-full animate-ping" />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
