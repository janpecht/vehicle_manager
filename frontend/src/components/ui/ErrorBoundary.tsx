import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from './Button.tsx';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Etwas ist schiefgelaufen</h1>
            <p className="mb-6 text-gray-600">Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.</p>
            <Button onClick={() => window.location.reload()}>Seite neu laden</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
