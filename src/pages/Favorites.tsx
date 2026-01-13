import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Property } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/contexts/FavoritesContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, IndianRupee, Camera, Wifi, Utensils } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { favorites, toggleFavorite, loading: favoritesLoading } = useFavorites();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Wait for favorites to load before fetching properties
    if (!favoritesLoading) {
      fetchFavoriteProperties();
    }
  }, [user, favorites, favoritesLoading]);

  const fetchFavoriteProperties = async () => {
    if (favorites.size === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch all properties and filter by favorites
      const allProperties = await api.getProperties();
      const favoriteProperties = allProperties.filter(p => favorites.has(p.id));
      setProperties(favoriteProperties);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Loading your favorites...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>

          {properties.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No favorites yet</p>
              <Button onClick={() => navigate('/search')}>Browse Properties</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <div
                    className="aspect-video relative overflow-hidden rounded-t-lg cursor-pointer"
                    onClick={() => navigate(`/properties/${property.id}`)}
                  >
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
                      {property.gender_preference === 'male'
                        ? 'Boys'
                        : property.gender_preference === 'female'
                          ? 'Girls'
                          : 'Co-living'}
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
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <h3
                      className="font-semibold text-lg mb-2 truncate cursor-pointer"
                      onClick={() => navigate(`/properties/${property.id}`)}
                    >
                      {property.title}
                    </h3>
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

export default Favorites;
