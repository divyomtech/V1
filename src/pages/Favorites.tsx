import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Property } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/contexts/FavoritesContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, IndianRupee, Camera, Wifi, Utensils, Share2, Star } from 'lucide-react';
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
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <div className="container py-8">
          <div className="text-center">Loading your favorites...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
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
                  <CardContent className="p-4 flex flex-col">
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
                          toast({
                            title: "Coming Soon",
                            description: "Share feature coming soon!",
                          });
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>

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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
