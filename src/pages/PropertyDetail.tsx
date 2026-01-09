import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, PropertyDetail as PropertyDetailType, Room } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { PropertyReviews } from '@/components/PropertyReviews';
import { VirtualTourViewer } from '@/components/VirtualTourViewer';
import { ChatDialog } from '@/components/ChatDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { NearbyAmenities } from '@/components/NearbyAmenities';
import { SafetyScore } from '@/components/SafetyScore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  IndianRupee,
  Users,
  Home,
  Wifi,
  Utensils,
  Car,
  Droplet,
  Zap,
  Camera,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';

interface PropertyData extends PropertyDetailType {
  rules?: string;
  available_from?: string;
  virtual_tour_url?: string;
  safety_score?: number;
  nearby_amenities?: {
    metro?: string[];
    hospital?: string[];
    market?: string[];
    school?: string[];
  };
  instant_booking?: boolean;
}

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const data = await api.getProperty(id!);
      setProperty(data as PropertyData);
      setRooms(data.rooms || []);
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

  const handleBooking = async (roomId?: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      await api.createBooking({
        property_id: id!,
        room_id: roomId,
        start_date: new Date().toISOString().split('T')[0],
      });

      toast({
        title: 'Success',
        description: 'Booking request submitted successfully',
      });

      navigate('/bookings');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Property not found</p>
            <Button onClick={() => navigate('/search')}>Back to Search</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Photo Gallery */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="aspect-video rounded-lg overflow-hidden">
              {property.photos && property.photos.length > 0 ? (
                <img
                  src={property.photos[selectedImage]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Camera className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {property.photos?.slice(0, 6).map((photo, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-lg overflow-hidden cursor-pointer ${selectedImage === idx ? 'ring-2 ring-primary' : ''
                    }`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold">{property.title}</h1>
                      <ShareDialog propertyId={property.id} title={property.title} />
                    </div>
                    <div className="flex items-center text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.address}, {property.locality}, {property.city}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {property.gender_preference === 'male' ? 'Boys Only' :
                          property.gender_preference === 'female' ? 'Girls Only' : 'Co-living'}
                      </Badge>
                      {property.safety_score && property.safety_score > 0 && (
                        <SafetyScore score={property.safety_score} />
                      )}
                      {property.instant_booking && (
                        <Badge className="bg-green-100 text-green-700">
                          ⚡ Instant Booking
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 mb-6">
                  <div>
                    <div className="text-2xl font-bold flex items-center">
                      <IndianRupee className="h-6 w-6" />
                      {property.monthly_rent.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                  <div className="border-l pl-6">
                    <div className="text-2xl font-bold flex items-center">
                      <IndianRupee className="h-6 w-6" />
                      {property.deposit.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">security deposit</div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="details" className="mb-6">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="rooms">Rooms</TabsTrigger>
                  <TabsTrigger value="amenities">Amenities</TabsTrigger>
                  <TabsTrigger value="nearby">Nearby</TabsTrigger>
                  <TabsTrigger value="rules">House Rules</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  {property.virtual_tour_url && (
                    <TabsTrigger value="tour">Virtual Tour</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="details" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About This Property</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {property.description || 'No description available.'}
                      </p>
                      <div className="mt-4 text-sm">
                        <strong>Available from:</strong> {new Date(property.available_from).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rooms" className="mt-6">
                  <div className="space-y-4">
                    {rooms.length === 0 ? (
                      <p className="text-muted-foreground">No room details available</p>
                    ) : (
                      rooms.map((room) => (
                        <Card key={room.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {room.room_type}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {room.bed_count} {room.bed_count === 1 ? 'bed' : 'beds'}
                                </p>
                                <p className="text-lg font-semibold mt-2 flex items-center">
                                  <IndianRupee className="h-4 w-4" />
                                  {room.price.toLocaleString()}/month
                                </p>
                              </div>
                              <div>
                                {room.is_available ? (
                                  <Button onClick={() => handleBooking(room.id)}>Book Now</Button>
                                ) : (
                                  <Badge variant="secondary">Not Available</Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="amenities" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {property.amenities?.map((amenity, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {getAmenityIcon(amenity)}
                            <span className="capitalize">{amenity.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="nearby" className="mt-6">
                  <NearbyAmenities amenities={property.nearby_amenities || {}} />
                </TabsContent>

                <TabsContent value="rules" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>House Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{property.rules || 'No specific rules mentioned.'}</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <PropertyReviews propertyId={property.id} />
                </TabsContent>

                {property.virtual_tour_url && (
                  <TabsContent value="tour" className="mt-6">
                    <VirtualTourViewer tourUrl={property.virtual_tour_url} />
                  </TabsContent>
                )}
              </Tabs>
            </div>

            {/* Booking Card */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Contact Owner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold">{property.owner_profile?.name || 'Owner'}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Phone className="h-4 w-4" />
                      {property.owner_profile?.phone || 'Not available'}
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setChatOpen(true)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat with Owner
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => handleBooking()}>
                    Request Booking
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Owner will review your request and contact you
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Dialog */}
      {property && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          propertyId={property.id}
          ownerId={property.owner_id}
          ownerName={property.owner_profile?.name || 'Owner'}
          ownerPhoto={property.owner_profile?.profile_photo}
        />
      )}
    </div>
  );
};

const getAmenityIcon = (amenity: string) => {
  const icons: Record<string, any> = {
    wifi: <Wifi className="h-4 w-4" />,
    food: <Utensils className="h-4 w-4" />,
    parking: <Car className="h-4 w-4" />,
    water: <Droplet className="h-4 w-4" />,
    power_backup: <Zap className="h-4 w-4" />,
  };
  return icons[amenity] || <Home className="h-4 w-4" />;
};

export default PropertyDetail;
