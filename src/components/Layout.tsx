import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User2, Settings, Plus, Bot } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebarItems } from "@/hooks/useSidebarItems";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const { currentUserRole, isSuperAdmin } = useRoles();
  const location = useLocation();
  const { items } = useSidebarItems();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar className="md:w-64 flex-none border-r">
          <SidebarHeader className="m-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">AI-DU Agent Portal</h1>
              <SidebarTrigger />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <Link to="/" className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/agents"}>
                  <Link to="/agents" className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2Z" />
                      <path d="m12 8 4 4-4 4" />
                      <path d="M8 12h8" />
                    </svg>
                    <span>Agents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {currentUserRole === 'admin' || currentUserRole === 'super_admin' ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === "/dashboard"}>
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <rect width="7" height="9" x="3" y="3" rx="1" />
                        <rect width="7" height="5" x="14" y="3" rx="1" />
                        <rect width="7" height="7" x="14" y="14" rx="1" />
                        <rect width="7" height="9" x="3" y="12" rx="1" />
                      </svg>
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}

              {items.map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
            {isSuperAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/talk-to-nova"}>
                  <Link to="/talk-to-nova" className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span>Talk to NOVA</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            
            </SidebarGroup>
          </SidebarContent>

          <div className="p-4">
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex h-8 w-full items-center justify-between rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image} alt={user?.name || "Avatar"} />
                      <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user?.name}</span>
                  </div>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <User2 className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Sidebar>

        <div className="flex-1">
          <main className="container relative py-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
