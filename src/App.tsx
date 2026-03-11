import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import DataSync from "@/components/DataSync";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Services from "./pages/Services";
import Schedule from "./pages/Schedule";
import Payments from "./pages/Payments";
import Bills from "./pages/Bills";
import Clients from "./pages/Clients";
import CostCalculator from "./pages/CostCalculator";
import Barbers from "./pages/Barbers";
import Trash from "./pages/Trash";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/products" element={<Products />} />
        <Route path="/services" element={<Services />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/barbers" element={<Barbers />} />
        <Route path="/calculator" element={<CostCalculator />} />
        <Route path="/trash" element={<Trash />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AuthRoute = () => {
  const { user, isReady } = useAuth();
  if (!isReady) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataSync />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
