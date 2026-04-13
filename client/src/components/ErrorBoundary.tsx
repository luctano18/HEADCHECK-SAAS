import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global ErrorBoundary with auto-recovery from DOM mutation errors.
 *
 * Browser extensions (Google Translate, Grammarly, etc.) modify the DOM
 * directly, causing React's "removeChild: not a child of this node" errors.
 * This boundary detects those errors and automatically remounts the subtree
 * (up to 3 times) before showing a manual fallback UI.
 */
class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Auto-recover from DOM mutation errors caused by browser extensions
    const isDomMutationError =
      error.message?.includes("removeChild") ||
      error.message?.includes("insertBefore") ||
      error.message?.includes("not a child") ||
      error.message?.includes("Failed to execute") ||
      error.message?.includes("The node to be removed");

    if (isDomMutationError && this.retryCount < this.maxRetries) {
      this.retryCount++;
      // Remount on next tick to let React flush
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 150);
    } else {
      // Log non-recoverable errors
      console.error("[ErrorBoundary] Error caught:", error.message, info.componentStack?.slice(0, 300));
    }
  }

  render() {
    if (this.state.hasError) {
      // Still recovering (auto-retry in progress) — render nothing briefly
      if (this.retryCount < this.maxRetries) {
        return null;
      }

      // Exhausted retries — show manual fallback
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
              This may be caused by a browser extension (auto-translator, spell checker, etc.).
              Try disabling your extensions or opening a private/incognito window.
            </p>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6 max-h-40">
              <pre className="text-xs text-muted-foreground whitespace-break-spaces">
                {this.state.error?.message}
              </pre>
            </div>

            <button
              onClick={() => {
                this.retryCount = 0;
                this.setState({ hasError: false, error: null });
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
