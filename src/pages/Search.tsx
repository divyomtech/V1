import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, MapPin, IndianRupee, Users, Wifi, Utensils, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

const Search = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [maxRent, setMaxRent] = useState('50000');

  useEffect(() => {
    fetchProperties();
  }, [genderFilter, maxRent]);

  const fetchProperties = async () => {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('status', 'active');

      if (genderFilter !== 'all') {
        query = query.eq('gender_preference', genderFilter as 'male' | 'female' | 'mixed');
      }

      if (maxRent !== 'all') {
        query = query.lte('monthly_rent', parseInt(maxRent));
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties(data || []);
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

  const filteredProperties = properties.filter(
    (prop) =>
      prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.locality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Find Your Perfect PG</h1>
          
          {/* Search and Filters */}
          <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
            <div className="grid md:grid-cols-3 gap-4">
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

              <Select value={maxRent} onValueChange={setMaxRent}>
                <SelectTrigger>
                  <SelectValue placeholder="Max Rent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50000">All Prices</SelectItem>
                  <SelectItem value="5000">Under ₹5,000</SelectItem>
                  <SelectItem value="10000">Under ₹10,000</SelectItem>
                  <SelectItem value="15000">Under ₹15,000</SelectItem>
                  <SelectItem value="20000">Under ₹20,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No properties found</p>
              <Button onClick={() => { setSearchTerm(''); setGenderFilter('all'); setMaxRent('50000'); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Card
                  key={property.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/properties/${property.id}`)}
                >
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    {property.photos && property.photos.length > 0 ? (
                      <img
                        src={property.photos[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Camera className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-background/90 text-foreground">
                      {property.gender_preference === 'male' ? 'Boys' : 
                       property.gender_preference === 'female' ? 'Girls' : 'Co-living'}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 truncate">{property.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
