'use client'

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse bg-white/10 rounded-xl border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)] ${className}`}
    />
  );
};
