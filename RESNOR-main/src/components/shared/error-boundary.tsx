'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/shared/glass-card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RESNOR Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <GlassCard className="flex flex-col items-center justify-center py-16 mx-auto max-w-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-400/10 mb-4">
            <AlertCircle className="h-7 w-7 text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
            We encountered an unexpected error. This has been logged and our team will look into it. You can try refreshing the page.
          </p>
          {this.state.error && (
            <p className="text-xs text-muted-foreground/60 mb-4 font-mono bg-white/[0.03] rounded-lg px-3 py-2 max-w-sm truncate">
              {this.state.error.message}
            </p>
          )}
          <Button onClick={this.handleReset} className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/20">
            <RefreshCw className="mr-2 h-4 w-4" />Try Again
          </Button>
        </GlassCard>
      );
    }

    return this.props.children;
  }
}
