import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in BleuStream UI:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      localStorage.removeItem('flixstream_settings');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141414] text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#181818] border border-zinc-800 rounded-2xl p-6 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black font-bebas tracking-wide text-white">
                Something went wrong
              </h2>
              <p className="text-xs text-zinc-400">
                A temporary glitch occurred while loading cinema streams. Tap below to reload the application.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-[#0ea5e9] hover:bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload BleuStream</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
