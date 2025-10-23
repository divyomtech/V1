import { Button } from "@/components/ui/button";
import { MapPin, Menu, User } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">He&She</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium transition-colors hover:text-primary">
            Find PG
          </a>
          <a href="#" className="text-sm font-medium transition-colors hover:text-primary">
            List Your PG
          </a>
          <a href="#" className="text-sm font-medium transition-colors hover:text-primary">
            About
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <MapPin className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="hidden md:flex">
            <User className="mr-2 h-4 w-4" />
            Login
          </Button>
          <Button className="hidden md:flex bg-primary hover:bg-primary-hover">
            Sign Up
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
