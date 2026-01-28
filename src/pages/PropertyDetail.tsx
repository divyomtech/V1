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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
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
  Star,
  ExternalLink,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [hostInfoRevealed, setHostInfoRevealed] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background pb-24">
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
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {/* Main Grid: Image Gallery + Host Card */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Image Carousel (2/3 width) */}
            <div className="md:col-span-2">
              <div className="relative rounded-xl overflow-hidden bg-muted">
                {property.photos && property.photos.length > 0 ? (
                  <>
                    <div className="aspect-[16/10]">
                      <img
                        src={property.photos[selectedImage]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Navigation Arrows */}
                    {property.photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImage(prev => prev === 0 ? property.photos!.length - 1 : prev - 1)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setSelectedImage(prev => prev === property.photos!.length - 1 ? 0 : prev + 1)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    {/* Share Button */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <ShareDialog propertyId={property.id} title={property.title} />
                    </div>
                    {/* Dot Navigation */}
                    {property.photos.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {property.photos.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${selectedImage === idx
                                ? 'bg-white w-6'
                                : 'bg-white/60 hover:bg-white/80'
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="aspect-[16/10] flex items-center justify-center">
                    <Camera className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Property Info Section */}
              <div className="mt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold">{property.title}</h1>
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
                      <IndianRupee className="h-5 w-5" />
                      {property.monthly_rent.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                  <div className="border-l pl-6">
                    <div className="text-2xl font-bold flex items-center">
                      <IndianRupee className="h-5 w-5" />
                      {property.deposit.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">security deposit</div>
                  </div>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="details" className="mb-6">
                  <TabsList className="flex-wrap">
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
                          <strong>Available from:</strong> {new Date(property.available_from || Date.now()).toLocaleDateString()}
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
                    {property.nearby_amenities && (
                      <NearbyAmenities amenities={property.nearby_amenities} />
                    )}
                  </TabsContent>

                  <TabsContent value="rules" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>House Rules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-line">
                          {property.rules || 'No specific house rules mentioned.'}
                        </p>
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
            </div>

            {/* Right: Sticky Sidebar */}
            <div className="space-y-4 md:sticky md:top-24 md:self-start">
              {/* Host Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Property Host</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 mb-3">
                      <AvatarImage src={property.owner_profile?.profile_photo} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {(property.owner_profile?.name || 'O').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-lg">{property.owner_profile?.name || 'Owner'}</p>
                    <p className="text-sm text-muted-foreground">Property Host</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{property.average_rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-muted-foreground text-sm">({property.review_count || 0} reviews)</span>
                    </div>
                  </div>

                  {/* Reveal Host Info */}
                  {!hostInfoRevealed ? (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => setTermsDialogOpen(true)}
                    >
                      Reveal Host Info
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {property.owner_profile?.phone && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${property.owner_profile.phone}`} className="text-sm hover:text-primary">
                            {property.owner_profile.phone}
                          </a>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setChatOpen(true)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email Host
                      </Button>
                      {property.owner_profile?.phone && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => window.open(`https://wa.me/91${property.owner_profile?.phone?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => navigate(`/search?owner_id=${property.owner_id}`)}
                  >
                    View All Properties by Host
                  </Button>

                  <Button className="w-full" variant="default" onClick={() => handleBooking()}>
                    Request Booking
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Owner will review your request and contact you
                  </p>
                </CardContent>
              </Card>

              {/* Location Card with Google Map */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden mb-3 border h-40">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        `${property.address}, ${property.locality}, ${property.city}`
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    📍 {property.address}, {property.locality}, {property.city}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${property.address}, ${property.locality}, ${property.city}`
                      )}`,
                      '_blank'
                    )}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Terms Dialog */}
        <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Terms and Conditions</DialogTitle>
              <DialogDescription>
                Please read and accept the terms before proceeding.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Important Notice</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  He&She PG is just a platform that connects users with property hosts.
                  He&She PG is not responsible for any disputes, damages, or issues that may arise between
                  users and hosts. By proceeding, you acknowledge that any transactions or agreements
                  are directly between you and the property host.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAgreed}
                  onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none"
                >
                  I agree to the terms and conditions
                </label>
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => {
                setTermsDialogOpen(false);
                setTermsAgreed(false);
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (termsAgreed) {
                    setHostInfoRevealed(true);
                    setTermsDialogOpen(false);
                  }
                }}
                disabled={!termsAgreed}
                className="bg-primary hover:bg-primary/90"
              >
                Accept & Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
    </div>
  );
};

export default PropertyDetail;
