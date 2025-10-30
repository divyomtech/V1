import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Calendar, Plus, IndianRupee, TrendingUp, User, FileText, MessageSquare, CreditCard, Settings, Search, Eye, Edit, MapPin, Bed, Zap, Shield, Clock, Bell, BarChart3, Wallet, UserCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AnalyticsDashboard from "@/components/owner/AnalyticsDashboard";
import FinancialTracking from "@/components/owner/FinancialTracking";
import TenantManagement from "@/components/owner/TenantManagement";
import heroBackground from "@/assets/hero-bg.jpg";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeBookings: 0,
    pendingRequests: 0,
    monthlyRevenue: 0,
    totalTenants: 0,
    pendingPayments: 0
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [reminders, setReminders] = useState({
    paymentReminders: false,
    maintenanceReminders: false
  });
  const [payments, setPayments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState({
    monthlyData: [],
    occupancyRate: 0,
    totalRevenue: 0,
    revenueTrend: 0,
    propertyPerformance: []
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [propertiesRes, bookingsRes, profileRes, paymentsRes] = await Promise.all([
        supabase.from('properties').select('*').eq('owner_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, properties!inner(owner_id, title), profiles!bookings_customer_id_fkey(name, phone, profile_photo)').eq('properties.owner_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user?.id).single(),
        supabase.from('payments').select('*, bookings!inner(properties!inner(owner_id, title), customer_id, profiles!bookings_customer_id_fkey(name))').eq('bookings.properties.owner_id', user?.id).order('created_at', { ascending: false })
      ]);

      if (propertiesRes.data) {
        setProperties(propertiesRes.data);
        setStats(prev => ({ ...prev, totalProperties: propertiesRes.data.length }));
      }

      if (profileRes.data) {
        setProfile(profileRes.data);
        setReminders({
          paymentReminders: profileRes.data.payment_reminders_enabled || false,
          maintenanceReminders: profileRes.data.maintenance_reminders_enabled || false
        });
      }

      if (bookingsRes.data) {
        setRecentBookings(bookingsRes.data.slice(0, 5));
        
        const activeBookings = bookingsRes.data.filter((b: any) => 
          b.status === 'accepted' || b.status === 'paid' || b.status === 'checked-in' || b.status === 'active'
        );
        const pendingRequests = bookingsRes.data.filter((b: any) => b.status === 'requested');
        const totalTenants = bookingsRes.data.filter((b: any) => 
          b.status === 'checked-in' || b.status === 'active'
        ).length;
        const pendingPayments = bookingsRes.data.filter((b: any) => 
          b.payment_status === 'pending'
        ).length;
        
        const monthlyRevenue = bookingsRes.data
          .filter((b: any) => b.status === 'active' || b.status === 'checked-in')
          .reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

        setStats(prev => ({
          ...prev,
          activeBookings: activeBookings.length,
          pendingRequests: pendingRequests.length,
          monthlyRevenue,
          totalTenants,
          pendingPayments
        }));

        // Process tenant data
        const tenantsList = bookingsRes.data
          .filter((b: any) => b.status === 'active' || b.status === 'checked-in')
          .map((b: any) => ({
            id: b.customer_id,
            name: b.profiles?.name || 'Unknown',
            email: b.profiles?.email || '',
            phone: b.profiles?.phone || '',
            profile_photo: b.profiles?.profile_photo || '',
            property_title: b.properties?.title || '',
            property_id: b.property_id,
            booking_id: b.id,
            check_in_date: b.start_date,
            rent_amount: b.amount,
            status: 'active',
            documents_submitted: b.customer_documents && b.customer_documents.length > 0
          }));
        setTenants(tenantsList);

        // Calculate analytics
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - i));
          return date;
        });

        const monthlyData = last6Months.map(date => {
          const monthBookings = bookingsRes.data.filter((b: any) => {
            const bookingDate = new Date(b.created_at);
            return bookingDate.getMonth() === date.getMonth() && 
                   bookingDate.getFullYear() === date.getFullYear();
          });
          
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            revenue: monthBookings.reduce((sum: number, b: any) => sum + (b.amount || 0), 0),
            bookings: monthBookings.length
          };
        });

        const occupancyRate = propertiesRes.data.length > 0
          ? Math.round((activeBookings.length / propertiesRes.data.length) * 100)
          : 0;

        const propertyPerformance = propertiesRes.data.slice(0, 5).map((p: any) => ({
          name: p.title.substring(0, 15) + '...',
          value: bookingsRes.data.filter((b: any) => b.property_id === p.id).length
        }));

        setAnalyticsData({
          monthlyData: monthlyData as any,
          occupancyRate,
          totalRevenue: monthlyRevenue,
          revenueTrend: 12.5, // Mock data - calculate based on previous month
          propertyPerformance: propertyPerformance as any
        });
      }

      if (paymentsRes.data) {
        const formattedPayments = paymentsRes.data.map((p: any) => ({
          id: p.id,
          booking_id: p.booking_id,
          amount: p.amount,
          status: p.status,
          type: p.type,
          created_at: p.created_at,
          property_title: p.bookings?.properties?.title || 'Unknown',
          tenant_name: p.bookings?.profiles?.name || 'Unknown'
        }));
        setPayments(formattedPayments);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(property =>
    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.locality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReminderToggle = async (type: 'payment' | 'maintenance', value: boolean) => {
    try {
      const field = type === 'payment' ? 'payment_reminders_enabled' : 'maintenance_reminders_enabled';
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user?.id);

      if (error) throw error;

      setReminders(prev => ({
        ...prev,
        [`${type}Reminders`]: value
      }));

      toast({
        title: "Reminder settings updated",
        description: `${type === 'payment' ? 'Payment' : 'Maintenance'} reminders ${value ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating reminders:', error);
      toast({
        title: "Error",
        description: "Failed to update reminder settings",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/20 via-accent/10 to-background min-h-[320px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ 
            backgroundImage: `url(${heroBackground})`,
            backgroundBlendMode: 'overlay'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        
        <div className="container relative z-10 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Welcome back, <span className="text-primary">{profile?.name || 'Owner'}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your properties, track revenue, and connect with tenants
            </p>
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <div className="bg-card/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-border flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <span className="font-semibold">Verified Owner</span>
            </div>
            <div className="bg-card/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-border flex items-center gap-2">
              <Clock className="h-5 w-5 text-info" />
              <span className="font-semibold">24/7 Support</span>
            </div>
            <div className="bg-card/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-border flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              <span className="font-semibold">Quick Approvals</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container py-8">

        {/* Profile Status Banner */}
        {profile && profile.profile_verification_status === 'pending' && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">Profile Verification Pending</p>
                  <p className="text-sm text-orange-700">Complete your profile verification to start receiving bookings</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate('/profile')}>
                  Complete Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Properties</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalProperties}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Tenants</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalTenants}</p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Users className="h-8 w-8 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Pending Requests</p>
                  <p className="text-3xl font-bold mt-1">{stats.pendingRequests}</p>
                </div>
                <div className="bg-warning/10 p-3 rounded-lg">
                  <Calendar className="h-8 w-8 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Monthly Revenue</p>
                  <p className="text-3xl font-bold mt-1">₹{stats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-success/10 p-3 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-info hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Active Bookings</p>
                  <p className="text-3xl font-bold mt-1">{stats.activeBookings}</p>
                </div>
                <div className="bg-info/10 p-3 rounded-lg">
                  <Calendar className="h-8 w-8 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Pending Payments</p>
                  <p className="text-3xl font-bold mt-1">{stats.pendingPayments}</p>
                </div>
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <CreditCard className="h-8 w-8 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Tenants
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search properties by name, city, or locality..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/properties/add')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Plus className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Add Property</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/properties')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Building2 className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Properties</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/bookings')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Bookings</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/profile')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <User className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Profile</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/payouts')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <CreditCard className="h-8 w-8 mb-2 text-primary" />
              <h3 className="font-semibold text-center">Payouts</h3>
            </CardContent>
          </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/support')}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <MessageSquare className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold text-center">Support</h3>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Reminders */}
            <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Monthly Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/20">
                <div className="flex-1">
                  <Label htmlFor="payment-reminders" className="text-base font-semibold cursor-pointer">
                    Payment Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get monthly notifications to remind tenants about upcoming rent payments
                  </p>
                </div>
                <Switch
                  id="payment-reminders"
                  checked={reminders.paymentReminders}
                  onCheckedChange={(checked) => handleReminderToggle('payment', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-accent/20">
                <div className="flex-1">
                  <Label htmlFor="maintenance-reminders" className="text-base font-semibold cursor-pointer">
                    Property Maintenance Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive monthly alerts for routine property maintenance and inspections
                  </p>
                </div>
                <Switch
                  id="maintenance-reminders"
                  checked={reminders.maintenanceReminders}
                  onCheckedChange={(checked) => handleReminderToggle('maintenance', checked)}
                />
                </div>
              </div>
            </CardContent>
            </Card>

            {/* Recent Bookings */}
            {recentBookings.length > 0 && (
              <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Booking Requests</span>
                <Button variant="ghost" size="sm" onClick={() => navigate('/owner/bookings')}>View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{booking.profiles?.full_name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">{booking.properties?.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getBookingStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                </div>
              </CardContent>
              </Card>
            )}

            {/* Properties List */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Properties ({filteredProperties.length})</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/owner/properties')}>View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No properties match your search' : 'No properties listed yet'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => navigate('/owner/properties/add')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProperties.slice(0, 4).map((property: any) => {
                  const firstImage = property.photos?.[0] || '/placeholder.svg';
                  return (
                    <div 
                      key={property.id} 
                      className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => navigate(`/property/${property.id}`)}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={firstImage} 
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className={`absolute top-2 right-2 ${getStatusColor(property.status)}`}>
                          {property.status}
                        </Badge>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{property.city} • {property.locality}</span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4 text-sm">
                            {property.sharing_type && (
                              <div className="flex items-center gap-1">
                                <Bed className="h-4 w-4 text-muted-foreground" />
                                <span>{property.sharing_type}</span>
                              </div>
                            )}
                          </div>
                          <p className="font-bold text-lg flex items-center">
                            <IndianRupee className="h-4 w-4" />
                            {property.monthly_rent?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {property.instant_booking && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Instant Book
                            </Badge>
                          )}
                          {property.is_verified && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/property/${property.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/owner/properties/edit/${property.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard
              monthlyData={analyticsData.monthlyData}
              occupancyRate={analyticsData.occupancyRate}
              totalRevenue={analyticsData.totalRevenue}
              revenueTrend={analyticsData.revenueTrend}
              propertyPerformance={analyticsData.propertyPerformance}
            />
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial">
            <FinancialTracking
              payments={payments}
              pendingAmount={payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)}
              receivedAmount={payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)}
              upcomingAmount={stats.monthlyRevenue}
            />
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants">
            <TenantManagement
              tenants={tenants}
              activeTenants={stats.totalTenants}
              pendingDocuments={tenants.filter(t => !t.documents_submitted).length}
              pendingPayments={stats.pendingPayments}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default OwnerDashboard;
