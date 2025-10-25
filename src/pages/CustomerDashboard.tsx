import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Home, Calendar, User, MapPin, Heart } from "lucide-react";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user?.id).single(),
        supabase.from('bookings').select('*, properties(title, city)').eq('customer_id', user?.id).order('created_at', { ascending: false }).limit(3)
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
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
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name || 'Guest'}!</h1>
          <p className="text-muted-foreground">Find your perfect PG and manage your bookings</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/search')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Search className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">Search PGs</h3>
              <p className="text-sm text-muted-foreground text-center">Find your next home</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/bookings')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">My Bookings</h3>
              <p className="text-sm text-muted-foreground text-center">{bookings.length} active</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/profile')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <User className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">My Profile</h3>
              <p className="text-sm text-muted-foreground text-center">Update your info</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Heart className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold">Favorites</h3>
              <p className="text-sm text-muted-foreground text-center">Saved properties</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Bookings</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No bookings yet</p>
                <Button onClick={() => navigate('/search')}>
                  <Search className="h-4 w-4 mr-2" />
                  Search for PGs
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Home className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold">{booking.properties?.title}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.properties?.city}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status}
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

export default CustomerDashboard;
