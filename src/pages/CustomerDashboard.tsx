import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SafetyScore } from "@/components/SafetyScore";
import { ShareDialog } from "@/components/ShareDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { Search, Home, Calendar, User, MapPin, Plus, Menu, Phone, Flag, HelpCircle, Settings, MessageSquare, Heart, Gift, ArrowLeftRight, Star, Camera, TrendingUp, Zap, Video } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeBookings: 0, savedProperties: 0, referralRewards: 0 });
  const { favorites, toggleFavorite } = useFavorites(user?.id);

  const isActive = (path: string) => location.pathname === path;
  
  const selectedCityData = cities.find(c => c.name === selectedCity);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchFeaturedProperties();
      fetchStats();
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

  const fetchFeaturedProperties = async () => {
    try {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (data) setFeaturedProperties(data);
    } catch (error) {
      console.error('Error fetching featured properties:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [bookingsRes, favoritesRes, referralsRes] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact' }).eq('customer_id', user?.id).in('status', ['requested', 'accepted']),
        supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('referrals').select('reward_amount').eq('referrer_id', user?.id).eq('reward_claimed', true)
      ]);

      const totalRewards = referralsRes.data?.reduce((sum, r) => sum + r.reward_amount, 0) || 0;

      setStats({
        activeBookings: bookingsRes.count || 0,
        savedProperties: favoritesRes.count || 0,
        referralRewards: totalRewards
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPropertiesByLocation = async (city: string, area?: string) => {
    try {
      let query = supabase.from('properties').select('*').eq('city', city).eq('status', 'active');
      
      if (area) {
        query = query.ilike('address', `%${area}%`);
      }
      
      const { data } = await query.limit(10);
      if (data) setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
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
      <main className="flex-1 overflow-y-auto relative" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="min-h-full relative z-10">
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
                  <Button variant="outline" className="justify-start gap-3" onClick={() => navigate('/favorites')}>
                    <Heart className="h-5 w-5 text-primary" />
                    My Favorites
                    {stats.savedProperties > 0 && (
                      <Badge className="ml-auto">{stats.savedProperties}</Badge>
                    )}
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => navigate('/referrals')}>
                    <Gift className="h-5 w-5 text-primary" />
                    Referral Program
                    {stats.referralRewards > 0 && (
                      <Badge className="ml-auto">₹{stats.referralRewards}</Badge>
                    )}
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => navigate('/roommate-match')}>
                    <User className="h-5 w-5 text-primary" />
                    Find Roommate
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => window.open('tel:1800-123-4567')}>
                    <Phone className="h-5 w-5 text-primary" />
                    Customer Care
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => toast.info("Help center: Contact us at support@heshe.com")}>
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Help Center
                  </Button>
                  <Button variant="outline" className="justify-start gap-3" onClick={() => navigate('/profile')}>
                    <Settings className="h-5 w-5 text-primary" />
                    Settings
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Quick Search Bar */}
          <div className="px-4 py-4 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Search PGs by name, city, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Cities Stories Section */}
          <div className="sticky top-[117px] z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
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
                  className="overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="relative">
                    {property.photos && property.photos.length > 0 ? (
                      <img
                        src={property.photos[0]}
                        alt={property.title}
                        className="w-full h-40 object-cover cursor-pointer"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      />
                    ) : (
                      <div className="w-full h-40 bg-muted flex items-center justify-center">
                        <Camera className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <ShareDialog propertyId={property.id} title={property.title} />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(property.id);
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.has(property.id) ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                      </Button>
                    </div>
                    {property.instant_booking && (
                      <Badge className="absolute top-2 left-2 bg-green-600">
                        <Zap className="h-3 w-3 mr-1" />
                        Instant Booking
                      </Badge>
                    )}
                    {property.virtual_tour_url && (
                      <Badge className="absolute bottom-2 left-2 bg-purple-600">
                        <Video className="h-3 w-3 mr-1" />
                        Virtual Tour
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4 cursor-pointer" onClick={() => navigate(`/properties/${property.id}`)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{property.title}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.locality}, {property.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-primary font-bold text-lg">
                        ₹{property.monthly_rent?.toLocaleString()}/mo
                      </p>
                      {property.safety_score && property.safety_score > 0 && (
                        <SafetyScore score={property.safety_score} />
                      )}
                    </div>
                  </CardContent>
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

            {/* Quick Stats Cards */}
            <div className="px-4 py-6 border-b border-border">
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/bookings')}>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{stats.activeBookings}</p>
                    <p className="text-xs text-muted-foreground">Active Bookings</p>
                  </div>
                </Card>
                <Card className="p-4 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/favorites')}>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                      <Heart className="h-6 w-6 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold">{stats.savedProperties}</p>
                    <p className="text-xs text-muted-foreground">Saved PGs</p>
                  </div>
                </Card>
                <Card className="p-4 hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate('/referrals')}>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                      <Gift className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold">₹{stats.referralRewards}</p>
                    <p className="text-xs text-muted-foreground">Rewards</p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Featured Properties */}
            {featuredProperties.length > 0 && (
              <div className="px-4 py-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Featured PGs
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
                    View All
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {featuredProperties.slice(0, 4).map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/properties/${property.id}`)}>
                      <div className="relative">
                        {property.photos && property.photos.length > 0 ? (
                          <img
                            src={property.photos[0]}
                            alt={property.title}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted flex items-center justify-center">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {property.instant_booking && (
                          <Badge className="absolute top-2 left-2 bg-green-600 text-xs">
                            <Zap className="h-2 w-2 mr-1" />
                            Instant
                          </Badge>
                        )}
                        {property.virtual_tour_url && (
                          <Badge className="absolute top-2 right-2 bg-purple-600 text-xs">
                            <Video className="h-2 w-2" />
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm truncate">{property.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2 w-2" />
                          {property.city}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-primary font-bold text-sm">
                            ₹{property.monthly_rent?.toLocaleString()}
                          </p>
                          {property.safety_score && property.safety_score >= 4 && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Star className="h-3 w-3 fill-current" />
                              {property.safety_score}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

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
          <div 
            className="px-4 py-6 relative overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--accent) / 0.1) 100%)`,
            }}
          >
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            
            <div className="relative z-10">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Bookings
              </h3>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : bookings.length === 0 ? (
                <Card className="text-center py-12 bg-background/80 backdrop-blur-sm border-2 border-dashed">
                  <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No bookings yet</p>
                  <Button onClick={() => navigate('/search')} size="sm" className="gap-2">
                    <Search className="h-4 w-4" />
                    Search for PGs
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking: any) => (
                    <Card key={booking.id} className="p-4 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer bg-background/90 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                            <Home className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{booking.properties?.title}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {booking.properties?.city}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
            onClick={() => navigate('/favorites')}
            className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
          >
            <Heart 
              className={`h-6 w-6 transition-colors ${isActive('/favorites') ? 'text-primary' : 'text-muted-foreground'}`}
              fill={isActive('/favorites') ? 'currentColor' : 'none'}
            />
            {stats.savedProperties > 0 && (
              <Badge className="absolute -top-1 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {stats.savedProperties}
              </Badge>
            )}
            {isActive('/favorites') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
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
