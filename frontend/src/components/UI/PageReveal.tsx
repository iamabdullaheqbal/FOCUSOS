'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface PageRevealProps {
  children: React.ReactNode;
}

export const PageReveal: React.FC<PageRevealProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full h-full flex flex-col flex-1"
    >
      {children}
    </motion.div>
  );
};
