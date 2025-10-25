import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, IndianRupee, MapPin, Home } from 'lucide-react';

interface Booking {
  id: string;
  status: string;
  start_date: string;
  amount: number;
  created_at: string;
  properties: {
    title: string;
    city: string;
    locality: string;
    photos: string[];
  };
  rooms?: {
    room_type: string;
    bed_count: number;
  };
}

const Bookings = () => {
  const navigate = useNavigate();
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
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (title, city, locality, photos),
          rooms (room_type, bed_count)
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      cancelled: 'bg-gray-500',
    };
    return colors[status] || 'bg-blue-500';
  };

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings;
    if (status === 'pending') return bookings.filter((b) => b.status === 'requested');
    if (status === 'active') return bookings.filter((b) => ['approved', 'paid'].includes(b.status));
    if (status === 'past') return bookings.filter((b) => ['cancelled', 'rejected', 'completed'].includes(b.status));
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
          <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            {['all', 'pending', 'active', 'past'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {filterBookings(tab).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Home className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Bookings Found</h3>
                      <p className="text-muted-foreground mb-6">Start searching for your perfect PG</p>
                      <Button onClick={() => navigate('/search')}>
                        Search Properties
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filterBookings(tab).map((booking) => (
                      <Card key={booking.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-48 h-48 md:h-auto relative">
                              {booking.properties.photos && booking.properties.photos[0] ? (
                                <img
                                  src={booking.properties.photos[0]}
                                  alt={booking.properties.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Home className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-xl font-semibold mb-2">{booking.properties.title}</h3>
                                  <div className="flex items-center text-muted-foreground mb-2">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {booking.properties.locality}, {booking.properties.city}
                                  </div>
                                  {booking.rooms && (
                                    <p className="text-sm text-muted-foreground">
                                      {booking.rooms.room_type} • {booking.rooms.bed_count} beds
                                    </p>
                                  )}
                                </div>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
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

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/bookings/${booking.id}`)}
                                >
                                  View Details
                                </Button>
                                {booking.status === 'requested' && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const { error } = await supabase
                                          .from('bookings')
                                          .update({ status: 'cancelled' })
                                          .eq('id', booking.id);

                                        if (error) throw error;

                                        toast({
                                          title: 'Success',
                                          description: 'Booking cancelled',
                                        });

                                        fetchBookings();
                                      } catch (error: any) {
                                        toast({
                                          variant: 'destructive',
                                          title: 'Error',
                                          description: error.message,
                                        });
                                      }
                                    }}
                                  >
                                    Cancel Request
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
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

export default Bookings;
