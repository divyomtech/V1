import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Calendar, IndianRupee, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Booking {
    id: string;
    property_title: string;
    customer_name: string;
    owner_name: string;
    status: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    created_at: string;
}

interface Payment {
    id: string;
    booking_id: string;
    amount: number;
    status: string;
    payment_type: string;
    transaction_id: string;
    payment_date: string;
}

const AdminBookings = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState({
        totalBookings: 0,
        activeBookings: 0,
        totalRevenue: 0,
        pendingPayments: 0,
    });

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/');
            return;
        }
        fetchData();
    }, [role, navigate]);

    const fetchData = async () => {
        try {
            // Fetch admin stats
            const adminStats = await api.getAdminStats();

            // Fetch all bookings (admin endpoint)
            let allBookings: Booking[] = [];
            try {
                const response = await api.getAllBookings();
                allBookings = response;
            } catch (e) {
                console.log('Using fallback booking data');
            }

            setBookings(allBookings);

            // Only count revenue from PAID bookings (not accepted since payment is still pending)
            const paidStatuses = ['paid', 'active', 'completed', 'checked_in'];
            const confirmedBookings = allBookings.filter(b => paidStatuses.includes(b.status));

            setStats({
                totalBookings: adminStats.total_bookings || allBookings.length,
                activeBookings: allBookings.filter(b => b.status === 'active' || b.status === 'paid').length,
                totalRevenue: confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
                pendingPayments: allBookings.filter(b => b.status === 'pending' || b.status === 'requested').length,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load data",
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            'active': 'bg-green-500',
            'paid': 'bg-green-500',
            'pending': 'bg-yellow-500',
            'requested': 'bg-orange-500',
            'completed': 'bg-blue-500',
            'cancelled': 'bg-red-500',
        };
        return <Badge className={variants[status] || 'bg-gray-500'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-2">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold">Bookings & Payments</h1>
                        <p className="text-muted-foreground">Monitor all platform bookings and transactions</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Total Bookings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalBookings}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" /> Active Bookings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-500">{stats.activeBookings}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <IndianRupee className="h-4 w-4" /> Total Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary">₹{stats.totalRevenue.toLocaleString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Pending Payments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-500">{stats.pendingPayments}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bookings Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Bookings</CardTitle>
                        <CardDescription>View and manage platform bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {bookings.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No bookings found</p>
                        ) : (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <Card key={booking.id}>
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">{booking.property_title || 'Property'}</span>
                                                        {getStatusBadge(booking.status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Customer: {booking.customer_name || 'Unknown'} | Owner: {booking.owner_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {booking.start_date ? new Date(booking.start_date).toLocaleDateString() : 'N/A'} - {booking.end_date ? new Date(booking.end_date).toLocaleDateString() : 'Ongoing'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold">₹{booking.total_amount?.toLocaleString() || 0}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(booking.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminBookings;
