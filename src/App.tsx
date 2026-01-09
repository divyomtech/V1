import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import PropertyDetail from "./pages/PropertyDetail";
import Bookings from "./pages/Bookings";
import Favorites from "./pages/Favorites";
import RoommateMatch from "./pages/RoommateMatch";
import CompareProperties from "./pages/CompareProperties";
import Referrals from "./pages/Referrals";
import OwnerProperties from "./pages/owner/Properties";
import AddProperty from "./pages/owner/AddProperty";
import OwnerBookings from "./pages/owner/Bookings";
import OwnerTenants from "./pages/owner/Tenants";
import OwnerFinances from "./pages/owner/Finances";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBookings from "./pages/admin/Bookings";
import AdminSettings from "./pages/admin/Settings";
import AdminProperties from "./pages/admin/Properties";
import AdminAnalytics from "./pages/admin/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            } />
            <Route path="/properties/:id" element={
              <ProtectedRoute>
                <PropertyDetail />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            } />
            <Route path="/roommate-match" element={
              <ProtectedRoute>
                <RoommateMatch />
              </ProtectedRoute>
            } />
            <Route path="/compare" element={<CompareProperties />} />
            <Route path="/referrals" element={
              <ProtectedRoute>
                <Referrals />
              </ProtectedRoute>
            } />
            <Route path="/owner/properties" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerProperties />
              </ProtectedRoute>
            } />
            <Route path="/owner/properties/add" element={
              <ProtectedRoute requiredRole="owner">
                <AddProperty />
              </ProtectedRoute>
            } />
            <Route path="/owner/bookings" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerBookings />
              </ProtectedRoute>
            } />
            <Route path="/owner/tenants" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerTenants />
              </ProtectedRoute>
            } />
            <Route path="/owner/finances" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerFinances />
              </ProtectedRoute>
            } />
            <Route path="/owner/dashboard" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute requiredRole="admin">
                <AdminBookings />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requiredRole="admin">
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/properties" element={
              <ProtectedRoute requiredRole="admin">
                <AdminProperties />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute requiredRole="admin">
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
