import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Wifi, Coffee, Car, Utensils } from "lucide-react";

const pgListings = [
  {
    id: 1,
    name: "Sunrise PG for Boys",
    location: "Koramangala, Bangalore",
    price: "₹8,500",
    rating: 4.5,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
    gender: "Boys",
    amenities: ["WiFi", "Food", "Parking"],
  },
  {
    id: 2,
    name: "Comfort Stay Girls PG",
    location: "HSR Layout, Bangalore",
    price: "₹9,000",
    rating: 4.7,
    reviews: 256,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    gender: "Girls",
    amenities: ["WiFi", "AC", "Food"],
  },
  {
    id: 3,
    name: "Prime Location Unisex PG",
    location: "Indiranagar, Bangalore",
    price: "₹10,000",
    rating: 4.6,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
    gender: "Unisex",
    amenities: ["WiFi", "Food", "AC"],
  },
  {
    id: 4,
    name: "Modern Boys Hostel",
    location: "Whitefield, Bangalore",
    price: "₹7,500",
    rating: 4.3,
    reviews: 67,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
    gender: "Boys",
    amenities: ["WiFi", "Parking"],
  },
];

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  Food: Utensils,
  Parking: Car,
  AC: Coffee,
};

const FeaturedPGs = () => {
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
          {pgListings.map((pg) => (
            <Card 
              key={pg.id} 
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={pg.image} 
                  alt={pg.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Badge 
                  className="absolute top-3 right-3 bg-primary text-primary-foreground"
                >
                  {pg.gender}
                </Badge>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{pg.name}</h3>
                
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="line-clamp-1">{pg.location}</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{pg.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({pg.reviews} reviews)
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                  {pg.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity];
                    return (
                      <div 
                        key={amenity} 
                        className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full"
                      >
                        {Icon && <Icon className="h-3 w-3" />}
                        <span>{amenity}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary">{pg.price}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button className="w-full bg-primary hover:bg-primary-hover">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="px-8">
            View All PGs
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPGs;
