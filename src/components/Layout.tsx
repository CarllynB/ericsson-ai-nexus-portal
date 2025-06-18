import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInModal } from "@/components/SignInModal";

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Ericsson Logo Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">E</span>
              </div>
              <span className="font-semibold text-foreground">Ericsson</span>
            </Button>
            <h1 className="text-xl font-bold text-foreground">AI-DU Portal</h1>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSignInOpen(true)}
            className="flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">E</span>
            </div>
            <div>
              <h2 className="font-bold text-foreground">Ericsson</h2>
              <p className="text-sm text-muted-foreground">AI-DU Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-6 space-y-2">
          <a
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="font-medium">Home</span>
          </a>
          <a
            href="/agents"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="font-medium">Agents</span>
          </a>
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="font-medium">Dashboard</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-20">
        <Outlet />
      </main>

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
};