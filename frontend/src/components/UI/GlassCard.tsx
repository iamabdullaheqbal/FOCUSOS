'use client'

import React from 'react';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = React.memo(({ children, className, gradient, ...props }) => {
  return (
    <div
      className={twMerge(
        "glass-card p-6",
        gradient ? "gradient-border" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

GlassCard.displayName = 'GlassCard';
