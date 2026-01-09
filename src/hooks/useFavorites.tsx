import { useState, useEffect } from 'react';
import { api, Favorite } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useFavorites = (userId: string | undefined) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    } else {
      setFavorites(new Set());
      setLoading(false);
    }
  }, [userId]);

  const fetchFavorites = async () => {
    try {
      const data = await api.getFavorites();
      setFavorites(new Set(data.map(f => f.property_id)));
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!userId) {
      toast({
        title: 'Login Required',
        description: 'Please login to save favorites',
        variant: 'destructive',
      });
      return;
    }

    const isFavorite = favorites.has(propertyId);

    try {
      if (isFavorite) {
        await api.removeFavorite(propertyId);

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });

        toast({
          title: 'Removed from favorites',
          description: 'Property removed from your wishlist',
        });
      } else {
        await api.addFavorite(propertyId);

        setFavorites(prev => new Set(prev).add(propertyId));

        toast({
          title: 'Added to favorites',
          description: 'Property saved to your wishlist',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return { favorites, toggleFavorite, loading };
};
