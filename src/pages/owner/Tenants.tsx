import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Phone, Home, Calendar, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Tenant {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    property_title: string | null;
    room_type: string | null;
    booking_status: string;
    start_date: string | null;
    end_date: string | null;
    monthly_rent: number | null;
}

const Tenants = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

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

                {/* Stats */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{tenants.length}</p>
                                <p className="text-muted-foreground">Active Tenants</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tenant List */}
                {tenants.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">No active tenants</p>
                            <p className="text-sm text-muted-foreground">
                                Tenants will appear here once bookings are confirmed
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {tenants.map((tenant) => (
                            <Card key={tenant.id}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback>
                                                    {tenant.name?.charAt(0) || 'T'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-semibold">{tenant.name || 'Tenant'}</h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Mail className="h-4 w-4" />
                                                    {tenant.email}
                                                </div>
                                                {tenant.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone className="h-4 w-4" />
                                                        {tenant.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:items-end gap-2">
                                            <div className="flex items-center gap-2">
                                                <Home className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{tenant.property_title}</span>
                                                {tenant.room_type && (
                                                    <Badge variant="outline">{tenant.room_type}</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {tenant.start_date ? new Date(tenant.start_date).toLocaleDateString() : 'N/A'}
                                                {tenant.end_date && ` - ${new Date(tenant.end_date).toLocaleDateString()}`}
                                            </div>
                                            {tenant.monthly_rent && (
                                                <p className="text-lg font-semibold text-primary">
                                                    ₹{tenant.monthly_rent.toLocaleString()}/month
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tenants;
