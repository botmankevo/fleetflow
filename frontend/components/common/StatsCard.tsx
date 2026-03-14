import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  description?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'bg-blue-600/20',
    text: 'text-blue-400',
    border: 'border-blue-500/20'
  },
  green: {
    bg: 'bg-emerald-500/10',
    icon: 'bg-emerald-600/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20'
  },
  yellow: {
    bg: 'bg-amber-500/10',
    icon: 'bg-amber-600/20',
    text: 'text-amber-400',
    border: 'border-amber-500/20'
  },
  red: {
    bg: 'bg-rose-500/10',
    icon: 'bg-rose-600/20',
    text: 'text-rose-400',
    border: 'border-rose-500/20'
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'bg-purple-600/20',
    text: 'text-purple-400',
    border: 'border-purple-500/20'
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    icon: 'bg-indigo-600/20',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20'
  }
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = 'blue',
  loading = false,
  onClick,
  className
}: StatsCardProps) {
  const colors = colorClasses[color];

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend.direction) {
      case 'up':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'down':
        return 'text-rose-400 bg-rose-500/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-slate-900/40 backdrop-blur-sm p-6 shadow-sm transition-all',
        'hover:shadow-md hover:bg-slate-900/60 dark:border-slate-800',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        colors.border,
        className
      )}
    >
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/2" />
          <div className="h-8 bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-800 rounded w-1/3" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {title}
              </p>
              <p className="text-3xl font-bold text-white">
                {value}
              </p>
            </div>
            
            {Icon && (
              <div className={cn(
                'flex items-center justify-center w-12 h-12 rounded-xl transition-colors',
                colors.icon
              )}>
                <Icon className={cn('h-6 w-6', colors.text)} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {trend && (
              <div className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                getTrendColor()
              )}>
                {getTrendIcon()}
                <span>
                  {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
                </span>
              </div>
            )}
            
            {description && !trend && (
              <p className="text-sm text-slate-400 font-medium">
                {description}
              </p>
            )}
          </div>

          {/* Background decoration */}
          <div className={cn(
            'absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30',
            colors.bg
          )} />
        </>
      )}
    </div>
  );
}

export default StatsCard;
