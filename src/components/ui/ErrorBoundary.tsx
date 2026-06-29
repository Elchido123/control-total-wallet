"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="bg-surface rounded-2xl border border-border p-6 max-w-sm text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-white font-bold text-lg mb-2">
              Algo salió mal
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              {this.state.error?.message ?? "Error inesperado"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
