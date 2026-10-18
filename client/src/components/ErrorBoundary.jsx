import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-[#0A142F]">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center text-2xl font-bold mb-4 border border-rose-200">
              ⚠️
            </div>
            <h2 className="text-xl font-heading font-black text-[#0A142F]">Application Interface Error</h2>
            <p className="text-xs text-slate-500 mt-2">
              A component rendering exception occurred. Details below:
            </p>
            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs font-mono text-rose-700 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap">
              {this.state.error?.stack || this.state.error?.toString() || 'Unknown error occurred'}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary text-xs px-5 py-2.5 font-bold"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('drivo_auth_token');
                  localStorage.removeItem('drivo_user');
                  window.location.href = '/admin';
                }}
                className="btn-outline text-xs px-4 py-2.5 text-slate-700"
              >
                Reset Cache & Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
