import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and store in state
    console.error('Three.js Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Optionally send error to reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-lg border border-zinc-700">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            3D Rendering Error
          </h3>
          <p className="text-zinc-400 text-center mb-4">
            {this.props.errorMessage ||
              "The 3D viewer encountered an error. Please try refreshing the page."}
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-zinc-800 rounded border border-zinc-700">
              <summary className="text-amber-400 cursor-pointer mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs text-zinc-300 overflow-auto max-h-40 bg-zinc-900 p-2 rounded border border-zinc-700">
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
