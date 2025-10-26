import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SafetyScore } from '@/components/SafetyScore';
import { 
  IndianRupee, 
  MapPin, 
  Users, 
  Calendar,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  monthly_rent: number;
  deposit: number;
  gender_preference: string;
  amenities: string[];
  photos: string[];
  available_from: string;
  safety_score: number;
  instant_booking: boolean;
}

const CompareProperties = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const propertyIds = searchParams.get('ids')?.split(',') || [];

  useEffect(() => {
    if (propertyIds.length > 0) {
      fetchProperties();
    }
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds);

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const allAmenities = Array.from(
    new Set(properties.flatMap(p => p.amenities || []))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <p>Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Button onClick={() => navigate('/search')} variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
          <p className="text-muted-foreground">No properties to compare</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="mb-6">
          <Button onClick={() => navigate('/search')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Compare Properties</h1>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-max">
            {properties.map((property) => (
              <Card key={property.id} className="min-w-[300px]">
                <CardContent className="p-6 space-y-4">
                  {/* Image */}
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={property.photos?.[0] || '/placeholder.svg'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-bold text-lg mb-1">{property.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {property.city}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Rent</span>
                      <span className="font-bold flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {property.monthly_rent.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Deposit</span>
                      <span className="font-semibold flex items-center text-sm">
                        <IndianRupee className="h-3 w-3" />
                        {property.deposit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Gender Preference */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gender</span>
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {property.gender_preference}
                    </Badge>
                  </div>

                  {/* Available From */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <span className="text-sm flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(property.available_from).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Safety Score */}
                  {property.safety_score > 0 && (
                    <SafetyScore score={property.safety_score} />
                  )}

                  {/* Instant Booking */}
                  {property.instant_booking && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      ⚡ Instant Booking
                    </Badge>
                  )}

                  {/* Amenities */}
                  <div>
                    <p className="text-sm font-medium mb-2">Amenities</p>
                    <div className="space-y-1">
                      {allAmenities.map((amenity) => (
                        <div key={amenity} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{amenity.replace('_', ' ')}</span>
                          {property.amenities?.includes(amenity) ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareProperties;