import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Calendar, Plus, IndianRupee, TrendingUp, User, FileText, MessageSquare, CreditCard, Settings } from "lucide-react";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeBookings: 0,
    pendingRequests: 0,
    monthlyRevenue: 0,
    totalTenants: 0,
    pendingPayments: 0
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [propertiesRes, bookingsRes, profileRes] = await Promise.all([
        supabase.from('properties').select('*').eq('owner_id', user?.id),
        supabase.from('bookings').select('*, properties!inner(owner_id)').eq('properties.owner_id', user?.id),
        supabase.from('profiles').select('*').eq('id', user?.id).single()
      ]);

      if (propertiesRes.data) {
        setProperties(propertiesRes.data);
        setStats(prev => ({ ...prev, totalProperties: propertiesRes.data.length }));
      }

      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      if (bookingsRes.data) {
        const activeBookings = bookingsRes.data.filter((b: any) => 
          b.status === 'accepted' || b.status === 'paid' || b.status === 'checked-in' || b.status === 'active'
        );
        const pendingRequests = bookingsRes.data.filter((b: any) => b.status === 'requested');
        const totalTenants = bookingsRes.data.filter((b: any) => 
          b.status === 'checked-in' || b.status === 'active'
        ).length;
        const pendingPayments = bookingsRes.data.filter((b: any) => 
          b.payment_status === 'pending'
        ).length;
        
        const monthlyRevenue = bookingsRes.data
          .filter((b: any) => b.status === 'active' || b.status === 'checked-in')
          .reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

        setStats(prev => ({
          ...prev,
          activeBookings: activeBookings.length,
          pendingRequests: pendingRequests.length,
          monthlyRevenue,
          totalTenants,
          pendingPayments
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
            <p className="text-muted-foreground">Manage your properties, bookings, and tenants</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/profile')}>
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Button>
        </div>

        {/* Profile Status Banner */}
        {profile && profile.profile_verification_status === 'pending' && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">Profile Verification Pending</p>
                  <p className="text-sm text-orange-700">Complete your profile verification to start receiving bookings</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate('/profile')}>
                  Complete Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Properties</p>
                  <p className="text-2xl font-bold">{stats.totalProperties}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tenants</p>
                  <p className="text-2xl font-bold">{stats.totalTenants}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Bookings</p>
                  <p className="text-2xl font-bold">{stats.activeBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/properties/add')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Plus className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Add Property</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/properties')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Building2 className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Properties</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/bookings')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Bookings</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/profile')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <User className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Profile</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/payouts')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <CreditCard className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Payouts</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/support')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <MessageSquare className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Support</h3>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Properties</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/owner/properties')}>View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : properties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No properties listed yet</p>
                <Button onClick={() => navigate('/owner/properties/add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {properties.slice(0, 3).map((property: any) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold">{property.title}</h4>
                        <p className="text-sm text-muted-foreground">{property.city} • {property.locality}</p>
                      </div>
                    </div>
                  <div className="text-right">
                      <p className="font-semibold flex items-center gap-1 justify-end">
                        <IndianRupee className="h-4 w-4" />
                        {property.monthly_rent?.toLocaleString() || 0}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default OwnerDashboard;
