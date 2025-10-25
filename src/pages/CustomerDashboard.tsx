import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Home, Calendar, User, MapPin } from "lucide-react";

const cities = [
  { 
    name: "Bangalore", 
    areas: ["Koramangala", "HSR Layout", "Indiranagar", "Whitefield", "Electronic City", "BTM Layout"]
  },
  { 
    name: "Hyderabad", 
    areas: ["HITEC City", "Gachibowli", "Madhapur", "Banjara Hills", "Kondapur", "Kukatpally"]
  },
  { 
    name: "Mumbai", 
    areas: ["Andheri", "Powai", "Borivali", "Thane", "Bandra", "Goregaon"]
  },
  { 
    name: "Delhi", 
    areas: ["Connaught Place", "Dwarka", "Rohini", "Saket", "Lajpat Nagar", "Karol Bagh"]
  },
  { 
    name: "Chennai", 
    areas: ["OMR", "Anna Nagar", "T Nagar", "Velachery", "Tambaram", "Adyar"]
  }
];

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);

  const isActive = (path: string) => location.pathname === path;
  
  const selectedCityData = cities.find(c => c.name === selectedCity);

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

  const fetchPropertiesByLocation = async (city: string, area?: string) => {
    try {
      let query = supabase.from('properties').select('*').eq('city', city);
      
      if (area) {
        query = query.ilike('address', `%${area}%`);
      }
      
      const { data } = await query.limit(10);
      if (data) setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleCityClick = (cityName: string) => {
    if (selectedCity === cityName) {
      setSelectedCity(null);
      setSelectedArea(null);
      setProperties([]);
    } else {
      setSelectedCity(cityName);
      setSelectedArea(null);
      fetchPropertiesByLocation(cityName);
    }
  };

  const handleAreaClick = (areaName: string) => {
    setSelectedArea(areaName);
    if (selectedCity) {
      fetchPropertiesByLocation(selectedCity, areaName);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header Section */}
        <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold">StaySecure PG</h1>
        </div>

        {/* Cities Stories Section */}
        <div className="sticky top-[53px] z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {cities.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCityClick(city.name)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  selectedCity === city.name 
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' 
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}>
                  {city.name.slice(0, 3).toUpperCase()}
                </div>
                <span className="text-xs font-medium">{city.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sub-locations Section */}
        {selectedCity && selectedCityData && (
          <div className="px-4 py-3 bg-accent/30 border-b border-border">
            <h3 className="font-semibold mb-2">{selectedCity}</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {selectedCityData.areas.map((area) => (
                <button
                  key={area}
                  onClick={() => handleAreaClick(area)}
                  className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all ${
                    selectedArea === area
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Properties Section */}
        {properties.length > 0 && (
          <div className="px-4 py-4">
            <h3 className="font-semibold text-lg mb-4">
              Available PGs {selectedArea && `in ${selectedArea}`}
            </h3>
            <div className="grid gap-3">
              {properties.map((property) => (
                <Card 
                  key={property.id} 
                  className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/properties/${property.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{property.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.city}
                      </p>
                      <p className="text-primary font-semibold mt-1">₹{property.price}/month</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Welcome Section - only show when no city selected */}
        {!selectedCity && (
          <div className="px-4 py-6 border-b border-border">
            <h2 className="text-2xl font-bold mb-1">Welcome back, {profile?.name || 'Guest'}!</h2>
            <p className="text-muted-foreground text-sm">Find your perfect PG</p>
          </div>
        )}

        {/* Recent Bookings - only show when no city selected */}
        {!selectedCity && (
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
        )}
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
