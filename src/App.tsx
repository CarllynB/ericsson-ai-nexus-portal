
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
import TalkToNova from "./pages/TalkToNova";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  console.log('🔄 AppRoutes rendering...');
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
      <Route 
        path="/talk-to-nova" 
        element={
          <Layout>
            <TalkToNova />
          </Layout>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  console.log('🚀 App component rendering...');
  
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
