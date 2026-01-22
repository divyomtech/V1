import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Property } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, MapPin, IndianRupee, Home } from 'lucide-react';

const OwnerProperties = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      // API returns all properties, owner filtering done on backend
      const data = await api.getProperties();
      // Filter by owner on frontend - convert both to string for comparison
      const ownedProperties = data.filter(p => String(p.owner_id) === String(user?.id));
      setProperties(ownedProperties);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <p>Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Properties</h1>
              <p className="text-muted-foreground mt-1">Manage your PG listings</p>
            </div>
            <Button onClick={() => navigate('/owner/properties/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>

          {properties.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Home className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Properties Yet</h3>
                <p className="text-muted-foreground mb-6">Start by adding your first property</p>
                <Button onClick={() => navigate('/owner/properties/add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    {property.photos && property.photos[0] ? (
                      <img
                        src={property.photos[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      className="absolute top-2 right-2"
                      variant={property.status === 'active' ? 'default' : 'secondary'}
                    >
                      {property.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 truncate">{property.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.locality}, {property.city}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center font-semibold">
                        <IndianRupee className="h-4 w-4" />
                        {property.monthly_rent.toLocaleString()}/mo
                      </div>
                      <Badge variant="outline">
                        {property.gender_preference === 'male' ? 'Boys' :
                          property.gender_preference === 'female' ? 'Girls' : 'Co-living'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/owner/properties/edit/${property.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerProperties;
