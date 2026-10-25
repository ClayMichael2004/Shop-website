import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-3xl p-8 shadow-xl text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center mb-5 text-[#e67e22]">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong</h2>
            <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
              An unexpected error occurred while rendering this view. You can reload the page or return to the main storefront.
            </p>
            {this.state.error?.message && (
              <div className="mb-6 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-left">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Details</span>
                <code className="text-xs text-red-600 font-mono break-all">{this.state.error.message}</code>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#18181b] hover:bg-neutral-800 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 transition-all border border-neutral-300 shadow-sm"
              >
                <Home className="w-4 h-4 text-neutral-700" />
                <span>Storefront</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
