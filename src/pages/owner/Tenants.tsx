import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api, API_URL } from '@/lib/api';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Phone, Home, Calendar, Loader2, FileText, AlertCircle, MessageSquare, User, MapPin, Briefcase, Shield, ExternalLink, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

// Helper to get full URL for document paths
const getDocUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // Already a full URL
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};


interface Tenant {
    id: string;
    booking_id?: string;
    name: string | null;
    email: string;
    phone: string | null;
    property_title: string | null;
    property_id?: string | null;
    room_type: string | null;
    booking_status: string;
    start_date: string | null;
    end_date: string | null;
    monthly_rent: number | null;
    // Profile details
    profile_photo?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    work_type?: string | null;
    work_place?: string | null;
    current_address?: string | null;
    permanent_address?: string | null;
    city?: string | null;
    // Emergency contact
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    // KYC Documents
    aadhar_front_url?: string | null;
    aadhar_back_url?: string | null;
    pan_card_url?: string | null;
    dl_front_url?: string | null;
    dl_back_url?: string | null;
    college_company_id_url?: string | null;
    profile_verification_status?: string;
    documents_submitted?: boolean;
}

const Tenants = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        if (!user || role !== 'owner') {
            navigate('/');
            return;
        }
        fetchTenants();
    }, [user, role]);

    const fetchTenants = async () => {
        try {
            const data = await api.getOwnerTenants();
            setTenants(data);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load tenants",
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'active':
            case 'paid':
            case 'checked_in':
                return 'default';
            case 'pending':
            case 'requested':
            case 'accepted':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const getVerificationBadge = (status?: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle className="h-3 w-3" />Verified</Badge>;
            case 'rejected':
                return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
            default:
                return <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><Clock className="h-3 w-3" />Pending</Badge>;
        }
    };

    const filterTenantsByStatus = (status: string) => {
        if (status === 'active') {
            return tenants.filter(t => ['active', 'paid', 'checked_in'].includes(t.booking_status));
        }
        if (status === 'pending') {
            return tenants.filter(t => ['pending', 'requested', 'accepted'].includes(t.booking_status));
        }
        return tenants;
    };

    // Stats calculations
    const activeTenants = tenants.filter(t => ['active', 'paid', 'checked_in'].includes(t.booking_status)).length;
    const pendingDocuments = tenants.filter(t => !t.documents_submitted).length;
    const pendingPayments = tenants.filter(t => t.booking_status === 'accepted' || t.booking_status === 'pending').length;

    const openTenantDetails = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setDetailsOpen(true);
    };

    const [verifying, setVerifying] = useState(false);

    const handleVerifyTenant = async (status: 'approved' | 'rejected') => {
        if (!selectedTenant) return;

        setVerifying(true);
        try {
            await api.verifyTenant(selectedTenant.id, status);
            toast({
                title: "Success",
                description: `Tenant documents ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
            });
            // Close dialog and refresh
            setDetailsOpen(false);
            setSelectedTenant(null);
            fetchTenants();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to verify tenant",
            });
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Tenant Management</h1>
                    <p className="text-muted-foreground">
                        View and manage your current tenants
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Active Tenants</p>
                                    <p className="text-3xl font-bold mt-1">{activeTenants}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <User className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Pending Documents</p>
                                    <p className="text-3xl font-bold mt-1">{pendingDocuments}</p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-lg">
                                    <FileText className="h-8 w-8 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Payment Pending</p>
                                    <p className="text-3xl font-bold mt-1">{pendingPayments}</p>
                                </div>
                                <div className="bg-red-100 p-3 rounded-lg">
                                    <AlertCircle className="h-8 w-8 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tenant Directory */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tenant Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">All ({tenants.length})</TabsTrigger>
                                <TabsTrigger value="active">Active ({filterTenantsByStatus('active').length})</TabsTrigger>
                                <TabsTrigger value="pending">Pending ({filterTenantsByStatus('pending').length})</TabsTrigger>
                            </TabsList>

                            {['all', 'active', 'pending'].map((tab) => (
                                <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                                    {filterTenantsByStatus(tab).length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                            <p>No {tab !== 'all' ? tab : ''} tenants found</p>
                                        </div>
                                    ) : (
                                        filterTenantsByStatus(tab).map((tenant) => (
                                            <div key={tenant.id} className="group border rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 bg-card">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4 flex-1">
                                                        <Avatar className="h-14 w-14 border-2 border-primary/20 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                                                            <AvatarImage src={getDocUrl(tenant.profile_photo) || undefined} />
                                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                                                {tenant.name?.charAt(0) || 'T'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="space-y-3 flex-1">
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h3 className="font-semibold text-lg">{tenant.name || 'Tenant'}</h3>
                                                                    <Badge variant={getStatusVariant(tenant.booking_status)} className="capitalize">
                                                                        {tenant.booking_status?.replace('_', ' ')}
                                                                    </Badge>
                                                                    {!tenant.documents_submitted && (
                                                                        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
                                                                            <FileText className="h-3 w-3" />
                                                                            Docs Pending
                                                                        </Badge>
                                                                    )}
                                                                    {getVerificationBadge(tenant.profile_verification_status)}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5">
                                                                    <Home className="h-3.5 w-3.5" />
                                                                    {tenant.property_title || 'Property'}
                                                                    {tenant.room_type && <Badge variant="outline" className="ml-2">{tenant.room_type}</Badge>}
                                                                </p>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                                <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                                                                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                                                                    <span className="text-foreground truncate">{tenant.email}</span>
                                                                </div>
                                                                {tenant.phone && (
                                                                    <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                                                                        <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                                                                        <span className="text-foreground">{tenant.phone}</span>
                                                                    </div>
                                                                )}
                                                                {tenant.start_date && (
                                                                    <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                                                                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                                                                        <span className="text-foreground">
                                                                            {format(new Date(tenant.start_date), 'MMM dd, yyyy')}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {tenant.monthly_rent && (
                                                                    <div className="flex items-center gap-2 text-sm bg-primary/10 p-2 rounded-lg">
                                                                        <span className="font-bold text-primary">₹{tenant.monthly_rent.toLocaleString()}</span>
                                                                        <span className="text-muted-foreground">/month</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 ml-4">
                                                        <Button variant="outline" size="sm" onClick={() => openTenantDetails(tenant)}>
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View Details
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                                                            <MessageSquare className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* Tenant Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={getDocUrl(selectedTenant?.profile_photo) || undefined} />
                                <AvatarFallback>{selectedTenant?.name?.charAt(0) || 'T'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold">{selectedTenant?.name || 'Tenant'}</h2>
                                <p className="text-sm text-muted-foreground">{selectedTenant?.property_title}</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedTenant && (
                        <div className="space-y-6 mt-4">
                            {/* Basic Info */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Basic Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="font-medium">{selectedTenant.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedTenant.phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Gender</p>
                                        <p className="font-medium capitalize">{selectedTenant.gender || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Date of Birth</p>
                                        <p className="font-medium">{selectedTenant.date_of_birth || 'Not provided'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Work Info */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Work Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Work Type</p>
                                        <p className="font-medium capitalize">{selectedTenant.work_type || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Workplace / College</p>
                                        <p className="font-medium">{selectedTenant.work_place || 'Not provided'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Address Info */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Address Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Current Address</p>
                                        <p className="font-medium">{selectedTenant.current_address || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Permanent Address</p>
                                        <p className="font-medium">{selectedTenant.permanent_address || 'Not provided'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Emergency Contact */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Emergency Contact
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Name</p>
                                        <p className="font-medium">{selectedTenant.emergency_contact_name || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedTenant.emergency_contact_phone || 'Not provided'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* KYC Documents */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        KYC Documents
                                        {getVerificationBadge(selectedTenant.profile_verification_status)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Aadhaar */}
                                        <div className="border rounded-lg p-4">
                                            <p className="font-medium mb-2">Aadhaar Card</p>
                                            <div className="flex gap-2">
                                                {getDocUrl(selectedTenant.aadhar_front_url) ? (
                                                    <a href={getDocUrl(selectedTenant.aadhar_front_url)!} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline" size="sm">
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            Front
                                                        </Button>
                                                    </a>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">Front: Not uploaded</Badge>
                                                )}
                                                {getDocUrl(selectedTenant.aadhar_back_url) ? (
                                                    <a href={getDocUrl(selectedTenant.aadhar_back_url)!} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline" size="sm">
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            Back
                                                        </Button>
                                                    </a>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">Back: Not uploaded</Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* PAN Card */}
                                        <div className="border rounded-lg p-4">
                                            <p className="font-medium mb-2">PAN Card</p>
                                            {getDocUrl(selectedTenant.pan_card_url) ? (
                                                <a href={getDocUrl(selectedTenant.pan_card_url)!} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm">
                                                        <ExternalLink className="h-4 w-4 mr-1" />
                                                        View Document
                                                    </Button>
                                                </a>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Not uploaded</Badge>
                                            )}
                                        </div>

                                        {/* Driving License */}
                                        <div className="border rounded-lg p-4">
                                            <p className="font-medium mb-2">Driving License</p>
                                            <div className="flex gap-2">
                                                {getDocUrl(selectedTenant.dl_front_url) ? (
                                                    <a href={getDocUrl(selectedTenant.dl_front_url)!} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline" size="sm">
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            Front
                                                        </Button>
                                                    </a>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">Front: Not uploaded</Badge>
                                                )}
                                                {getDocUrl(selectedTenant.dl_back_url) ? (
                                                    <a href={getDocUrl(selectedTenant.dl_back_url)!} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="outline" size="sm">
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            Back
                                                        </Button>
                                                    </a>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">Back: Not uploaded</Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* College/Company ID */}
                                        <div className="border rounded-lg p-4">
                                            <p className="font-medium mb-2">College/Company ID</p>
                                            {getDocUrl(selectedTenant.college_company_id_url) ? (
                                                <a href={getDocUrl(selectedTenant.college_company_id_url)!} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm">
                                                        <ExternalLink className="h-4 w-4 mr-1" />
                                                        View Document
                                                    </Button>
                                                </a>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Not uploaded</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Verification Actions */}
                                    {(selectedTenant.aadhar_front_url || selectedTenant.pan_card_url || selectedTenant.dl_front_url || selectedTenant.college_company_id_url) && (
                                        <div className="pt-4 border-t mt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">Document Verification</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Review documents and update verification status
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleVerifyTenant('approved')}
                                                        disabled={verifying || selectedTenant.profile_verification_status === 'approved'}
                                                        className={`${selectedTenant.profile_verification_status === 'approved'
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-100 cursor-default'
                                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                                            }`}
                                                    >
                                                        {verifying ? (
                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                        )}
                                                        {selectedTenant.profile_verification_status === 'approved' ? 'Approved' : 'Approve'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleVerifyTenant('rejected')}
                                                        disabled={verifying || selectedTenant.profile_verification_status === 'rejected'}
                                                        className={`${selectedTenant.profile_verification_status === 'rejected'
                                                            ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100 cursor-default'
                                                            : 'border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700'
                                                            }`}
                                                    >
                                                        {verifying ? (
                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                        )}
                                                        {selectedTenant.profile_verification_status === 'rejected' ? 'Rejected' : 'Reject'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Tenants;
