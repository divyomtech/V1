import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Calendar, Plus, IndianRupee, TrendingUp, User, FileText, MessageSquare, CreditCard, Settings, Search, Eye, Edit, MapPin, Bed, Zap, Shield, ShieldCheck, Clock, Bell, BarChart3, Wallet, UserCheck, Megaphone, Trash2, AlertTriangle, AlertCircle, Info, Timer, Wrench, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AnalyticsDashboard from "@/components/owner/AnalyticsDashboard";
import heroBackground from "@/assets/hero-bg.jpg";

const OwnerDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeBookings: 0,
    pendingRequests: 0,
    monthlyRevenue: 0,
    totalTenants: 0,
    pendingPayments: 0,
    vacatingRequests: 0
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [vacatingRequests, setVacatingRequests] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
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
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal' as 'normal' | 'important' | 'urgent',
    property_id: 'all',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);
  const [ownerTickets, setOwnerTickets] = useState<any[]>([]);
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchAnnouncements();
      fetchOwnerTickets();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch owner's profile for reminder settings
      try {
        const profileData = await api.getProfile();
        if (profileData) {
          setReminders({
            paymentReminders: profileData.payment_reminders_enabled ?? false,
            maintenanceReminders: profileData.maintenance_reminders_enabled ?? false
          });
          setOwnerProfile(profileData);
        }
      } catch (e) {
        // Profile fetch might fail, continue with defaults
      }

      // Fetch properties owned by this owner
      const propertiesData = await api.getOwnerProperties();
      setProperties(propertiesData || []);

      // Fetch bookings - for owners this would need the owner endpoint
      // For now, we'll use the regular bookings and process them
      const bookingsData = await api.getBookings();
      const allBookings = bookingsData || [];

      setRecentBookings(allBookings.slice(0, 5));

      // Calculate stats
      const activeBookings = allBookings.filter((b: any) =>
        b.status === 'accepted' || b.status === 'paid' || b.status === 'checked-in' || b.status === 'active'
      );
      const pendingRequests = allBookings.filter((b: any) => b.status === 'requested');
      const totalTenants = allBookings.filter((b: any) =>
        b.status === 'checked-in' || b.status === 'active' || b.status === 'paid'
      ).length;

      const monthlyRevenue = allBookings
        .filter((b: any) => b.status === 'active' || b.status === 'checked-in' || b.status === 'paid')
        .reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

      const vacatingPending = allBookings.filter((b: any) => b.status === 'vacate_requested');
      setVacatingRequests(vacatingPending);

      setStats({
        totalProperties: (propertiesData || []).length,
        activeBookings: activeBookings.length,
        pendingRequests: pendingRequests.length,
        monthlyRevenue,
        totalTenants,
        pendingPayments: 0,
        vacatingRequests: vacatingPending.length
      });

      // Process tenant data - include 'paid' status as tenants
      const tenantsList = allBookings
        .filter((b: any) => b.status === 'active' || b.status === 'checked-in' || b.status === 'paid')
        .map((b: any) => ({
          id: b.customer_id,
          name: b.customer_name || 'Unknown',
          email: '',
          phone: '',
          profile_photo: '',
          property_title: b.property?.title || '',
          property_id: b.property_id,
          booking_id: b.id,
          check_in_date: b.start_date,
          rent_amount: b.amount,
          status: 'active',
          documents_submitted: false
        }));
      setTenants(tenantsList);

      // Calculate analytics
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return date;
      });

      const monthlyData = last6Months.map(date => {
        const monthBookings = allBookings.filter((b: any) => {
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

      const occupancyRate = (propertiesData || []).length > 0
        ? Math.round((activeBookings.length / (propertiesData || []).length) * 100)
        : 0;

      const propertyPerformance = (propertiesData || []).slice(0, 5).map((p: any) => ({
        name: (p.title || '').substring(0, 15) + '...',
        value: allBookings.filter((b: any) => b.property_id === p.id).length
      }));

      // Calculate dynamic revenue trend (compare current month to previous month)
      const currentMonthRevenue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].revenue : 0;
      const previousMonthRevenue = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2].revenue : 0;
      const revenueTrend = previousMonthRevenue > 0
        ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 * 10) / 10
        : 0;

      setAnalyticsData({
        monthlyData: monthlyData as any,
        occupancyRate,
        totalRevenue: monthlyRevenue,
        revenueTrend,
        propertyPerformance: propertyPerformance as any
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerTickets = async () => {
    try {
      const data = await api.getOwnerTickets();
      setOwnerTickets(data || []);
    } catch (error) {
      console.error('Error fetching owner tickets:', error);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    setIsUpdatingTicket(true);
    try {
      await api.updateTicket(ticketId, { status });
      toast({ title: 'Success', description: `Ticket status updated to ${status.replace('_', ' ')}` });
      fetchOwnerTickets();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update ticket' });
    } finally {
      setIsUpdatingTicket(false);
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
      const updateData = type === 'payment'
        ? { payment_reminders_enabled: value }
        : { maintenance_reminders_enabled: value };

      await api.updateProfile(updateData);

      setReminders(prev => ({
        ...prev,
        [`${type}Reminders`]: value
      }));

      toast({
        title: "Reminder settings updated",
        description: `${type === 'payment' ? 'Payment' : 'Maintenance'} reminders ${value ? 'enabled' : 'disabled'}. ${value ? 'Your tenants will receive notifications about upcoming payments.' : ''}`,
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

  const fetchAnnouncements = async () => {
    try {
      const data = await api.getOwnerAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast({ variant: 'destructive', title: 'Error', description: 'Title and message are required' });
      return;
    }
    setCreatingAnnouncement(true);
    try {
      await api.createAnnouncement({
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        priority: newAnnouncement.priority,
        property_id: newAnnouncement.property_id === 'all' ? undefined : newAnnouncement.property_id,
        start_time: newAnnouncement.start_time,
        end_time: newAnnouncement.end_time
      });
      toast({ title: 'Announcement Created', description: 'Your tenants have been notified via email.' });
      setAnnouncementDialogOpen(false);
      setNewAnnouncement({
        title: '',
        message: '',
        priority: 'normal',
        property_id: 'all',
        start_time: new Date().toISOString().slice(0, 16),
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
      fetchAnnouncements();
    } catch (error: any) {
      const errorMessage = error?.message || error?.detail || (typeof error === 'string' ? error : 'Failed to create announcement');
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      toast({ title: 'Deleted', description: 'Announcement removed.' });
      fetchAnnouncements();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteProperty = async (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    try {
      await api.deleteOwnerProperty(propertyId);
      toast({ title: 'Property Deleted', description: 'The property has been removed.' });
      // Refresh properties list
      setProperties(properties.filter(p => p.id !== propertyId));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete property' });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'important': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'important': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
    }
  };

  // Calculate time remaining for announcement (based on start_time and end_time)
  const getTimeRemaining = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    // Check if announcement hasn't started yet
    if (now < start) {
      return { expired: false, started: false, text: 'Scheduled' };
    }

    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return { expired: true, started: true, text: 'Expired' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return { expired: false, started: true, text: `${days}d ${hours}h left` };
    }
    if (hours > 0) {
      return { expired: false, started: true, text: `${hours}h ${minutes}m left` };
    }
    return { expired: false, started: true, text: `${minutes}m left` };
  };

  // Block dashboard access for unapproved owners
  if (ownerProfile && (ownerProfile.approval_status === 'pending' || ownerProfile.approval_status === 'rejected')) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16">
          <div className="max-w-2xl mx-auto">
            <Card className={`border-2 ${ownerProfile.approval_status === 'pending' ? 'border-orange-300 bg-orange-50 dark:bg-orange-950' : 'border-red-300 bg-red-50 dark:bg-red-950'}`}>
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${ownerProfile.approval_status === 'pending' ? 'bg-orange-100 dark:bg-orange-900' : 'bg-red-100 dark:bg-red-900'}`}>
                    <UserCheck className={`h-10 w-10 ${ownerProfile.approval_status === 'pending' ? 'text-orange-600' : 'text-red-600'}`} />
                  </div>

                  {ownerProfile.approval_status === 'pending' ? (
                    <>
                      <h1 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-3">
                        ⏳ Owner Approval Pending
                      </h1>
                      <p className="text-orange-700 dark:text-orange-300 mb-6 max-w-md mx-auto">
                        Your registration request is under review. Admin needs to approve your account before you can access the owner dashboard and add properties.
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-3">
                        ❌ Owner Application Rejected
                      </h1>
                      <p className="text-red-700 dark:text-red-300 mb-6 max-w-md mx-auto">
                        Unfortunately, your owner application was not approved. Please contact admin for more information or to reapply.
                      </p>
                    </>
                  )}

                  <div className="p-4 bg-white/60 dark:bg-black/20 rounded-lg inline-block">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📞 Need help? Contact Admin:</p>
                    <a href="tel:6303348984" className="text-2xl font-bold text-primary hover:underline">
                      6303348984
                    </a>
                  </div>

                  <div className="mt-8 flex justify-center gap-4">
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Go to Home
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      Check Status Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <div className="relative min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* Real background image with dark overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: `url(${heroBackground})`,
          }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="container relative z-10 py-16">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white tracking-tight leading-tight">
              Welcome back, <span className="text-primary">{profile?.name || 'Owner'}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto font-medium leading-relaxed opacity-90">
              Manage multi-type rooms, track revenue, and connect with tenants effortlessly
            </p>
          </div>

          {/* Feature Badges Below Heading */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="bg-white/95 backdrop-blur-sm px-6 py-2.5 rounded-full shadow-xl border border-white/20 flex items-center gap-2.5 transition-all hover:scale-105 group">
              <ShieldCheck className="h-5 w-5 text-slate-800" />
              <span className="font-bold text-slate-900 text-sm">Verified Owner</span>
            </div>
            <div className="bg-white/95 backdrop-blur-sm px-6 py-2.5 rounded-full shadow-xl border border-white/20 flex items-center gap-2.5 transition-all hover:scale-105 group">
              <Clock className="h-5 w-5 text-slate-800" />
              <span className="font-bold text-slate-900 text-sm">24/7 Support</span>
            </div>
            <div className="bg-white/95 backdrop-blur-sm px-6 py-2.5 rounded-full shadow-xl border border-white/20 flex items-center gap-2.5 transition-all hover:scale-105 group">
              <Zap className="h-5 w-5 text-slate-800" />
              <span className="font-bold text-slate-900 text-sm">Quick Approvals</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container py-8">

        {/* Stats Cards Row 1: 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card
            className="border-l-4 border-l-primary hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/owner/properties')}
          >
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

          <Card
            className="border-l-4 border-l-accent hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/owner/tenants')}
          >
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

          <Card
            className="border-l-4 border-l-warning hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/owner/bookings')}
          >
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

          <Card
            className="border-l-4 border-l-accent hover:shadow-md transition-shadow cursor-pointer bg-accent/5"
            onClick={() => navigate('/owner/bookings')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-accent font-bold italic">Going to Vacate</p>
                  <p className="text-3xl font-bold mt-1 text-accent-foreground">{stats.vacatingRequests}</p>
                </div>
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Clock className="h-8 w-8 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards Row 2: 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card
            className="border-l-4 border-l-success hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/owner/finances')}
          >
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

          <Card
            className="border-l-4 border-l-info hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/owner/bookings')}
          >
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

          <Card
            className="border-l-4 border-l-destructive hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/owner/finances')}
          >
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance
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

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/tenants')}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold text-center">Tenants</h3>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/owner/finances')}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Wallet className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold text-center">Wallet</h3>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/profile')}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <User className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold text-center">Profile</h3>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setAnnouncementDialogOpen(true)}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Megaphone className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold text-center">Announce</h3>
                </CardContent>
              </Card>
            </div>

            {/* Announcement Dialog */}
            <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Send Announcement to Tenants
                  </DialogTitle>
                  <DialogDescription>
                    Create an announcement to notify all tenants. They will receive an email notification.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="ann-title">Title *</Label>
                    <Input
                      id="ann-title"
                      placeholder="e.g., Water Supply Notice"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ann-message">Message *</Label>
                    <Textarea
                      id="ann-message"
                      placeholder="Write your announcement message here..."
                      rows={4}
                      value={newAnnouncement.message}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Priority</Label>
                      <Select value={newAnnouncement.priority} onValueChange={(v: any) => setNewAnnouncement({ ...newAnnouncement, priority: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="important">Important</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Property (Optional)</Label>
                      <Select value={newAnnouncement.property_id} onValueChange={(v) => setNewAnnouncement({ ...newAnnouncement, property_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Properties" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Properties</SelectItem>
                          {properties.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-sm">Schedule Announcement</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Start Time
                        </Label>
                        <div className="relative">
                          <Input
                            type="datetime-local"
                            value={newAnnouncement.start_time}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, start_time: e.target.value })}
                            className="bg-white dark:bg-background border-amber-200 dark:border-amber-800/50 focus:border-amber-400 focus:ring-amber-400/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          End Time
                        </Label>
                        <div className="relative">
                          <Input
                            type="datetime-local"
                            value={newAnnouncement.end_time}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, end_time: e.target.value })}
                            className="bg-white dark:bg-background border-amber-200 dark:border-amber-800/50 focus:border-amber-400 focus:ring-amber-400/20"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-3 flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      Announcement will be visible from start time until end time
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateAnnouncement} disabled={creatingAnnouncement}>
                    {creatingAnnouncement ? 'Sending...' : 'Send Announcement'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Announcements List */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Your Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const activeAnnouncements = announcements.filter(ann =>
                    !getTimeRemaining(ann.start_time || ann.created_at, ann.end_time || new Date(new Date(ann.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString()).expired
                  );

                  if (activeAnnouncements.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No announcements available</p>
                        <p className="text-sm text-muted-foreground mt-1">Click "Announce" to create one for your tenants</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {activeAnnouncements.slice(0, 5).map((ann) => {
                        const timeRemaining = getTimeRemaining(ann.start_time || ann.created_at, ann.end_time || new Date(new Date(ann.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString());
                        return (
                          <div key={ann.id} className={`p-4 border-l-4 rounded-lg ${getPriorityColor(ann.priority)}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                {getPriorityIcon(ann.priority)}
                                <div>
                                  <h4 className="font-semibold">{ann.title}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">{ann.message}</p>
                                  <div className="flex items-center flex-wrap gap-3 mt-2">
                                    <p className="text-xs text-muted-foreground">
                                      {ann.property_title || 'All Properties'}
                                    </p>
                                    <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${timeRemaining.started === false
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                      }`}>
                                      <Timer className="h-3 w-3" />
                                      {timeRemaining.text}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteAnnouncement(ann.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

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

            {/* Vacating Requests List */}
            {vacatingRequests.length > 0 && (
              <Card className="mb-8 border-rose-200 bg-rose-50/10 shadow-sm">
                <CardHeader className="pb-3 px-6 pt-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-rose-700">
                      <Clock className="h-5 w-5" />
                      Tenants Going to Vacate
                    </CardTitle>
                    <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 font-bold">
                      {vacatingRequests.length} REQUESTS
                    </Badge>
                  </div>
                  <CardDescription>The following tenants have requested to vacate their rooms.</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-3">
                    {vacatingRequests.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl bg-white dark:bg-card hover:border-rose-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-4 mb-3 md:mb-0">
                          <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg border border-rose-200">
                            {booking.customer_name?.[0] || 'G'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{booking.customer_name || 'Guest'}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Building2 className="h-3.5 w-3.5" />
                              {booking.property?.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Requested: {new Date(booking.updated_at || booking.created_at).toLocaleDateString()}
                              </span>
                              {booking.stay_type === 'monthly' && (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 uppercase">Monthly Stay</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:self-end md:self-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold"
                            onClick={() => navigate('/owner/bookings')}
                          >
                            Manage Request
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50"
                            onClick={() => navigate(`/owner/bookings?bookingId=${booking.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                            <p className="font-medium text-sm">{booking.customer_name || 'Guest'}</p>
                            <p className="text-xs text-muted-foreground">{booking.property?.title}</p>
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
                          onClick={() => navigate(`/properties/${property.id}`)}
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
                                {(() => {
                                  const monthlyRooms = (property.rooms || []).filter((r: any) => (r.stay_type || 'monthly') === 'monthly');
                                  if (monthlyRooms.length === 0) return null;

                                  const defaultRoom = [...monthlyRooms].sort((a, b) => {
                                    const aAvailable = (a.vacancy_count || 0) > 0;
                                    const bAvailable = (b.vacancy_count || 0) > 0;
                                    if (aAvailable && !bAvailable) return -1;
                                    if (!aAvailable && bAvailable) return 1;
                                    return (a.price || 0) - (b.price || 0);
                                  })[0];

                                  return (
                                    <div className="flex items-center gap-1">
                                      <Bed className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        {defaultRoom.room_type}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg flex items-center justify-end">
                                  <IndianRupee className="h-4 w-4" />
                                  {(() => {
                                    const monthlyRooms = (property.rooms || []).filter((r: any) => (r.stay_type || 'monthly') === 'monthly');
                                    if (monthlyRooms.length === 0) return property.monthly_rent?.toLocaleString() || 0;

                                    const defaultRoom = [...monthlyRooms].sort((a, b) => {
                                      const aAvailable = (a.vacancy_count || 0) > 0;
                                      const bAvailable = (b.vacancy_count || 0) > 0;
                                      if (aAvailable && !bAvailable) return -1;
                                      if (!aAvailable && bAvailable) return 1;
                                      return (a.price || 0) - (b.price || 0);
                                    })[0];

                                    return defaultRoom.price.toLocaleString();
                                  })()}
                                </p>
                                <p className="text-[10px] text-muted-foreground -mt-1">Rent/mo</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                  Deposit: ₹{(() => {
                                    const monthlyRooms = (property.rooms || []).filter((r: any) => (r.stay_type || 'monthly') === 'monthly');
                                    if (monthlyRooms.length === 0) return property.deposit?.toLocaleString() || 0;

                                    const defaultRoom = [...monthlyRooms].sort((a, b) => {
                                      const aAvailable = (a.vacancy_count || 0) > 0;
                                      const bAvailable = (b.vacancy_count || 0) > 0;
                                      if (aAvailable && !bAvailable) return -1;
                                      if (!aAvailable && bAvailable) return 1;
                                      return (a.price || 0) - (b.price || 0);
                                    })[0];

                                    return (defaultRoom.deposit ?? property.deposit ?? 0).toLocaleString();
                                  })()}
                                </p>
                              </div>
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
                                  navigate(`/properties/${property.id}`);
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
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => handleDeleteProperty(property.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
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

          <TabsContent value="analytics">
            <AnalyticsDashboard
              monthlyData={analyticsData.monthlyData}
              occupancyRate={analyticsData.occupancyRate}
              totalRevenue={analyticsData.totalRevenue}
              revenueTrend={analyticsData.revenueTrend}
              propertyPerformance={analyticsData.propertyPerformance}
            />
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Maintenance Requests</CardTitle>
                    <CardDescription>Manage and resolve issues reported by your tenants</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchOwnerTickets} className="gap-2">
                    <Zap className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ownerTickets.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-lg border-2 border-dashed">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground">No maintenance requests found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ownerTickets.map((ticket) => (
                      <Card key={ticket.id} className="overflow-hidden">
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={
                                ticket.status === 'open' ? "destructive" :
                                  ticket.status === 'in_progress' ? "secondary" :
                                    "default"
                              } className="text-[10px] uppercase">
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className={`text-[10px] uppercase ${ticket.priority === 'urgent' ? 'border-red-500 text-red-500 bg-red-50' :
                                ticket.priority === 'high' ? 'border-orange-500 text-orange-500 bg-orange-50' :
                                  'border-slate-300 text-slate-500'
                                }`}>
                                {ticket.priority} Priority
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Reported {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="font-bold text-lg">{ticket.title}</h4>
                            <p className="text-sm text-slate-600 mb-2">{ticket.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span>{ticket.property?.title || 'Property'}</span>
                              <span className="mx-1">•</span>
                              <User className="h-3 w-3" />
                              <span>Tenant: {ticket.tenant?.email || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Update Status</p>
                            <div className="grid grid-cols-2 gap-2">
                              {ticket.status === 'open' && (
                                <Button
                                  size="sm"
                                  className="bg-orange-600 hover:bg-orange-700 h-8 text-xs"
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')}
                                  disabled={isUpdatingTicket}
                                >
                                  Start Work
                                </Button>
                              )}
                              {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 h-8 text-xs gap-1"
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                                  disabled={isUpdatingTicket}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Resolve
                                </Button>
                              )}
                              {ticket.status === 'resolved' && (
                                <div className="col-span-2 py-2 px-3 bg-green-50 text-green-700 rounded-md text-xs font-bold border border-green-200 flex items-center justify-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  COMPLETED
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div >
  );
};

export default OwnerDashboard;
