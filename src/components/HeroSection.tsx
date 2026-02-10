import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Content */}
      <div className="container relative z-10 px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Find Your Perfect <span className="text-primary">PG</span> Home
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
          Discover safe, comfortable, and affordable paying guest accommodations
        </p>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Enter city, locality or PG name"
                className="pl-12 h-14 text-lg border-0 bg-secondary focus-visible:ring-0"
              />
            </div>
            <Button
              size="lg"
              className="h-14 px-8 text-lg"
            >
              <Search className="mr-2 h-5 w-5" />
              Search
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            <Button variant="outline" size="sm" className="rounded-full">
              Boys PG
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              Girls PG
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              Co-living PG
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              AC Rooms
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              With Food
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
