import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/** Last-resort boundary so an unexpected render error never leaves a blank page. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Details stay in the console for developers; the UI shows a generic message only.
    console.error('Unhandled UI error', { message: error.message, componentStack: info.componentStack });
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="state state--error" role="alert">
          <span>Something went wrong displaying the dashboard.</span>
          <button type="button" className="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
