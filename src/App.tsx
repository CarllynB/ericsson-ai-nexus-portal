
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Agents from "./pages/Agents";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { populateDefaultAgents, clearAllCachedAgents } from "./utils/populateAgents";
import { clearAllAgents } from "./utils/clearDatabase";

const queryClient = new QueryClient();

// Initialize app with completely clean state
const initializeApp = async () => {
  console.log('🚀 App initializing - clearing ALL cached data...');
  
  // Clear any cached agent data first
  clearAllCachedAgents();
  
  // CRITICAL: Clear the existing SQLite database completely
  console.log('🧹 CRITICAL: Clearing existing SQLite database...');
  const cleared = await clearAllAgents();
  
  if (cleared) {
    console.log('✅ SUCCESS: Database cleared completely');
  } else {
    console.error('❌ FAILED: Could not clear database - manual intervention needed');
  }
  
  // Initialize empty SQLite database
  await populateDefaultAgents();
  
  console.log('✅ App initialized with completely clean state');
};

// Run initialization
initializeApp().catch(error => {
  console.error('❌ Failed to initialize app:', error);
});

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* All routes are now publicly accessible */}
      <Route 
        path="/" 
        element={
          <Layout>
            <Index />
          </Layout>
        } 
      />
      <Route 
        path="/agents" 
        element={
          <Layout>
            <Agents />
          </Layout>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <Layout>
            <Dashboard />
          </Layout>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
