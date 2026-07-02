'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AppBackground } from './AppBackground';

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen relative overflow-hidden bg-[#020617] text-white font-sans selection:bg-primary/30">
      <AppBackground />
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen z-10 relative">
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
