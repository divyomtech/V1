import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
import { Search as SearchIcon, MapPin, IndianRupee, Heart, Wifi, Utensils, Camera, Grid3x3, List, Share2, Star, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  title: string;
  city: string;
  locality: string;
  monthly_rent: number;
  gender_preference: string;
  amenities: string[];
  photos: string[];
  deposit: number;
  available_from: string;
}

interface Review {
  rating: number;
}

const Search = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites(user?.id);
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

  useEffect(() => {
    fetchProperties();
  }, [genderFilter]);

  const fetchProperties = async () => {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active');

      if (genderFilter !== 'all') {
        query = query.eq('gender_preference', genderFilter as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const propertyData = data || [];
      setProperties(propertyData);

      // Fetch reviews for all properties
      if (propertyData.length > 0) {
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('property_id, rating')
          .in('property_id', propertyData.map(p => p.id));

        const reviewsByProperty = (reviewData || []).reduce((acc, review) => {
          if (!acc[review.property_id]) {
            acc[review.property_id] = [];
          }
          acc[review.property_id].push(review);
          return acc;
        }, {} as Record<string, Review[]>);

        setReviews(reviewsByProperty);
      }
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
        console.log('Error sharing:', error);
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

  const filteredProperties = properties.filter((prop) => {
    const matchesSearch =
      prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.locality?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrice =
      prop.monthly_rent >= priceRange[0] && prop.monthly_rent <= priceRange[1];

    const matchesAmenities =
      selectedAmenities.length === 0 ||
      selectedAmenities.every(amenity => prop.amenities?.includes(amenity));

    const matchesDate = !dateFrom || (prop.available_from && new Date(prop.available_from) >= dateFrom);

    return matchesSearch && matchesPrice && matchesAmenities && matchesDate;
  }).sort((a, b) => {
    if (sortBy === 'price_low') return a.monthly_rent - b.monthly_rent;
    if (sortBy === 'price_high') return b.monthly_rent - a.monthly_rent;
    return 0; // newest - already sorted by default
  });

  return (
    <div className="min-h-screen bg-background">
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
                  <SelectItem value="unisex">Co-living</SelectItem>
                </SelectContent>
              </Select>

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
                      className={`relative overflow-hidden ${
                        viewMode === 'list' ? 'w-64 h-48' : 'aspect-video rounded-t-lg'
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
                    <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 
                          className="font-semibold text-lg truncate cursor-pointer flex-1"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          {property.title}
                        </h3>
                        <Button
                          size="icon"
                          variant="ghost"
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
                          <span className="text-xs text-muted-foreground">({reviewCount} reviews)</span>
                        </div>
                      )}

                      <div 
                        className="flex items-center text-sm text-muted-foreground mb-3 cursor-pointer"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.locality}, {property.city}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center font-semibold text-lg">
                          <IndianRupee className="h-4 w-4" />
                          {property.monthly_rent.toLocaleString()}/mo
                        </div>
                        <div className="flex gap-2">
                          {property.amenities?.includes('wifi') && (
                            <Wifi className="h-4 w-4 text-muted-foreground" />
                          )}
                          {property.amenities?.includes('food') && (
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Deposit: ₹{property.deposit?.toLocaleString() || 'N/A'}
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
