import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Home, CheckCircle, XCircle, Ban, Eye, MapPin } from 'lucide-react';

interface Property {
    id: string;
    title: string;
    city: string;
    locality: string;
    owner_name: string;
    status: string;
    is_verified: boolean;
    price_monthly_min: number;
    created_at: string;
}

const AdminProperties = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<Property[]>([]);

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/');
            return;
        }
        fetchProperties();
    }, [role, navigate]);

    const fetchProperties = async () => {
        try {
            const data = await api.getPropertiesForModeration();
            setProperties(data);
        } catch (error) {
            // Try regular properties endpoint
            try {
                const fallback = await api.getProperties();
                setProperties(fallback.map((p: any) => ({
                    ...p,
                    status: p.is_active ? 'active' : 'inactive',
                    owner_name: p.owner_name || 'Unknown',
                })));
            } catch (e) {
                console.log('Could not fetch properties');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleModerate = async (propertyId: string, action: 'active' | 'inactive' | 'banned') => {
        try {
            await api.moderateProperty(propertyId, action);
            toast({
                title: "Success",
                description: `Property marked as ${action}`,
            });
            fetchProperties();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update property",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { color: string; icon: any }> = {
            'active': { color: 'bg-green-500', icon: CheckCircle },
            'inactive': { color: 'bg-yellow-500', icon: XCircle },
            'banned': { color: 'bg-red-500', icon: Ban },
        };
        const { color, icon: Icon } = config[status] || { color: 'bg-gray-500', icon: Home };
        return (
            <Badge className={`${color} flex items-center gap-1`}>
                <Icon className="h-3 w-3" /> {status}
            </Badge>
        );
    };

    const activeProperties = properties.filter(p => p.status === 'active' || p.is_verified);
    const inactiveProperties = properties.filter(p => p.status === 'inactive');
    const bannedProperties = properties.filter(p => p.status === 'banned');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const PropertyCard = ({ property }: { property: Property }) => (
        <Card>
            <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{property.title}</span>
                            {getStatusBadge(property.status || 'active')}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {property.locality}, {property.city}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Owner: {property.owner_name} | ₹{property.price_monthly_min?.toLocaleString()}/month
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/properties/${property.id}`)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        {property.status !== 'active' && (
                            <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => handleModerate(property.id, 'active')}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Activate
                            </Button>
                        )}
                        {property.status === 'active' && (
                            <Button size="sm" variant="secondary" onClick={() => handleModerate(property.id, 'inactive')}>
                                <XCircle className="h-4 w-4 mr-1" /> Deactivate
                            </Button>
                        )}
                        {property.status !== 'banned' && (
                            <Button size="sm" variant="destructive" onClick={() => handleModerate(property.id, 'banned')}>
                                <Ban className="h-4 w-4 mr-1" /> Ban
                            </Button>
                        )}
                    </div>
                </div>
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
                        <Home className="h-8 w-8" /> Property Moderation
                    </h1>
                    <p className="text-muted-foreground">Manage property listings - activate, deactivate, or ban</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-500">{activeProperties.length}</div>
                            <p className="text-sm text-muted-foreground">Active Properties</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-yellow-500">{inactiveProperties.length}</div>
                            <p className="text-sm text-muted-foreground">Inactive Properties</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-red-500">{bannedProperties.length}</div>
                            <p className="text-sm text-muted-foreground">Banned Properties</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Properties List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Properties ({properties.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="all">
                            <TabsList className="mb-4">
                                <TabsTrigger value="all">All ({properties.length})</TabsTrigger>
                                <TabsTrigger value="active">Active ({activeProperties.length})</TabsTrigger>
                                <TabsTrigger value="inactive">Inactive ({inactiveProperties.length})</TabsTrigger>
                                <TabsTrigger value="banned">Banned ({bannedProperties.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all">
                                <div className="space-y-4">
                                    {properties.map(p => <PropertyCard key={p.id} property={p} />)}
                                </div>
                            </TabsContent>
                            <TabsContent value="active">
                                <div className="space-y-4">
                                    {activeProperties.map(p => <PropertyCard key={p.id} property={p} />)}
                                </div>
                            </TabsContent>
                            <TabsContent value="inactive">
                                <div className="space-y-4">
                                    {inactiveProperties.map(p => <PropertyCard key={p.id} property={p} />)}
                                </div>
                            </TabsContent>
                            <TabsContent value="banned">
                                <div className="space-y-4">
                                    {bannedProperties.map(p => <PropertyCard key={p.id} property={p} />)}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminProperties;
