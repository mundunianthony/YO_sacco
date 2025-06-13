import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMembers from "./pages/AdminMembers";
import AdminLoans from "./pages/AdminLoans";
import AdminNotifications from "./pages/AdminNotifications";
import MemberDashboard from "./pages/MemberDashboard";
import MemberSavings from "./pages/MemberSavings";
import MemberLoans from "./pages/MemberLoans";
import MemberProfile from "./pages/MemberProfile";
import MemberNotifications from "./pages/MemberNotifications";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/members" element={<AdminMembers />} />
          <Route path="/admin/loans" element={<AdminLoans />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/member-dashboard" element={<MemberDashboard />} />
          <Route path="/member/savings" element={<MemberSavings />} />
          <Route path="/member/loans" element={<MemberLoans />} />
          <Route path="/member/profile" element={<MemberProfile />} />
          <Route path="/member/notifications" element={<MemberNotifications />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
