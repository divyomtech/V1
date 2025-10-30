import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { Home, Building2, LayoutDashboard, User, LogOut, Menu, ArrowLeft, Heart, Gift } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { NotificationBell } from "./NotificationBell";

const Header = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleBasedNav = () => {
    if (role === 'owner') return [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'My Properties', href: '/owner/properties', icon: Building2 },
      { label: 'Bookings', href: '/owner/bookings', icon: Building2 },
    ];
    if (role === 'admin') return [{ label: 'Admin Dashboard', href: '/', icon: LayoutDashboard }];
    return [
      { label: 'Search PGs', href: '/search', icon: Home },
      { label: 'Favorites', href: '/favorites', icon: Heart },
      { label: 'Find Roommate', href: '/roommate-match', icon: User },
      { label: 'My Bookings', href: '/bookings', icon: Building2 },
      { label: 'Referrals', href: '/referrals', icon: Gift },
    ];
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-secondary backdrop-blur supports-[backdrop-filter]:bg-secondary/95">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          {location.pathname !== '/' && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">He&She</h1>
          </Link>
        </div>
        
        {user && (
          <>
            <nav className="hidden md:flex items-center gap-6">
              {getRoleBasedNav().map((item) => (
                <Link key={item.href} to={item.href} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex"><User className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Sheet>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
                <SheetContent>
                  <nav className="flex flex-col gap-4 mt-8">
                    {getRoleBasedNav().map((item) => (
                      <Link key={item.href} to={item.href} className="flex items-center gap-2"><item.icon className="h-4 w-4" />{item.label}</Link>
                    ))}
                    <DropdownMenuSeparator />
                    <Link to="/profile" className="flex items-center gap-2"><User className="h-4 w-4" />Profile</Link>
                    <DropdownMenuSeparator />
                    <button onClick={signOut} className="text-destructive flex items-center gap-2 text-left"><LogOut className="h-4 w-4" />Logout</button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
