import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from './button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'error' | 'warning';
}

export function ErrorBanner({ 
  message, 
  onRetry, 
  onDismiss,
  variant = 'error' 
}: ErrorBannerProps) {
  const bgColor = variant === 'error' ? 'bg-destructive/10' : 'bg-warning/10';
  const textColor = variant === 'error' ? 'text-destructive' : 'text-warning-foreground';
  const borderColor = variant === 'error' ? 'border-destructive/20' : 'border-warning/20';
  
  return (
    <div className={`${bgColor} ${textColor} border ${borderColor} rounded-lg p-4 flex items-start gap-3`}>
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      
      <div className="flex items-center gap-2">
        {onRetry && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRetry}
            className="h-8"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        )}
        
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
