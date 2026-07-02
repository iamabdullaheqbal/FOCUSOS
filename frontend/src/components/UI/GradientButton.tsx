'use client'

import React from 'react';
import { twMerge } from 'tailwind-merge';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const GradientButton: React.FC<GradientButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  ...props 
}) => {
  
  const baseStyles = "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none overflow-hidden";
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variants = {
    primary: "text-white bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/25 hover:shadow-primary/40",
    secondary: "text-white bg-gradient-to-r from-secondary to-purple-600 shadow-lg shadow-secondary/25 hover:shadow-secondary/40",
    danger: "text-white bg-gradient-to-r from-danger to-rose-600 shadow-lg shadow-danger/25 hover:shadow-danger/40",
    outline: "text-white border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md",
  };

  return (
    <button 
      className={twMerge(baseStyles, sizes[size], variants[variant], className)}
      {...props}
    >
      {/* Glossy overlay effect */}
      <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity"></span>
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  );
};
