import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Home, Calendar, User, MapPin } from "lucide-react";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isActive = (path: string) => location.pathname === path;

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
    <div className="min-h-screen flex flex-col pb-16">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold">StaySecure PG</h1>
        </div>

        {/* Welcome Section */}
        <div className="px-4 py-6 border-b border-border">
          <h2 className="text-2xl font-bold mb-1">Welcome back, {profile?.name || 'Guest'}!</h2>
          <p className="text-muted-foreground text-sm">Find your perfect PG</p>
        </div>

        {/* Recent Bookings */}
        <div className="px-4 py-4">
          <h3 className="font-semibold text-lg mb-4">Recent Bookings</h3>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : bookings.length === 0 ? (
            <Card className="text-center py-12">
              <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No bookings yet</p>
              <Button onClick={() => navigate('/search')} size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search for PGs
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking: any) => (
                <Card key={booking.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Home className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold">{booking.properties?.title}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.properties?.city}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'requested' ? 'bg-accent text-accent-foreground' :
                      booking.status === 'accepted' ? 'bg-primary/10 text-primary' :
                      booking.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation - Instagram Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center w-full h-full transition-colors"
          >
            <Home 
              className={`h-6 w-6 ${isActive('/') ? 'text-foreground' : 'text-muted-foreground'}`}
              fill={isActive('/') ? 'currentColor' : 'none'}
            />
          </button>
          
          <button
            onClick={() => navigate('/search')}
            className="flex flex-col items-center justify-center w-full h-full transition-colors"
          >
            <Search 
              className={`h-6 w-6 ${isActive('/search') ? 'text-foreground' : 'text-muted-foreground'}`}
            />
          </button>
          
          <button
            onClick={() => navigate('/bookings')}
            className="flex flex-col items-center justify-center w-full h-full transition-colors"
          >
            <Calendar 
              className={`h-6 w-6 ${isActive('/bookings') ? 'text-foreground' : 'text-muted-foreground'}`}
              fill={isActive('/bookings') ? 'currentColor' : 'none'}
            />
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center w-full h-full transition-colors"
          >
            <User 
              className={`h-6 w-6 ${isActive('/profile') ? 'text-foreground' : 'text-muted-foreground'}`}
              fill={isActive('/profile') ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </nav>
    </div>
  );
};

export default CustomerDashboard;
