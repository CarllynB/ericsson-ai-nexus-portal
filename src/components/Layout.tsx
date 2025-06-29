
import { useState, useEffect, ReactNode } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Bot, Home, BarChart3, Users, Settings, LogOut, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { SignInModal } from "@/components/SignInModal";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useSidebarItems } from "@/hooks/useSidebarItems";
import { useToast } from "@/components/ui/use-toast";

interface NovaSettings {
  available_to_all: boolean;
  is_live: boolean;
}

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSignIn, setShowSignIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [novaSettings, setNovaSettings] = useState<NovaSettings | null>(null);
  const { items: customSidebarItems } = useSidebarItems();
  const { toast } = useToast();

  // Fetch NOVA settings to determine visibility
  useEffect(() => {
    const fetchNovaSettings = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/nova/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setNovaSettings({
            available_to_all: data.available_to_all,
            is_live: data.is_live
          });
        }
      } catch (error) {
        console.error('Failed to fetch NOVA settings:', error);
        // Default to not showing NOVA if we can't fetch settings
        setNovaSettings({
          available_to_all: false,
          is_live: false
        });
      }
    };

    fetchNovaSettings();
  }, [user]);

  const defaultSidebarItems = [
    { id: "home", title: "Home", url: "/", icon: Home },
    { id: "agents", title: "Agents", url: "/agents", icon: Bot },
    { id: "dashboard", title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  ];

  // Add NOVA to sidebar if user has access
  const sidebarItemsWithNova = [...defaultSidebarItems];
  
  if (user && novaSettings) {
    const userCanAccessNova = novaSettings.available_to_all || user.role === 'super_admin';
    
    if (userCanAccessNova) {
      sidebarItemsWithNova.push({
        id: "nova", 
        title: "Talk to NOVA", 
        url: "/talk-to-nova", 
        icon: Bot
      });
    }
  }

  // Add management items for admins
  if (user?.role === 'super_admin') {
    sidebarItemsWithNova.push(
      { id: "roles", title: "Role Management", url: "/roles", icon: Users },
      { id: "settings", title: "Settings", url: "/settings", icon: Settings }
    );
  }

  // Combine with custom sidebar items
  const allSidebarItems = [
    ...sidebarItemsWithNova,
    ...customSidebarItems.map(item => ({
      ...item,
      icon: item.url.startsWith('http') ? undefined : Home,
      isExternal: item.url.startsWith('http')
    }))
  ];

  const handleSignOut = () => {
    logout();
    navigate('/');
    toast({
      title: "Signed out successfully",
      description: "You have been signed out of your account."
    });
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const renderSidebarLink = (item: any) => {
    const isActiveLink = isActive(item.url);
    const Icon = item.icon;
    
    if (item.isExternal) {
      return (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <span>{item.title}</span>
        </a>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.url}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActiveLink
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        {Icon && <Icon className="w-5 h-5" />}
        <span>{item.title}</span>
      </Link>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI-DU Portal</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Your gateway to GenAI agents and data insights
            </p>
            <Button onClick={() => setShowSignIn(true)} size="lg">
              Sign In to Continue
            </Button>
          </div>
        </div>
        <SignInModal 
          open={showSignIn} 
          onOpenChange={setShowSignIn} 
        />
        <OfflineIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-primary" />
          <span className="font-semibold">AI-DU Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <UserProfileMenu email={user.email || ''} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
          <Card className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-semibold">AI-DU Portal</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="flex-1 p-4">
              <div className="space-y-1">
                {allSidebarItems.map(renderSidebarLink)}
              </div>
            </nav>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <Card className="flex-1 m-2 flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <Bot className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="font-semibold">AI-DU Portal</h2>
                  <p className="text-sm text-muted-foreground">
                    Welcome, {user.email}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4">
              <div className="space-y-1">
                {allSidebarItems.map(renderSidebarLink)}
              </div>
            </nav>

            <div className="p-4 border-t">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <UserProfileMenu email={user.email || ''} />
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <main className="min-h-screen">
            {children || <Outlet />}
          </main>
        </div>
      </div>
      
      <OfflineIndicator />
    </div>
  );
};

export default Layout;
