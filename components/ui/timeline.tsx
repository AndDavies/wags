'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step?: number;
}

export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          orientation === 'horizontal' ? 'flex' : 'block',
          className
        )}
        {...props}
      />
    );
  }
);
Timeline.displayName = 'Timeline';

export const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, step, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative pb-8 last:pb-0',
          'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[1px] before:bg-muted last:before:hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TimelineItem.displayName = 'TimelineItem'; 