import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, BarChart3, TrendingUp, Users, Home, Calendar, IndianRupee } from 'lucide-react';

const AdminAnalytics = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProperties: 0,
        totalBookings: 0,
        pendingKyc: 0,
        monthlyRevenue: 0,
        weeklyBookings: 0,
        customerCount: 0,
        ownerCount: 0,
    });

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/');
            return;
        }
        fetchAnalytics();
    }, [role, navigate]);

    const fetchAnalytics = async () => {
        try {
            const adminStats = await api.getAdminStats();

            // Fetch users for breakdown
            let customers = 0, owners = 0;
            try {
                const users = await api.getAllUsers();
                customers = users.filter((u: any) => u.role === 'customer').length;
                owners = users.filter((u: any) => u.role === 'owner').length;
            } catch (e) {
                console.log('Could not fetch user breakdown');
            }

            setStats({
                totalUsers: adminStats.total_users || customers + owners,
                totalProperties: adminStats.total_properties || 0,
                totalBookings: adminStats.total_bookings || 0,
                pendingKyc: adminStats.pending_kyc_applications || 0,
                monthlyRevenue: 0, // Would come from bookings sum
                weeklyBookings: 0, // Would come from recent bookings
                customerCount: customers,
                ownerCount: owners,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load analytics",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} /> {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`text-3xl font-bold ${color}`}>{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-2">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-8 w-8" /> Analytics Dashboard
                    </h1>
                    <p className="text-muted-foreground">Platform insights and performance metrics</p>
                </div>

                {/* Overview Stats */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="text-blue-500" subtitle={`${stats.customerCount} customers, ${stats.ownerCount} owners`} />
                        <StatCard title="Total Properties" value={stats.totalProperties} icon={Home} color="text-green-500" />
                        <StatCard title="Total Bookings" value={stats.totalBookings} icon={Calendar} color="text-purple-500" />
                        <StatCard title="Pending KYC" value={stats.pendingKyc} icon={TrendingUp} color="text-orange-500" />
                    </div>
                </div>

                {/* User Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Distribution</CardTitle>
                        <CardDescription>Breakdown of users by role</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold text-blue-500">{stats.customerCount}</div>
                                <p className="text-sm text-muted-foreground mt-2">Customers (PG Seekers)</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold text-green-500">{stats.ownerCount}</div>
                                <p className="text-sm text-muted-foreground mt-2">Property Owners</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center">
                                <div className="text-4xl font-bold text-purple-500">{stats.totalProperties}</div>
                                <p className="text-sm text-muted-foreground mt-2">Listed Properties</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Health */}
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Health</CardTitle>
                        <CardDescription>Key performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold mb-4">Conversion Metrics</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Properties per Owner</span>
                                        <span className="font-bold">
                                            {stats.ownerCount > 0 ? (stats.totalProperties / stats.ownerCount).toFixed(1) : 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Bookings per Property</span>
                                        <span className="font-bold">
                                            {stats.totalProperties > 0 ? (stats.totalBookings / stats.totalProperties).toFixed(1) : 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">KYC Approval Rate</span>
                                        <span className="font-bold text-green-500">
                                            {stats.ownerCount > 0 ? Math.round((stats.ownerCount / (stats.ownerCount + stats.pendingKyc)) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/bookings')}>
                                        <Calendar className="h-4 w-4 mr-2" /> View All Bookings
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/properties')}>
                                        <Home className="h-4 w-4 mr-2" /> Moderate Properties
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/settings')}>
                                        <TrendingUp className="h-4 w-4 mr-2" /> Configure Settings
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminAnalytics;
