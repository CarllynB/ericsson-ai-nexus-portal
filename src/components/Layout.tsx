import { useState } from "react";
import { X, LogIn, Settings, Shield, UserPlus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInModal } from "@/components/SignInModal";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { AgentManagement } from "@/components/AgentManagement";
import { RoleManagement } from "@/components/RoleManagement";
import { SidebarManagement } from "@/components/SidebarManagement";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSidebarItems } from "@/hooks/useSidebarItems";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [roleManagementOpen, setRoleManagementOpen] = useState(false);
  const [agentManagementOpen, setAgentManagementOpen] = useState(false);
  const [sidebarManagementOpen, setSidebarManagementOpen] = useState(false);
  const { currentUserRole, loading: rolesLoading } = useRoles();
  const { user, loading: authLoading } = useAuth();
  const { items } = useSidebarItems();

  const handleNavigation = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
    setSidebarOpen(false);
  };

  // Don't show admin panels if loading or not authenticated
  const isAuthenticated = !!user && !authLoading;
  const isAdmin = isAuthenticated && !rolesLoading && (currentUserRole === 'admin' || currentUserRole === 'super_admin');
  const isSuperAdmin = isAuthenticated && !rolesLoading && currentUserRole === 'super_admin';

  // Show all sidebar items to all users - no filtering
  const filteredItems = items;

  console.log('Layout debug:', { 
    user: !!user, 
    authLoading, 
    rolesLoading, 
    currentUserRole, 
    isAuthenticated, 
    isAdmin, 
    isSuperAdmin 
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center hover:bg-primary/10"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <img 
                  src="/lovable-uploads/ead09f29-c601-44f5-8578-508b00189e3e.png" 
                  alt="Menu" 
                  className="w-5 h-5 object-contain"
                />
              </div>
            </Button>
            <button 
              onClick={() => window.location.href = '/'}
              className="text-xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              AI-DU Agent Portal
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <UserProfileMenu email={user.email} />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSignInOpen(true)}
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </div>
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
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/lovable-uploads/a0c9376e-fd07-4f06-aae2-04764228ec6e.png" 
                alt="Ericsson Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI-DU Agent Portal</p>
              {isAuthenticated && currentUserRole && (
                <p className="text-xs text-primary font-medium">
                  {currentUserRole.replace('_', ' ').toUpperCase()}
                </p>
              )}
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
          {/* Dynamic Sidebar Items - No external link icons */}
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.url)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="font-medium">{item.title}</span>
            </button>
          ))}

          {/* Admin Section - Only show for admin (not super admin) */}
          {isAdmin && currentUserRole === 'admin' && (
            <div className="pt-4 border-t border-border">
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin Panel
                </p>
              </div>
              
              <Dialog open={agentManagementOpen} onOpenChange={setAgentManagementOpen}>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left">
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Manage Agents</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Agent Management</DialogTitle>
                  </DialogHeader>
                  <AgentManagement />
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Super Admin Section - Only show for super admin */}
          {isSuperAdmin && (
            <div className="pt-4 border-t border-border">
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Super Admin
                </p>
              </div>

              <Dialog open={agentManagementOpen} onOpenChange={setAgentManagementOpen}>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left">
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Manage Agents</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Agent Management</DialogTitle>
                  </DialogHeader>
                  <AgentManagement />
                </DialogContent>
              </Dialog>

              <Dialog open={roleManagementOpen} onOpenChange={setRoleManagementOpen}>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Manage Roles</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Role Management</DialogTitle>
                  </DialogHeader>
                  <RoleManagement />
                </DialogContent>
              </Dialog>

              <Dialog open={sidebarManagementOpen} onOpenChange={setSidebarManagementOpen}>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left">
                    <Menu className="w-4 h-4" />
                    <span className="font-medium">Manage Sidebar</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Sidebar Management</DialogTitle>
                  </DialogHeader>
                  <SidebarManagement />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
};
