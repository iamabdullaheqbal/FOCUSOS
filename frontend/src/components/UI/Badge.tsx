'use client'

import React from 'react';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: "bg-success/20 text-success border-success/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    danger: "bg-danger/20 text-red-400 border-danger/30",
    info: "bg-primary/20 text-primary border-primary/30",
    neutral: "bg-white/10 text-gray-300 border-white/20",
  };

  return (
    <span className={twMerge(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
