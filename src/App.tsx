import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { FavoritesProvider } from "./contexts/FavoritesContext";
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
import Maintenance from "./pages/Maintenance";
import Referrals from "./pages/Referrals";
import OwnerProperties from "./pages/owner/Properties";
import AddProperty from "./pages/owner/AddProperty";
import OwnerBookings from "./pages/owner/Bookings";
import OwnerTenants from "./pages/owner/Tenants";
import OwnerFinances from "./pages/owner/Finances";
import OwnerWallet from "./pages/owner/Wallet";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBookings from "./pages/admin/Bookings";
import AdminSettings from "./pages/admin/Settings";
import AdminProperties from "./pages/admin/Properties";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminPayments from "./pages/admin/Payments";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminCities from "./pages/admin/Cities";
import NotFound from "./pages/NotFound";
import HostProfile from "./pages/HostProfile";
import BottomNav from "./components/BottomNav";
import OwnerApprovalCheck from "./components/owner/OwnerApprovalCheck";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>
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
              <Route path="/maintenance" element={
                <ProtectedRoute>
                  <Maintenance />
                </ProtectedRoute>
              } />
              <Route path="/referrals" element={
                <ProtectedRoute>
                  <Referrals />
                </ProtectedRoute>
              } />
              <Route path="/owner/properties" element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerApprovalCheck>
                    <OwnerProperties />
                  </OwnerApprovalCheck>
                </ProtectedRoute>
              } />
              <Route path="/owner/properties/add" element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerApprovalCheck>
                    <AddProperty />
                  </OwnerApprovalCheck>
                </ProtectedRoute>
              } />
              <Route path="/owner/properties/edit/:id" element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerApprovalCheck>
                    <AddProperty />
                  </OwnerApprovalCheck>
                </ProtectedRoute>
              } />
              <Route path="/owner/bookings" element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerApprovalCheck>
                    <OwnerBookings />
                  </OwnerApprovalCheck>
                </ProtectedRoute>
              } />
              <Route path="/owner/tenants" element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerApprovalCheck>
                    <OwnerTenants />
                  </OwnerApprovalCheck>
                </ProtectedRoute>
              } />
              <Route path="/owner/finances" element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerApprovalCheck>
                    <OwnerFinances />
                  </OwnerApprovalCheck>
                </ProtectedRoute>
              } />
              <Route path="/owner/dashboard" element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerApprovalCheck>
                    <OwnerDashboard />
                  </OwnerApprovalCheck>
                </ProtectedRoute>
              } />
              <Route path="/owner/wallet" element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerApprovalCheck>
                    <OwnerWallet />
                  </OwnerApprovalCheck>
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
              <Route path="/admin/payments" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPayments />
                </ProtectedRoute>
              } />
              <Route path="/admin/announcements" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAnnouncements />
                </ProtectedRoute>
              } />
              <Route path="/admin/cities" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCities />
                </ProtectedRoute>
              } />
              <Route path="/host/:hostId" element={
                <ProtectedRoute>
                  <HostProfile />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
