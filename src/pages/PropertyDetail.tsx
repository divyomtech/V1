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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  Clock,
  Calendar,
  CheckCircle2,
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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [stayType, setStayType] = useState<'monthly' | 'daily'>('monthly');
  const [dailyDuration, setDailyDuration] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [pendingBookingRoom, setPendingBookingRoom] = useState<Room | null>(null);
  const [monthlyDuration, setMonthlyDuration] = useState(1);

  // Auto-select the highest sharing type with vacancies when rooms change
  useEffect(() => {
    if (rooms.length > 0) {
      // Prioritize rooms with vacancies, then sort by bed_count descending
      const sorted = [...rooms].sort((a, b) => {
        const aAvailable = (a.vacancy_count || 0) > 0;
        const bAvailable = (b.vacancy_count || 0) > 0;

        if (aAvailable && !bAvailable) return -1;
        if (!aAvailable && bAvailable) return 1;

        return (a.price || 0) - (b.price || 0);
      });

      setSelectedRoom(sorted[0]);
    } else {
      setSelectedRoom(null);
    }
  }, [rooms]);

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
      const bookingData: any = {
        property_id: id!,
        room_id: roomId,
        start_date: startDate,
        stay_type: stayType,
      };

      if (stayType === 'daily') {
        bookingData.duration_days = dailyDuration;
        // Calculate end date for UI/Backend clarity
        const end = new Date(startDate);
        end.setDate(end.getDate() + dailyDuration);
        bookingData.end_date = end.toISOString().split('T')[0];
      } else {
        // Monthly stay - calculate end date based on months
        bookingData.duration_months = monthlyDuration;
        const end = new Date(startDate);
        end.setMonth(end.getMonth() + monthlyDuration);
        bookingData.end_date = end.toISOString().split('T')[0];
      }

      await api.createBooking(bookingData);

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
                      {property.safety_score !== undefined && property.safety_score > 0 && (
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

                {/* Pricing Summary Dialog */}
                <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-primary" />
                        Pricing Details
                      </DialogTitle>
                      <DialogDescription>
                        Breakdown for {selectedRoom?.room_type} stay at {property.title}.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                      <div className="space-y-2 text-sm border p-4 rounded-xl bg-muted/20">
                        {stayType === 'monthly' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Monthly Rent:</span>
                              <span className="font-semibold">₹{(selectedRoom?.monthly_price || selectedRoom?.price || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Security Deposit:</span>
                              <span className="font-semibold">₹{(selectedRoom?.security_deposit ?? selectedRoom?.deposit ?? property.deposit ?? 0).toLocaleString()}</span>
                            </div>
                            {property.maintenance_charge !== undefined && property.maintenance_charge > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Maintenance:</span>
                                <span className="font-semibold">₹{property.maintenance_charge.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-3 border-t-2 border-dashed font-bold text-lg text-primary">
                              <span>Total Check-in:</span>
                              <span>₹{((selectedRoom?.monthly_price || selectedRoom?.price || 0) + (selectedRoom?.security_deposit ?? selectedRoom?.deposit ?? property.deposit ?? 0) + (property.maintenance_charge || 0)).toLocaleString()}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Daily Price:</span>
                              <span className="font-semibold">₹{(selectedRoom?.daily_price || selectedRoom?.price || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Stay Duration:</span>
                              <span className="font-semibold">{dailyDuration} {dailyDuration === 1 ? 'day' : 'days'}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t-2 border-dashed font-bold text-xl text-primary">
                              <span>Total to Pay:</span>
                              <span>₹{((selectedRoom?.daily_price || selectedRoom?.price || 0) * dailyDuration).toLocaleString()}</span>
                            </div>

                            {selectedRoom?.complementaries && selectedRoom.complementaries.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="font-semibold mb-2 flex items-center gap-1 text-xs">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  Included Benefits:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedRoom.complementaries.map((comp, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-100 text-[9px] px-2 py-0">
                                      {comp.charAt(0).toUpperCase() + comp.slice(1).replace(/_/g, ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {selectedRoom?.vacancy_count !== undefined && selectedRoom.vacancy_count > 0 && (
                        <div className="flex justify-between mt-2 pt-2 border-t text-muted-foreground text-xs italic">
                          <span>Availability:</span>
                          <span>{selectedRoom.vacancy_count} {selectedRoom.vacancy_count === 1 ? 'bed' : 'beds'} left</span>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button className="w-full" onClick={() => setIsSummaryOpen(false)}>Done</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Tabs Section */}
                <Tabs defaultValue="details" className="mb-6">
                  <TabsList className="flex-wrap">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="rooms">Rooms</TabsTrigger>
                    <TabsTrigger value="amenities">Amenities</TabsTrigger>
                    <TabsTrigger value="nearby">Nearby</TabsTrigger>
                    <TabsTrigger value="rules">House Rules</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    <TabsTrigger value="languages">Languages</TabsTrigger>
                    {property.virtual_tour_url && (
                      <TabsTrigger value="tour">Virtual Tour</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="details" className="mt-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>About This Property</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <p className="text-muted-foreground">
                          {property.description || 'No description available.'}
                        </p>

                        {selectedRoom && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Room Area</span>
                              <div className="flex items-center gap-2 font-semibold">
                                <Badge className="bg-blue-50 text-blue-700 border-blue-100">{selectedRoom.area_sqft || '---'} Sq Ft</Badge>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Room Width</span>
                              <div className="flex items-center gap-2 font-semibold">
                                <Badge variant="outline" className="border-muted-foreground/30">{selectedRoom.width_ft || '---'} Ft Wide</Badge>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ventilation</span>
                              <div className="flex items-center gap-2 font-semibold">
                                <Badge className={selectedRoom.has_ventilation !== false ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}>
                                  {selectedRoom.has_ventilation !== false ? 'Ventilated' : 'No Ventilation'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 text-sm bg-muted/30 p-3 rounded-lg flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span><strong>Available from:</strong> {new Date(property.available_from || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="rooms" className="mt-6">
                    <Card className="border-amber-200 bg-amber-50/30">
                      <CardContent className="p-6 space-y-6">
                        {/* Stay Type Toggle inside Rooms tab */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="bg-muted p-1 rounded-xl inline-flex gap-1">
                            <button
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${stayType === 'monthly' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                              onClick={() => setStayType('monthly')}
                            >
                              <Home className="h-4 w-4" />
                              Monthly Stay
                            </button>
                            <button
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${stayType === 'daily' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                              onClick={() => setStayType('daily')}
                            >
                              <Calendar className="h-4 w-4" />
                              Daily Basis Stay
                            </button>
                          </div>
                        </div>

                        {/* Sharing Type Filter inside Rooms tab */}
                        {rooms.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              Select Sharing Type
                              <Badge variant="secondary" className="text-[10px] py-0">{stayType === 'monthly' ? 'Monthly' : 'Daily'}</Badge>
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {rooms.map((room) => {
                                const isFull = room.vacancy_count === 0;
                                const isLow = room.vacancy_count !== undefined && room.vacancy_count > 0 && room.vacancy_count <= 2;

                                return (
                                  <div key={room.id} className="relative group">
                                    <Button
                                      variant={selectedRoom?.id === room.id ? 'default' : 'outline'}
                                      disabled={isFull}
                                      className={`
                                        ${selectedRoom?.id === room.id ? 'bg-primary hover:bg-primary/90' : ''}
                                        ${isFull ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                                      `}
                                      onClick={() => setSelectedRoom(room)}
                                    >
                                      {room.room_type}
                                      {room.vacancy_count !== undefined && (
                                        <span className="ml-2 text-[10px] opacity-80">
                                          ({isFull ? 'Full' : `${room.vacancy_count} left`})
                                        </span>
                                      )}
                                    </Button>
                                    {isLow && !isFull && (
                                      <Badge className="absolute -top-2 -right-2 px-1 text-[8px] bg-red-500 text-white animate-pulse">
                                        Limited
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Pricing Summary */}
                        <div className="flex flex-wrap gap-6 p-4 bg-background rounded-xl border">
                          <div>
                            <div className="text-2xl font-bold flex items-center text-primary">
                              <IndianRupee className="h-5 w-5" />
                              {(stayType === 'monthly'
                                ? (selectedRoom?.monthly_price || selectedRoom?.price || property.monthly_rent || 0)
                                : (selectedRoom?.daily_price || 0)
                              ).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">per {stayType === 'monthly' ? 'month' : 'day'}</div>
                          </div>
                          {stayType === 'monthly' && (
                            <>
                              <div className="border-l pl-6">
                                <div className="text-2xl font-bold flex items-center text-primary">
                                  <IndianRupee className="h-5 w-5" />
                                  {(selectedRoom?.security_deposit ?? selectedRoom?.deposit ?? property.deposit ?? 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">security deposit</div>
                              </div>
                              {property.maintenance_charge !== undefined && property.maintenance_charge > 0 && (
                                <div className="border-l pl-6">
                                  <div className="text-2xl font-bold flex items-center text-primary">
                                    <IndianRupee className="h-5 w-5" />
                                    {property.maintenance_charge.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">maintenance</div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Room Cards */}
                        <div className="space-y-4">
                          {rooms.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8 italic">
                              No rooms available for this property.
                            </p>
                          ) : (
                            rooms.map((room) => {
                              const isFull = room.vacancy_count === 0;
                              return (
                                <Card
                                  key={room.id}
                                  className={`
                                      transition-all duration-300 border-amber-200
                                      ${selectedRoom?.id === room.id ? 'ring-2 ring-primary border-primary bg-amber-50' : 'bg-white'}
                                      ${isFull ? 'opacity-75 bg-muted/50' : 'hover:border-primary/50'}
                                    `}
                                >
                                  <CardContent className="p-5">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {room.floor_number !== undefined && (
                                        <Badge variant="outline" className="text-xs">
                                          Floor {room.floor_number}
                                        </Badge>
                                      )}
                                      {room.room_number && (
                                        <Badge variant="outline" className="text-xs">
                                          Room {room.room_number}
                                        </Badge>
                                      )}
                                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                        Ventilated
                                      </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="font-semibold flex items-center gap-2 text-lg">
                                          <Users className="h-5 w-5" />
                                          {room.room_type}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {room.bed_count} {room.bed_count === 1 ? 'bed' : 'beds'}
                                        </p>
                                        <p className="text-xl font-bold mt-2 flex items-center text-primary">
                                          <IndianRupee className="h-4 w-4" />
                                          {(stayType === 'monthly'
                                            ? (room.monthly_price || room.price || 0)
                                            : (room.daily_price || 0)
                                          ).toLocaleString()}/{stayType === 'monthly' ? 'month' : 'day'}
                                        </p>
                                        {room.vacancy_count !== undefined && (
                                          <Badge
                                            variant="outline"
                                            className={`mt-2 ${isFull ? 'text-muted-foreground border-muted' : 'text-primary border-primary/20 bg-primary/10'}`}
                                          >
                                            {isFull ? 'No Vacancy' : `${room.vacancy_count} ${room.vacancy_count === 1 ? 'vacancy' : 'vacancies'}`}
                                          </Badge>
                                        )}
                                      </div>
                                      <div>
                                        {(room.is_available && !isFull) ? (
                                          <Button
                                            className="bg-amber-500 hover:bg-amber-600 text-white"
                                            onClick={() => {
                                              setPendingBookingRoom(room);
                                              setBookingDialogOpen(true);
                                            }}
                                          >
                                            Book Now
                                          </Button>
                                        ) : (
                                          <Badge variant="secondary" className="px-4 py-2">
                                            {isFull ? 'Fully Booked' : 'Not Available'}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="amenities" className="mt-6">
                    <Card>
                      <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Property Amenities</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {property.amenities?.map((amenity, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                {getAmenityIcon(amenity)}
                                <span className="capitalize">{amenity.replace('_', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {selectedRoom?.complementaries && selectedRoom.complementaries.length > 0 && (
                          <div className="space-y-4 pt-6 border-t font-semibold">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Room-Specific Complementaries
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {selectedRoom.complementaries.map((comp, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 text-green-700 border border-green-100">
                                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center bg-green-500 text-white shrink-0">
                                    +
                                  </Badge>
                                  <span className="capitalize">{comp.replace(/_/g, ' ')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

                  <TabsContent value="languages" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Languages Spoken By Host
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {property.owner_profile?.languages_known && property.owner_profile.languages_known.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {property.owner_profile.languages_known.map((lang, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span className="font-medium">{lang}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No languages specified by the host.</p>
                        )}
                      </CardContent>
                    </Card>
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

                    {/* Owner Availability Time */}
                    <div className="mt-3 pt-3 border-t w-full">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-medium text-green-700">09:00 - 21:00</span>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {day}
                          </Badge>
                        ))}
                      </div>
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
                        <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
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
                    onClick={() => navigate(`/host/${property.owner_id}`)}
                  >
                    View All Properties by Host
                  </Button>

                  {rooms.every(r => r.vacancy_count === 0) && rooms.length > 0 && (
                    <p className="text-sm text-red-500 font-semibold text-center mt-2">
                      No Vacancy Available for this Property
                    </p>
                  )}
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
      </div>

      {/* Booking Calendar Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Select Check-in Date
            </DialogTitle>
            <DialogDescription>
              Choose your check-in date and stay duration for {pendingBookingRoom?.room_type || 'this room'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Check-in Date Picker */}
            <div className="space-y-2">
              <Label className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Check-in Date
              </Label>
              <Input
                type="date"
                value={startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-lg font-medium"
              />
              <p className="text-xs text-muted-foreground">
                Select the date you want to move in
              </p>
            </div>

            {/* Duration Selector */}
            {stayType === 'monthly' ? (
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Stay Duration
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMonthlyDuration(Math.max(1, monthlyDuration - 1))}
                    disabled={monthlyDuration <= 1}
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-bold">{monthlyDuration}</span>
                    <span className="text-muted-foreground ml-2">{monthlyDuration === 1 ? 'month' : 'months'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMonthlyDuration(monthlyDuration + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Stay Duration
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDailyDuration(Math.max(1, dailyDuration - 1))}
                    disabled={dailyDuration <= 1}
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-bold">{dailyDuration}</span>
                    <span className="text-muted-foreground ml-2">{dailyDuration === 1 ? 'day' : 'days'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDailyDuration(dailyDuration + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            {/* Booking Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Booking Summary</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in Date:</span>
                  <span className="font-medium">{new Date(startDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out Date:</span>
                  <span className="font-medium">
                    {(() => {
                      const end = new Date(startDate);
                      if (stayType === 'monthly') {
                        end.setMonth(end.getMonth() + monthlyDuration);
                      } else {
                        end.setDate(end.getDate() + dailyDuration);
                      }
                      return end.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Type:</span>
                  <span className="font-medium">{pendingBookingRoom?.room_type}</span>
                </div>
                <div className="flex justify-between pt-2 border-t mt-2">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold text-primary">
                    ₹{(stayType === 'monthly'
                      ? ((pendingBookingRoom?.monthly_price || pendingBookingRoom?.price || 0) * monthlyDuration) + (pendingBookingRoom?.security_deposit ?? pendingBookingRoom?.deposit ?? property?.deposit ?? 0) + (property?.maintenance_charge || 0)
                      : (pendingBookingRoom?.daily_price || 0) * dailyDuration
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                if (pendingBookingRoom) {
                  handleBooking(pendingBookingRoom.id);
                  setBookingDialogOpen(false);
                  setPendingBookingRoom(null);
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms Dialog */}
      < Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen} >
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

export default PropertyDetail;
