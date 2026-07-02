'use client'

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Gracefully handle Vite chunk load errors from stale caches
    if (
      error.name === 'ChunkLoadError' ||
      error.message.includes('fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed')
    ) {
      const reloadKey = 'chunk_load_error_reloaded';
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, 'true');
        window.location.reload();
      }
    }
    return { hasError: true, error };
  }

  public componentDidMount() {
    // If the component successfully mounts, clear the rescue flag.
    // This ensures that if another deployment happens days later while the tab is still open,
    // the user will be successfully rescued again.
    sessionStorage.removeItem('chunk_load_error_reloaded');
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0a0f1d] border border-red-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Component Crashed</h2>
                <p className="text-sm text-gray-400 mb-6">
                  {this.state.error?.message || "An unexpected rendering error occurred."}
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-gray-100 rounded-xl font-bold transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
