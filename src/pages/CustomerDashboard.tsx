import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Search, Home, Calendar, User, MapPin, Plus, Menu, Phone, Flag, HelpCircle, Settings, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import bangaloreImg from "@/assets/cities/bangalore.jpg";
import hyderabadImg from "@/assets/cities/hyderabad.jpg";
import mumbaiImg from "@/assets/cities/mumbai.jpg";
import delhiImg from "@/assets/cities/delhi.jpg";
import chennaiImg from "@/assets/cities/chennai.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const cities = [
  { 
    name: "Bangalore", 
    areas: ["Koramangala", "HSR Layout", "Indiranagar", "Whitefield", "Electronic City", "BTM Layout"],
    image: bangaloreImg
  },
  { 
    name: "Hyderabad", 
    areas: ["HITEC City", "Gachibowli", "Madhapur", "Banjara Hills", "Kondapur", "Kukatpally"],
    image: hyderabadImg
  },
  { 
    name: "Mumbai", 
    areas: ["Andheri", "Powai", "Borivali", "Thane", "Bandra", "Goregaon"],
    image: mumbaiImg
  },
  { 
    name: "Delhi", 
    areas: ["Connaught Place", "Dwarka", "Rohini", "Saket", "Lajpat Nagar", "Karol Bagh"],
    image: delhiImg
  },
  { 
    name: "Chennai", 
    areas: ["OMR", "Anna Nagar", "T Nagar", "Velachery", "Tambaram", "Adyar"],
    image: chennaiImg
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
  const [newCityName, setNewCityName] = useState("");

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

  const handleSuggestCity = () => {
    if (newCityName.trim()) {
      toast.success(`Thank you! We'll consider adding ${newCityName} soon.`);
      setNewCityName("");
    } else {
      toast.error("Please enter a city name");
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="min-h-full bg-background/95 backdrop-blur-sm">
          {/* Header Section */}
          <div className="sticky top-0 z-20 bg-primary border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-xs text-primary-foreground/80 font-medium">StaySecure PG</p>
              <h1 className="text-2xl font-bold text-primary-foreground">HE&SHE</h1>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 mt-6">
                  <Button variant="outline" className="justify-start gap-3" onClick={() => toast.info("Customer care feature coming soon!")}>
                    <Phone className="h-5 w-5 text-primary" />
                    Customer Care
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => toast.info("Help center feature coming soon!")}>
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Help Center
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => toast.info("Report feature coming soon!")}>
                    <Flag className="h-5 w-5 text-primary" />
                    Report an Issue
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => toast.info("Feedback feature coming soon!")}>
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Send Feedback
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => navigate('/profile')}>
                    <Settings className="h-5 w-5 text-primary" />
                    Settings
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Cities Stories Section */}
          <div className="sticky top-[53px] z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {cities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleCityClick(city.name)}
                  className="flex flex-col items-center gap-2 flex-shrink-0"
                >
                  <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center transition-all ${
                    selectedCity === city.name 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : 'hover:ring-2 hover:ring-accent'
                  }`}>
                    <img src={city.image} alt={city.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-medium">{city.name}</span>
                </button>
              ))}
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-muted hover:bg-accent flex items-center justify-center transition-all">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium">Add City</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom">
                  <SheetHeader>
                    <SheetTitle>Suggest a New City</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-6">
                    <p className="text-sm text-muted-foreground">
                      Can't find your city? Let us know and we'll try to add it!
                    </p>
                    <Input
                      placeholder="Enter city name"
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                    />
                    <Button onClick={handleSuggestCity} className="w-full">
                      Submit Suggestion
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
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
                <button
                  className="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 bg-muted hover:bg-accent transition-all flex items-center gap-1"
                  onClick={() => toast.info("Area suggestion feature coming soon!")}
                >
                  <Plus className="h-4 w-4" />
                  Suggest Area
                </button>
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
          <>
            <div className="px-4 py-6 border-b border-border">
              <h2 className="text-2xl font-bold mb-1">Welcome back, {profile?.name || 'Guest'}!</h2>
              <p className="text-muted-foreground text-sm">Find your perfect PG</p>
            </div>

            {/* About PGs Section */}
            <div className="px-4 py-6 bg-gradient-to-br from-primary/5 via-background to-accent/20 border-b border-border">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-4 text-primary">Why Choose StaySecure PG?</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Verified Properties</h4>
                      <p className="text-sm text-muted-foreground">All PGs are verified and inspected for quality and safety</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Prime Locations</h4>
                      <p className="text-sm text-muted-foreground">PGs in top areas with easy access to work hubs and amenities</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-background/80 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Easy Booking</h4>
                      <p className="text-sm text-muted-foreground">Simple booking process with instant confirmation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
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
        </div>
      </main>

      {/* Bottom Navigation - Instagram Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
          >
            <Home 
              className={`h-6 w-6 transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}
              fill={isActive('/') ? 'currentColor' : 'none'}
            />
            {isActive('/') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
          </button>
          
          <button
            onClick={() => navigate('/search')}
            className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
          >
            <Search 
              className={`h-6 w-6 transition-colors ${isActive('/search') ? 'text-primary' : 'text-muted-foreground'}`}
            />
            {isActive('/search') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
          </button>
          
          <button
            onClick={() => navigate('/bookings')}
            className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
          >
            <Calendar 
              className={`h-6 w-6 transition-colors ${isActive('/bookings') ? 'text-primary' : 'text-muted-foreground'}`}
              fill={isActive('/bookings') ? 'currentColor' : 'none'}
            />
            {isActive('/bookings') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
          >
            <User 
              className={`h-6 w-6 transition-colors ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}
              fill={isActive('/profile') ? 'currentColor' : 'none'}
            />
            {isActive('/profile') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default CustomerDashboard;
