import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Home, Search, Heart, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, role } = useAuth();
    const { favorites } = useFavorites();

    // Don't show if user is not logged in
    if (!user) {
        return null;
    }

    // Don't show for owner or admin users
    if (role === 'owner' || role === 'admin') {
        return null;
    }

    // Don't show on auth page
    if (location.pathname === '/auth') {
        return null;
    }

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
            <div className="flex items-center justify-around h-16 max-w-screen-sm mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
                >
                    <Home
                        className={`h-6 w-6 transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}
                        fill={isActive('/') ? 'currentColor' : 'none'}
                    />
                    {isActive('/') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
                </button>

                <button
                    onClick={() => navigate('/search')}
                    className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
                >
                    <Search
                        className={`h-6 w-6 transition-colors ${isActive('/search') ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    {isActive('/search') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
                </button>

                <button
                    onClick={() => navigate('/favorites')}
                    className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
                >
                    <div className="relative">
                        <Heart
                            className={`h-6 w-6 transition-colors ${isActive('/favorites') ? 'text-primary' : 'text-muted-foreground'}`}
                            fill={isActive('/favorites') ? 'currentColor' : 'none'}
                        />
                        {favorites.size > 0 && (
                            <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                                {favorites.size}
                            </Badge>
                        )}
                    </div>
                    {isActive('/favorites') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
                </button>

                <button
                    onClick={() => navigate('/bookings')}
                    className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
                >
                    <Calendar
                        className={`h-6 w-6 transition-colors ${isActive('/bookings') ? 'text-primary' : 'text-muted-foreground'}`}
                        fill={isActive('/bookings') ? 'currentColor' : 'none'}
                    />
                    {isActive('/bookings') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
                </button>

                <button
                    onClick={() => navigate('/profile')}
                    className="flex flex-col items-center justify-center w-full h-full transition-colors relative"
                >
                    <User
                        className={`h-6 w-6 transition-colors ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}
                        fill={isActive('/profile') ? 'currentColor' : 'none'}
                    />
                    {isActive('/profile') && <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-t-full" />}
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;
