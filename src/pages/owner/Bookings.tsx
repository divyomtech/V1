import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, IndianRupee, MapPin, User, Home, CheckCircle, XCircle } from 'lucide-react';

interface Booking {
  id: string;
  status: string;
  start_date: string;
  amount: number;
  created_at: string;
  property?: {
    title: string;
  };
  customer_name?: string;
  customer_phone?: string;
}

const OwnerBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      // Get bookings from API - filter owner's bookings on the client for now
      const data = await api.getBookings();
      setBookings(data || []);
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

  const handleBookingAction = async (bookingId: string, newStatus: 'accepted' | 'cancelled') => {
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      // Update UI
      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
      toast({
        title: newStatus === 'accepted' ? 'Booking Approved' : 'Booking Rejected',
        description: `Booking has been ${newStatus === 'accepted' ? 'approved' : 'rejected'} successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update booking status',
      });
    }
  };

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings;
    if (status === 'requests') return bookings.filter((b) => b.status === 'requested');
    if (status === 'active') return bookings.filter((b) => ['approved', 'paid'].includes(b.status));
    return bookings;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Booking Requests</h1>

          <Tabs defaultValue="requests">
            <TabsList className="mb-6">
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            {['requests', 'active', 'all'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {filterBookings(tab).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Home className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Bookings Found</h3>
                      <p className="text-muted-foreground">No booking requests at the moment</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filterBookings(tab).map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <h3 className="font-semibold text-lg">{booking.customer_name || 'Guest'}</h3>
                                  <p className="text-sm text-muted-foreground">{booking.customer_phone || ''}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <Home className="h-4 w-4" />
                                <span className="font-medium">{booking.property?.title || 'Property'}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <div className="text-sm text-muted-foreground mb-1">Move-in Date</div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(booking.start_date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground mb-1">Monthly Rent</div>
                                  <div className="flex items-center font-semibold">
                                    <IndianRupee className="h-4 w-4" />
                                    {booking.amount.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Badge
                              variant={booking.status === 'requested' ? 'default' : 'secondary'}
                            >
                              {booking.status}
                            </Badge>
                          </div>

                          {booking.status === 'requested' && (
                            <div className="flex gap-2 mt-4">
                              <Button
                                className="flex-1"
                                onClick={() => handleBookingAction(booking.id, 'accepted')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleBookingAction(booking.id, 'cancelled')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default OwnerBookings;
