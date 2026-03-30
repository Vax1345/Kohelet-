import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'אירעה שגיאה בלתי צפויה באפליקציה.';
      let isPermissionError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && (parsed.error.includes('permission') || parsed.error.includes('insufficient'))) {
            isPermissionError = true;
            errorMessage = 'אין לך הרשאות מספיקות לביצוע פעולה זו. וודא שאתה מחובר ושיש לך הרשאות מתאימות.';
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-parchment flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-accent mb-4">אופס, משהו השתבש</h1>
            <p className="text-ink/60 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-bold hover:bg-accent/90 transition-all mx-auto shadow-lg shadow-accent/20"
            >
              <RefreshCw className="w-4 h-4" />
              נסו שוב
            </button>
            {isPermissionError && (
              <p className="mt-6 text-[10px] text-ink/30 font-classic uppercase tracking-widest">
                שגיאת הרשאות Firestore
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
