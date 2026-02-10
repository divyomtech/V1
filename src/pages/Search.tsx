import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Property } from '@/lib/api';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox as CheckboxPrimitive } from '@/components/ui/checkbox';
import { Search as SearchIcon, MapPin, IndianRupee, Heart, Wifi, Utensils, Camera, Grid3x3, List, Share2, Star, CalendarIcon, ArrowLeftRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Review {
  rating: number;
}

const Search = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const [properties, setProperties] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [sortBy, setSortBy] = useState<'price_low' | 'price_high' | 'newest'>('newest');
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedLocality, setSelectedLocality] = useState('all');

  // City-Locality drill-down data
  const cityLocalities: Record<string, string[]> = {
    'Bangalore': ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Electronic City', 'BTM Layout', 'Marathahalli', 'JP Nagar'],
    'Hyderabad': ['Gachibowli', 'Madhapur', 'Kondapur', 'Hitech City', 'Kukatpally', 'Banjara Hills', 'Jubilee Hills', 'Begumpet'],
    'Mumbai': ['Andheri', 'Powai', 'Bandra', 'Malad', 'Goregaon', 'Lower Parel', 'Worli', 'Thane'],
    'Delhi': ['Lajpat Nagar', 'Saket', 'Hauz Khas', 'Dwarka', 'Noida', 'Gurgaon', 'Rohini', 'Karol Bagh'],
    'Chennai': ['Adyar', 'Velachery', 'OMR', 'T Nagar', 'Anna Nagar', 'Porur', 'Guindy', 'Thoraipakkam'],
    'Pune': ['Hinjewadi', 'Kothrud', 'Wakad', 'Baner', 'Viman Nagar', 'Koregaon Park', 'Hadapsar', 'Magarpatta'],
  };

  const cities = ['all', ...Object.keys(cityLocalities)];

  useEffect(() => {
    fetchProperties();
  }, [genderFilter, selectedCity, priceRange, selectedAmenities, sortBy]);

  const fetchProperties = async () => {
    try {
      const filters: any = {};
      if (genderFilter !== 'all') {
        filters.gender_preference = genderFilter;
      }
      if (selectedCity !== 'all') {
        filters.city = selectedCity;
      }
      if (priceRange[0] > 0) {
        filters.min_rent = priceRange[0];
      }
      if (priceRange[1] < 50000) {
        filters.max_rent = priceRange[1];
      }
      if (selectedAmenities.length > 0) {
        filters.amenities = selectedAmenities.join(',');
      }
      if (sortBy !== 'newest') {
        filters.sort_by = sortBy;
      }

      const data = await api.getProperties(filters);
      setProperties(data);

      // Reviews will be fetched per property from the detail endpoint
      // For now, we'll show ratings from the listing if available
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const shareProperty = async (property: Property) => {
    const url = `${window.location.origin}/properties/${property.id}`;
    const text = `Check out ${property.title} in ${property.city}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: property.title, text, url });
      } catch (error) {
        // Share was cancelled or failed - no action needed
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Property link copied to clipboard',
      });
    }
  };

  const getAverageRating = (propertyId: string) => {
    const propertyReviews = reviews[propertyId] || [];
    if (propertyReviews.length === 0) return 0;
    const sum = propertyReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / propertyReviews.length).toFixed(1);
  };

  // Client-side filtering only for text search and locality (backend handles city, price, amenities, sort)
  const filteredProperties = properties.filter((prop) => {
    // Text search (not supported by backend) - searches title, city, locality
    const matchesSearch = !searchTerm ||
      prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.locality?.toLowerCase().includes(searchTerm.toLowerCase());

    // Locality filter (backend only supports city-level filtering)
    const matchesLocality = selectedLocality === 'all' ||
      prop.locality?.toLowerCase().includes(selectedLocality.toLowerCase());

    // Date filter (not yet supported by backend)
    const matchesDate = !dateFrom || (prop.available_from && new Date(prop.available_from) >= dateFrom);

    return matchesSearch && matchesLocality && matchesDate;
  });

  const toggleCompare = (propertyId: string) => {
    setSelectedForCompare(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        if (newSet.size >= 3) {
          toast({
            title: 'Maximum 3 properties',
            description: 'You can compare up to 3 properties at once',
            variant: 'destructive',
          });
          return prev;
        }
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.size < 2) {
      toast({
        title: 'Select at least 2 properties',
        description: 'Please select at least 2 properties to compare',
        variant: 'destructive',
      });
      return;
    }
    navigate(`/compare?ids=${Array.from(selectedForCompare).join(',')}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Find Your Perfect PG</h1>

          {/* Search and Filters */}
          <div className="bg-card p-6 rounded-lg shadow-sm mb-6">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, city, or area"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Gender Preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Boys</SelectItem>
                  <SelectItem value="female">Girls</SelectItem>
                  <SelectItem value="mixed">Co-living</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={(value) => {
                setSelectedCity(value);
                setSelectedLocality('all'); // Reset locality when city changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {Object.keys(cityLocalities).map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCity !== 'all' && cityLocalities[selectedCity] && (
                <Select value={selectedLocality} onValueChange={setSelectedLocality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas in {selectedCity}</SelectItem>
                    {cityLocalities[selectedCity].map(locality => (
                      <SelectItem key={locality} value={locality}>{locality}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : <span>Available from</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Compare Button */}
            {selectedForCompare.size > 0 && (
              <div className="mb-4">
                <Button onClick={handleCompare} className="w-full">
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Compare {selectedForCompare.size} Properties
                </Button>
              </div>
            )}

            {/* Sort Options */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
              </label>
              <Slider
                min={0}
                max={50000}
                step={1000}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mb-2"
              />
            </div>

            {/* Amenities Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Amenities</label>
              <div className="flex flex-wrap gap-4">
                {['wifi', 'food', 'laundry', 'parking', 'ac'].map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <label
                      htmlFor={amenity}
                      className="text-sm capitalize cursor-pointer"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No properties found</p>
              <Button onClick={() => {
                setSearchTerm('');
                setGenderFilter('all');
                setSelectedCity('all');
                setSelectedLocality('all');
                setPriceRange([0, 50000]);
                setSelectedAmenities([]);
                setDateFrom(undefined);
                setSortBy('newest');
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredProperties.map((property) => {
                const avgRating = getAverageRating(property.id);
                const reviewCount = reviews[property.id]?.length || 0;
                const isFavorite = favorites.has(property.id);

                return (
                  <Card
                    key={property.id}
                    className={`hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}
                  >
                    <div
                      className={`relative overflow-hidden ${viewMode === 'list' ? 'w-64 h-48' : 'aspect-video rounded-t-lg'
                        }`}
                      onClick={() => navigate(`/properties/${property.id}`)}
                    >
                      {property.photos && property.photos.length > 0 ? (
                        <img
                          src={property.photos[0]}
                          alt={property.title}
                          className="w-full h-full object-cover cursor-pointer"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center cursor-pointer">
                          <Camera className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-background/90 text-foreground">
                        {property.gender_preference === 'male' ? 'Boys' :
                          property.gender_preference === 'female' ? 'Girls' : 'Co-living'}
                      </Badge>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 left-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(property.id);
                        }}
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                    <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''} flex flex-col`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3
                            className="font-bold text-lg leading-tight truncate cursor-pointer"
                            onClick={() => navigate(`/properties/${property.id}`)}
                          >
                            {property.title}
                          </h3>
                          <div
                            className="flex items-center text-[11px] text-muted-foreground mt-0.5 font-medium cursor-pointer"
                            onClick={() => navigate(`/properties/${property.id}`)}
                          >
                            <MapPin className="h-3 w-3 mr-1 text-primary/70" />
                            {property.locality}, {property.city}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 -mt-1 -mr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareProperty(property);
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {reviewCount > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{avgRating}</span>
                        </div>
                      )}

                      <div className="flex items-end justify-between mt-auto">
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
                                    <p className="text-xl font-black text-primary flex items-center leading-none">
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
