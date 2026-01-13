import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Favorite } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FavoritesContextType {
    favorites: Set<string>;
    toggleFavorite: (propertyId: string) => Promise<void>;
    loading: boolean;
    refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchFavorites = async () => {
        if (!user?.id) {
            setFavorites(new Set());
            setLoading(false);
            return;
        }

        try {
            const data = await api.getFavorites();
            setFavorites(new Set(data.map((f: any) => f.property_id)));
        } catch (error: any) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [user?.id]);

    const toggleFavorite = async (propertyId: string) => {
        if (!user?.id) {
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

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, loading, refetch: fetchFavorites }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        // Fallback for when used outside provider
        return { favorites: new Set<string>(), toggleFavorite: async () => { }, loading: false, refetch: async () => { } };
    }
    return context;
};

// Keep backward compatibility - exported function with same name
export const useFavoritesLegacy = (userId: string | undefined) => {
    const context = useFavorites();
    return context;
};
