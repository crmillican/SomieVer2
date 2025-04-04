import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { useLocation } from "wouter";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to your preferred error tracking service here
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
          <Alert variant="destructive" className="max-w-2xl">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-xl mb-2">Something went wrong</AlertTitle>
            <AlertDescription>
              <div className="space-y-4">
                <div className="text-sm opacity-90">
                  {this.state.error?.message || "An unexpected error occurred"}
                </div>

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <div className="mt-4">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium">Stack trace</summary>
                      <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="default"
                    onClick={() => window.location.reload()}
                    className="gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reload page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      this.handleReset();
                      window.location.href = '/';
                    }}
                    className="gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Back to home
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}