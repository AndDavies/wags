import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function Spinner({ size = 'md', className, text }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 className={cn('text-teal-500 animate-spin', sizeClasses[size])} />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
} 