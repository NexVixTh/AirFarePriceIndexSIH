import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('[ErrorBoundary caught an unhandled error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-gov-surface border border-red-900/50 rounded-lg p-6 text-center text-slate-300 space-y-3 my-4">
          <div className="inline-flex p-3 bg-red-950/60 rounded-full border border-red-800/40 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-white text-base">
            {this.props.fallbackTitle || 'Statistical Component Error'}
          </h3>
          <p className="text-xs text-gov-muted max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected rendering error occurred. The statistical engine is continuing to operate safely.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gov-card border border-gov-border rounded text-xs text-slate-200 hover:text-white hover:bg-gov-border transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Rendering</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
