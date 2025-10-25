import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Calendar, Plus, IndianRupee, TrendingUp } from "lucide-react";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeBookings: 0,
    pendingRequests: 0,
    monthlyRevenue: 0
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [propertiesRes, bookingsRes] = await Promise.all([
        supabase.from('properties').select('*').eq('owner_id', user?.id),
        supabase.from('bookings').select('*, properties!inner(owner_id)').eq('properties.owner_id', user?.id)
      ]);

      if (propertiesRes.data) {
        setProperties(propertiesRes.data);
        setStats(prev => ({ ...prev, totalProperties: propertiesRes.data.length }));
      }

      if (bookingsRes.data) {
        const activeBookings = bookingsRes.data.filter((b: any) => b.status === 'accepted' || b.status === 'requested');
        const pendingRequests = bookingsRes.data.filter((b: any) => b.status === 'requested');
        const monthlyRevenue = bookingsRes.data
          .filter((b: any) => b.status === 'accepted')
          .reduce((sum: number, b: any) => sum + (b.monthly_rent || 0), 0);

        setStats(prev => ({
          ...prev,
          activeBookings: activeBookings.length,
          pendingRequests: pendingRequests.length,
          monthlyRevenue
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
          <p className="text-muted-foreground">Manage your properties, bookings, and tenants</p>
        </div>

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
                  <p className="text-sm text-muted-foreground">Active Bookings</p>
                  <p className="text-2xl font-bold">{stats.activeBookings}</p>
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
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/properties/add')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Plus className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">Add Property</h3>
              <p className="text-sm text-muted-foreground text-center">List a new PG</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/properties')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Building2 className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">My Properties</h3>
              <p className="text-sm text-muted-foreground text-center">Manage listings</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/bookings')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">Bookings</h3>
              <p className="text-sm text-muted-foreground text-center">Handle requests</p>
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
                      <p className="font-semibold flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {property.monthly_rent.toLocaleString()}
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
