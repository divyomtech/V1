import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, Property } from "@/lib/api";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Wifi, Utensils, Car, Zap, Video, Camera } from "lucide-react";
import { SafetyScore } from "./SafetyScore";

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  food: Utensils,
  parking: Car,
};

const FeaturedPGs = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      const data = await api.getProperties({ sort_by: 'newest' });
      setProperties(data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-secondary/30">
        <div className="container px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured PGs</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked accommodations with great reviews and amenities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/properties/${property.id}`)}
            >
              <div className="relative h-48 overflow-hidden">
                {property.photos && property.photos.length > 0 ? (
                  <img
                    src={property.photos[0]}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                  {property.gender_preference === 'male' ? 'Boys' :
                    property.gender_preference === 'female' ? 'Girls' : 'Unisex'}
                </Badge>
                {property.instant_booking && (
                  <Badge className="absolute top-3 left-3 bg-green-600">
                    <Zap className="h-3 w-3 mr-1" />
                    Instant
                  </Badge>
                )}
                {property.virtual_tour_url && (
                  <Badge className="absolute bottom-3 right-3 bg-purple-600">
                    <Video className="h-3 w-3 mr-1" />
                    Tour
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>

                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="line-clamp-1">{property.locality}, {property.city}</span>
                </div>

                {property.safety_score && property.safety_score > 0 && (
                  <div className="mb-3">
                    <SafetyScore score={property.safety_score} />
                  </div>
                )}

                <div className="flex gap-2 flex-wrap mb-4">
                  {property.amenities?.slice(0, 3).map((amenity: string) => {
                    const Icon = amenityIcons[amenity];
                    return (
                      <div
                        key={amenity}
                        className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full"
                      >
                        {Icon && <Icon className="h-3 w-3" />}
                        <span className="capitalize">{amenity.replace('_', ' ')}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary">
                      ₹{property.monthly_rent?.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="px-8"
            onClick={() => navigate('/search')}
          >
            View All PGs
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPGs;
