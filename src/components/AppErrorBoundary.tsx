import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { failed: boolean }

class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Avoid including user data in browser logs. A production monitoring SDK
    // can consume this boundary once its DSN and privacy settings are approved.
    console.error("Application render failed", { name: error.name, componentStack: info.componentStack });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-screen grid place-items-center bg-background px-6">
        <section className="ks-card max-w-lg p-8 text-center" role="alert">
          <h1 className="text-2xl font-bold mb-3">Diese Seite konnte nicht geladen werden</h1>
          <p className="text-muted-foreground mb-6">
            Ihre Eingaben wurden nicht übermittelt. Laden Sie die Seite erneut oder kehren Sie zur Startseite zurück.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Button onClick={() => window.location.reload()}>Erneut versuchen</Button>
            <Button variant="outline" asChild><a href="/">Zur Startseite</a></Button>
          </div>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
