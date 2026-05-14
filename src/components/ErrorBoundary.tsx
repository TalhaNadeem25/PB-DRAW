import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Warning, House, ArrowsCounterClockwise } from "@phosphor-icons/react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <Warning className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                We hit an unexpected error. Try refreshing the page or going
                back home.
              </p>
              {this.state.error && (
                <p className="text-xs font-mono bg-muted rounded p-2 text-left break-all mt-2">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => window.location.reload()}
              >
                <ArrowsCounterClockwise className="w-4 h-4 mr-2" />
                Refresh page
              </Button>
              <Button
                className="rounded-xl bg-hero-gradient text-primary-foreground"
                onClick={() => (window.location.href = "/")}
              >
                <House className="w-4 h-4 mr-2" />
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
