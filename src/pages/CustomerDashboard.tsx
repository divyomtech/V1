import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SafetyScore } from "@/components/SafetyScore";
import { ShareDialog } from "@/components/ShareDialog";
import { useFavorites } from "@/hooks/useFavorites";
import { Search, Home, Calendar, User, MapPin, Plus, Menu, Phone, Flag, HelpCircle, Settings, MessageSquare, Heart, Gift, ArrowLeftRight, Star, Camera, TrendingUp, Zap, Video, Megaphone, AlertTriangle, AlertCircle, Info, Shield, Clock, ShieldCheck, Share2, IndianRupee, Wifi, Utensils, Users, ChevronRight, Wrench } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferralsContent } from "./Referrals";
import bangaloreImg from "@/assets/cities/bangalore.jpg";
import hyderabadImg from "@/assets/cities/hyderabad.jpg";
import mumbaiImg from "@/assets/cities/mumbai.jpg";
import delhiImg from "@/assets/cities/delhi.jpg";
import chennaiImg from "@/assets/cities/chennai.jpg";
import heroBg from "@/assets/hero-bg.jpg";

// Default city images mapping
const cityImages: Record<string, string> = {
  Bangalore: bangaloreImg,
  Hyderabad: hyderabadImg,
  Mumbai: mumbaiImg,
  Delhi: delhiImg,
  Chennai: chennaiImg,
};

interface CityData {
  id: string;
  name: string;
  slug?: string;
  status: string;
  image_url: string | null;
  tagline?: string | null;
  property_count: number;
  areas: { id: string | null; name: string; is_popular?: boolean }[];
}

const CustomerDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [newCityName, setNewCityName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeBookings: 0, savedProperties: 0, referralRewards: 0 });
  const { favorites, toggleFavorite } = useFavorites();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [showAllCities, setShowAllCities] = useState(false);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isRaiseTicketOpen, setIsRaiseTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium', property_id: '' });
  const [isRaising, setIsRaising] = useState(false);

  // Cities loaded from API
  const [cities, setCities] = useState<CityData[]>([]);

  const isActive = (path: string) => location.pathname === path;

  const selectedCityData = cities.find(c => c.name === selectedCity);

  useEffect(() => {
    fetchCities();
    if (user) {
      fetchDashboardData();
      fetchFeaturedProperties();
      fetchStats();
      fetchTenantAnnouncements();
      fetchTickets();
    }
  }, [user]);

  const fetchTenantAnnouncements = async () => {
    try {
      const data = await api.getTenantAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'important': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-950/50';
      case 'important': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-950/50';
    }
  };

  const fetchCities = async () => {
    try {
      const data = await api.getCities();
      const formattedCities: CityData[] = (data || []).map((city: any) => ({
        id: city.id,
        name: city.name,
        image_url: city.image_url || cityImages[city.name] || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=60',
        areas: city.areas || [],
        status: city.status || 'AVAILABLE',
        property_count: city.property_count || 0
      }));
      setCities(formattedCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Use profile from useAuth
      // Bookings will be fetched from API
      const bookingsData = await api.getBookings();
      if (bookingsData) {
        setBookings(bookingsData.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedProperties = async () => {
    try {
      const data = await api.getProperties();
      if (data) setFeaturedProperties(data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching featured properties:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const bookingsData = await api.getBookings();
      const favoritesData = await api.getFavorites();

      const activeBookings = bookingsData?.filter((b: any) =>
        ['requested', 'accepted', 'active'].includes(b.status)
      ).length || 0;

      setStats({
        activeBookings,
        savedProperties: favoritesData?.length || 0,
        referralRewards: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const data = await api.getMyTickets();
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleRaiseTicket = async () => {
    if (!newTicket.title || !newTicket.description || !newTicket.property_id) {
      toast.error("Please fill in all fields and select a property");
      return;
    }

    setIsRaising(true);
    try {
      await api.raiseTicket(newTicket);
      toast.success("Maintenance ticket raised successfully!");
      setIsRaiseTicketOpen(false);
      setNewTicket({ title: '', description: '', priority: 'medium', property_id: '' });
      fetchTickets();
    } catch (error: any) {
      toast.error(error.message || "Failed to raise ticket");
    } finally {
      setIsRaising(false);
    }
  };

  const fetchPropertiesByLocation = async (city: string, area?: string) => {
    try {
      // Backend handles all filtering via Python SQLAlchemy
      const data = await api.getProperties({ city, locality: area } as any);
      if (data) {
        setProperties(data.slice(0, 10));
      }
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
      {(() => {
        const activeAnnouncements = announcements.filter(ann => {
          const now = new Date();
          const start = ann.start_time ? new Date(ann.start_time) : new Date(ann.created_at);
          const end = ann.end_time ? new Date(ann.end_time) : new Date(new Date(ann.created_at).getTime() + 24 * 60 * 60 * 1000);
          return now >= start && now <= end;
        });

        if (activeAnnouncements.length === 0) return null;

        return (
          <div className="px-4 py-2 space-y-1 bg-background border-b z-30">
            {activeAnnouncements.slice(0, 2).map((ann) => (
              <div key={ann.id} className={`p-3 border-l-4 rounded-md shadow-sm text-xs ${getPriorityStyles(ann.priority)}`}>
                <div className="flex items-start gap-3">
                  {getPriorityIcon(ann.priority)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">Owner Notice</span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1">{ann.priority}</Badge>
                    </div>
                    <h4 className="font-bold mt-0.5">{ann.title}</h4>
                    <p className="text-muted-foreground line-clamp-1">{ann.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full bg-background">


          {/* Header Section */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4 flex items-center justify-between shadow-sm">
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground font-medium">StaySecure PG</p>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">HE&SHE</h1>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Menu className="h-6 w-6 text-foreground" />
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


          {/* Main Content - No Tabs */}

          {/* Hero Search Section */}
          <div className="relative px-4 py-20 overflow-hidden">
            {/* Background Image with Dark Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: `url(${heroBg})` }}
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

            <div className="max-w-4xl mx-auto relative z-10">
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-6xl font-extrabold mb-4 text-white tracking-tight leading-tight">
                  Find Your Perfect <span className="text-primary">PG</span> Home
                </h2>
                <p className="text-lg md:text-xl text-gray-200 font-medium max-w-2xl mx-auto opacity-90">
                  Discover safe, comfortable, and affordable accommodations in your favorite city
                </p>
              </div>

              {/* Feature Badges Below Heading */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <div className="bg-white/95 backdrop-blur-sm px-6 py-2.5 rounded-full shadow-xl border border-white/20 flex items-center gap-2.5 transition-all hover:scale-105 group">
                  <ShieldCheck className="h-5 w-5 text-slate-800" />
                  <span className="font-bold text-slate-900 text-sm">Verified Listings</span>
                </div>
                <div className="bg-white/95 backdrop-blur-sm px-6 py-2.5 rounded-full shadow-xl border border-white/20 flex items-center gap-2.5 transition-all hover:scale-105 group">
                  <Clock className="h-5 w-5 text-slate-800" />
                  <span className="font-bold text-slate-900 text-sm">24/7 Support</span>
                </div>
                <div className="bg-white/95 backdrop-blur-sm px-6 py-2.5 rounded-full shadow-xl border border-white/20 flex items-center gap-2.5 transition-all hover:scale-105 group">
                  <Gift className="h-5 w-5 text-slate-800" />
                  <span className="font-bold text-slate-900 text-sm">Best Price</span>
                </div>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="flex flex-col md:flex-row gap-3 bg-black/40 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-2xl">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input
                      placeholder="Search by location, area, or landmark..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full bg-white/10 border-0 focus-visible:ring-0 text-white placeholder:text-gray-400 text-lg pl-12 py-7 rounded-2xl"
                    />
                  </div>
                  <Button onClick={handleSearch} size="lg" className="px-10 py-7 rounded-2xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-all bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Search className="h-6 w-6 mr-2" />
                    Search
                  </Button>
                </div>

                <div className="mt-10 flex justify-center">
                  <Button
                    onClick={() => navigate('/search')}
                    className="group relative px-10 py-7 overflow-hidden rounded-2xl font-bold text-xl transition-all duration-300 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-2xl hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      Explore All Properties
                      <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90 text-primary" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Cities Section */}
          <div className="px-4 py-8 bg-primary/10">
            <h3 className="text-2xl font-bold mb-6 text-center">Choose Your City</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cities.slice(0, 4).map((city) => {
                const isAvailable = city.status === "AVAILABLE";
                const isComingSoon = city.status === "COMING_SOON";

                return (
                  <div
                    key={city.id || city.name}
                    onClick={() => isAvailable && handleCityClick(city.name)}
                    className={`group relative rounded-3xl overflow-hidden shadow-lg transition-all duration-500 ${isAvailable ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1' : 'cursor-default opacity-90'} ${selectedCity === city.name ? 'ring-4 ring-primary ring-offset-2' : ''
                      }`}
                  >
                    {/* City Image */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={city.image_url || cityImages[city.name] || bangaloreImg}
                        alt={city.name}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isComingSoon ? 'grayscale-[0.5] blur-[1px]' : ''}`}
                      />
                      {/* Premium Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {isComingSoon ? (
                          <Badge className="bg-amber-500/90 backdrop-blur-md text-white border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                            Launching Soon
                          </Badge>
                        ) : (
                          <Badge className="bg-primary/90 backdrop-blur-md text-primary-foreground border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                            Live Now
                          </Badge>
                        )}
                        {isAvailable && city.property_count > 0 && (
                          <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-white text-[9px] font-bold">{city.property_count} Active</span>
                          </div>
                        )}
                      </div>

                      {/* City Info - Bottom Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-transform duration-500">
                        <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1 opacity-90">{city.tagline || 'Exclusive PGs'}</p>
                        <h4 className="text-white font-extrabold text-xl md:text-2xl leading-tight mb-1">{city.name}</h4>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-white/60" />
                          <span className="text-white/60 text-xs font-medium">{city.areas.length} Locations</span>
                        </div>
                      </div>
                    </div>

                    {/* Areas Chips - Hidden by default, shown on hover or for active */}
                    <div className="p-4 bg-background border-t border-border/50">
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {city.areas.length > 0 ? (
                          <>
                            {city.areas.slice(0, 3).map((area) => (
                              <Badge key={area.name} variant="secondary" className="text-[9px] font-bold px-2 py-0.5 bg-secondary/50 hover:bg-primary/20 transition-colors">
                                {area.name}
                              </Badge>
                            ))}
                            {city.areas.length > 3 && (
                              <Badge variant="outline" className="text-[9px] font-medium border-dashed">
                                +{city.areas.length - 3}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">New areas added weekly</p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant={isAvailable ? "default" : "outline"}
                        disabled={!isAvailable}
                        className={`w-full text-xs font-bold rounded-xl transition-all ${isAvailable ? 'shadow-md hover:shadow-lg active:scale-95' : 'opacity-50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAvailable) navigate(`/search?city=${city.name.toLowerCase()}`);
                        }}
                      >
                        {isAvailable ? 'Explore City' : 'Notify Me'}
                        <ChevronRight className="h-3 w-3 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* +X more cities */}
              {cities.length > 4 && (
                <Dialog open={showAllCities} onOpenChange={setShowAllCities}>
                  <DialogTrigger asChild>
                    <div className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all h-48 group">
                      {/* Gradient background matching city card style */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-accent/70" />
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYyaDR2Mmgtdnp6TTAgNGgydjRoLTJ6bTAgMTJoMnY0aC0yem0wIDEyaDJ2NGgtMnptMCAxMmgydjRoLTJ6bTAgMTJoMnY0aC0yek0xMiAwdjJoNHYtMnptMTIgMHYyaDR2LTJ6bTEyIDB2Mmg0di0yem0xMiAwdjJoNHYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

                      {/* Content */}
                      <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mb-3 group-hover:scale-110 transition-transform">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <span className="text-4xl font-black mb-1">+{cities.length - 4}</span>
                        <span className="text-sm font-medium text-white/90">more cities</span>
                        <div className="mt-3 flex items-center gap-1 text-xs font-medium bg-white/20 px-3 py-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                          View All <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none">
                    <DialogHeader className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-b">
                      <DialogTitle className="text-2xl font-black flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-primary" />
                        Explore All Cities
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 overflow-y-auto max-h-[70vh]">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {cities.map((city) => {
                          const isAvailable = city.status === "AVAILABLE";
                          return (
                            <button
                              key={city.id || city.name}
                              onClick={() => {
                                if (isAvailable) {
                                  handleCityClick(city.name);
                                  setShowAllCities(false);
                                }
                              }}
                              disabled={!isAvailable}
                              className={`group relative flex flex-col items-center transition-all ${!isAvailable ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                            >
                              <div className={`relative w-full aspect-square rounded-[2rem] overflow-hidden transition-all duration-500 ${selectedCity === city.name ? 'ring-4 ring-primary ring-offset-4' : 'group-hover:ring-4 group-hover:ring-primary/30 group-hover:ring-offset-2'}`}>
                                <img
                                  src={city.image_url || cityImages[city.name] || bangaloreImg}
                                  alt={city.name}
                                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!isAvailable ? 'grayscale-[0.8] blur-[1px]' : ''}`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                {!isAvailable && (
                                  <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <Badge className="bg-amber-500/90 backdrop-blur-md text-white border-none text-[10px] font-bold uppercase py-1">
                                      Soon
                                    </Badge>
                                  </div>
                                )}

                                <div className="absolute bottom-3 left-0 right-0 text-center">
                                  <span className="text-white font-bold text-sm tracking-wide">{city.name}</span>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-col items-center">
                                {isAvailable ? (
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                                    {city.property_count}+ Properties
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                                    Register interest
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Sub-locations Section */}
          {selectedCity && selectedCityData && (
            <div className="px-4 py-6 bg-secondary/30 border-y border-border">
              <h3 className="font-bold text-lg mb-3">Popular Areas in {selectedCity}</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {selectedCityData.areas.slice(0, 4).map((area) => (
                  <button
                    key={area.id || area.name}
                    onClick={() => handleAreaClick(area.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all ${selectedArea === area.name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground hover:bg-muted'
                      }`}
                  >
                    {area.name}
                  </button>
                ))}

                {/* +X more areas chip */}
                {selectedCityData.areas.length > 4 && (
                  <Dialog open={showAllAreas} onOpenChange={setShowAllAreas}>
                    <DialogTrigger asChild>
                      <button className="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 bg-primary/20 text-primary hover:bg-primary/30 transition-all flex items-center gap-1">
                        +{selectedCityData.areas.length - 4} more
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>All Areas in {selectedCity}</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-wrap gap-2 pt-4">
                        {selectedCityData.areas.map((area) => (
                          <button
                            key={area.id || area.name}
                            onClick={() => {
                              handleAreaClick(area.name);
                              setShowAllAreas(false);
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedArea === area.name
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-accent'
                              }`}
                          >
                            {area.name}
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
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
                    className="group overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-background/50 backdrop-blur-sm"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {property.photos && property.photos.length > 0 ? (
                        <img
                          src={property.photos[0]}
                          alt={property.title}
                          className="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Camera className="h-12 w-12 text-muted-foreground opacity-20" />
                        </div>
                      )}

                      {/* Premium Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="absolute top-4 right-4 flex gap-2">
                        <ShareDialog propertyId={property.id} title={property.title} />
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(property.id);
                          }}
                        >
                          <Heart
                            className={`h-5 w-5 ${favorites.has(property.id) ? 'fill-red-500 text-red-500' : 'text-white'
                              }`}
                          />
                        </Button>
                      </div>

                      {/* Floating Badges */}
                      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                        {property.instant_booking && (
                          <Badge className="bg-green-500/90 backdrop-blur-md text-white border-none py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <Zap className="h-3 w-3 mr-1" />
                            Instant
                          </Badge>
                        )}
                        {property.virtual_tour_url && (
                          <Badge className="bg-purple-500/90 backdrop-blur-md text-white border-none py-1 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <Video className="h-3 w-3 mr-1" />
                            Virtual Tour
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className={`p-6 cursor-pointer ${property.total_vacancy === 0 ? 'opacity-50' : ''}`} onClick={() => navigate(`/properties/${property.id}`)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-lg md:text-xl truncate tracking-tight text-foreground group-hover:text-primary transition-colors">{property.title}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {property.locality || property.city}
                          </p>
                        </div>
                      </div>

                      {/* Amenities Row */}
                      <div className="flex gap-4 mb-5 text-muted-foreground/60">
                        <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-lg">
                          <Wifi className="h-4 w-4" />
                          <span className="text-[10px] font-bold">Free WiFi</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-lg">
                          <Utensils className="h-4 w-4" />
                          <span className="text-[10px] font-bold">Meal Incl.</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        {(() => {
                          const monthlyRooms = (property.rooms || []).filter((r: any) => (r.stay_type || 'monthly') === 'monthly');
                          const leadRoom = monthlyRooms.length > 0
                            ? [...monthlyRooms].sort((a, b) => (a.price || 0) - (b.price || 0))[0]
                            : null;
                          return (
                            <>
                              <div className="flex flex-col">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-black text-primary tracking-tighter">
                                    ₹{(leadRoom?.price ?? property.monthly_rent ?? 0).toLocaleString()}
                                  </span>
                                  <span className="text-muted-foreground text-[10px] font-bold uppercase">/ month</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-[0.05em]">
                                  Security Deposit: ₹{(leadRoom?.deposit ?? property.deposit ?? 0).toLocaleString()}
                                </p>
                              </div>

                              <Button size="icon" className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                <ChevronRight className="h-6 w-6" />
                              </Button>
                            </>
                          );
                        })()}
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
              <div className="px-4 py-8 bg-gradient-to-r from-primary/10 to-accent/10 border-y border-border">
                <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.name || 'Guest'}!</h2>
                <p className="text-muted-foreground">Find your perfect PG accommodation</p>
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
                    <div className="flex items-center gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[160px] h-9">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="price_low">Price: Low to High</SelectItem>
                          <SelectItem value="price_high">Price: High to Low</SelectItem>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
                        View All
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[...featuredProperties]
                      .sort((a, b) => {
                        switch (sortBy) {
                          case 'price_low':
                            return (a.monthly_rent || 0) - (b.monthly_rent || 0);
                          case 'price_high':
                            return (b.monthly_rent || 0) - (a.monthly_rent || 0);
                          case 'rating':
                            return (b.safety_score || 0) - (a.safety_score || 0);
                          case 'newest':
                          default:
                            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                        }
                      })
                      .slice(0, 4)
                      .map((property) => (
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
                                Virtual Tour
                              </Badge>
                            )}
                            {/* Featured Property Vacancy logic removed as per request */}
                            {property.total_vacancy !== undefined && property.total_vacancy > 0 && property.total_vacancy <= 2 && (
                              <Badge className="absolute top-1 left-1 bg-amber-500 text-[8px] h-4">
                                {property.total_vacancy} left
                              </Badge>
                            )}
                          </div>
                          <CardContent className={`p-4 ${property.total_vacancy === 0 ? 'opacity-60' : ''}`}>
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-base truncate leading-tight flex-1">{property.title}</h4>
                              <Share2
                                className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Simplified share logic
                                  toast.success("Share feature coming soon!");
                                }}
                              />
                            </div>

                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2 font-medium">
                              <MapPin className="h-3 w-3 text-primary/70" />
                              {property.locality || property.city}, {property.city}
                            </p>

                            <div className="flex items-end justify-between">
                              {(() => {
                                const monthlyRooms = (property.rooms || []).filter((r: any) => (r.stay_type || 'monthly') === 'monthly');
                                const leadRoom = monthlyRooms.length > 0
                                  ? [...monthlyRooms].sort((a, b) => (a.price || 0) - (b.price || 0))[0]
                                  : null;
                                return (
                                  <>
                                    <div className="flex-1">
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-0.5">
                                          <p className="text-lg font-black text-primary flex items-center leading-none">
                                            <IndianRupee className="h-4 w-4 stroke-[3px]" />
                                            {(leadRoom?.price ?? property.monthly_rent ?? 0).toLocaleString()}
                                          </p>
                                          <span className="text-primary text-[10px] font-bold uppercase tracking-wider">/mo</span>
                                        </div>
                                        {leadRoom && (
                                          <span className="text-[10px] text-muted-foreground font-bold">
                                            {leadRoom.room_type}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-1 items-end">
                                      <span className="text-[10px] text-muted-foreground font-medium">
                                        Deposit: ₹{(leadRoom?.deposit ?? property.deposit ?? 0).toLocaleString()}
                                      </span>
                                      <div className="flex gap-1 text-muted-foreground/40">
                                        <Wifi className="h-4 w-4" />
                                        <Utensils className="h-4 w-4" />
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
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
                  <h3 className="text-xl font-bold mb-4 text-primary">Why Choose HE&amp;SHE PG?</h3>
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
                              <h4 className="font-semibold">{booking.property?.title || 'Unknown Property'}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {booking.property?.city || 'Unknown Location'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'requested' ? 'bg-accent text-accent-foreground' :
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


        </div >
      </main >
    </div >
  );
};

export default CustomerDashboard;
