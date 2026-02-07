import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    MapPin,
    Plus,
    Pencil,
    Trash2,
    ArrowLeft,
    Building2,
    Eye,
    EyeOff,
    Clock,
    CheckCircle,
    Upload,
    ImageIcon,
    Loader2,
    X,
} from 'lucide-react';

interface City {
    id: string;
    name: string;
    slug: string | null;
    image_url: string | null;
    tagline: string | null;
    status: string;
    is_active: boolean;
    priority_order: number;
    property_count: number;
    created_at: string;
}

const AdminCities = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingCity, setEditingCity] = useState<City | null>(null);
    const [cityToDelete, setCityToDelete] = useState<City | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        image_url: '',
        tagline: '',
        status: 'AVAILABLE',
        priority_order: 0,
    });
    const [uploading, setUploading] = useState(false);

    const fetchCities = useCallback(async () => {
        try {
            const response = await api.request('/api/admin/cities?include_inactive=true') as City[];
            setCities(response);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to fetch cities',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCities();
    }, [fetchCities]);

    const handleOpenDialog = (city?: City) => {
        if (city) {
            setEditingCity(city);
            setFormData({
                name: city.name,
                slug: city.slug || '',
                image_url: city.image_url || '',
                tagline: city.tagline || '',
                status: city.status,
                priority_order: city.priority_order,
            });
        } else {
            setEditingCity(null);
            setFormData({
                name: '',
                slug: '',
                image_url: '',
                tagline: '',
                status: 'AVAILABLE',
                priority_order: cities.length,
            });
        }
        setDialogOpen(true);
    };

    const handleSaveCity = async () => {
        if (!formData.name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'City name is required',
            });
            return;
        }

        try {
            if (editingCity) {
                await api.request(`/api/admin/cities/${editingCity.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData),
                });
                toast({
                    title: 'Success',
                    description: `City "${formData.name}" updated successfully`,
                });
            } else {
                await api.request('/api/admin/cities', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
                toast({
                    title: 'Success',
                    description: `City "${formData.name}" created successfully`,
                });
            }
            setDialogOpen(false);
            fetchCities();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to save city',
            });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                variant: 'destructive',
                title: 'Invalid file type',
                description: 'Please upload a JPEG, PNG or WebP image.',
            });
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: 'File too large',
                description: 'Maximum file size is 5MB.',
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('asset_type', 'city');

        try {
            const response = await api.request('/api/admin/upload-asset', {
                method: 'POST',
                body: formData,
                headers: {}
            }) as { url: string };

            // Prepend API URL if the returned URL is a relative path
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const imageUrl = response.url.startsWith('/') ? `${apiUrl}${response.url}` : response.url;
            setFormData(prev => ({ ...prev, image_url: imageUrl }));
            toast({
                title: 'Success',
                description: 'Image uploaded successfully',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload failed',
                description: error.message || 'Failed to upload image',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteCity = async () => {
        if (!cityToDelete) return;

        try {
            await api.request(`/api/admin/cities/${cityToDelete.id}`, {
                method: 'DELETE',
            });
            toast({
                title: 'Success',
                description: `City "${cityToDelete.name}" deleted successfully`,
            });
            setDeleteDialogOpen(false);
            setCityToDelete(null);
            fetchCities();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to delete city',
            });
        }
    };

    const handleToggleStatus = async (city: City, newStatus: string) => {
        try {
            await api.request(`/api/admin/cities/${city.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            toast({
                title: 'Success',
                description: `City status updated to ${newStatus}`,
            });
            fetchCities();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update status',
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Available</Badge>;
            case 'COMING_SOON':
            case 'UPCOMING':
                return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1" /> Upcoming</Badge>;
            case 'DISABLED':
                return <Badge variant="secondary"><EyeOff className="h-3 w-3 mr-1" /> Disabled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p>Loading cities...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <MapPin className="h-7 w-7 text-primary" />
                                City Management
                            </h1>
                            <p className="text-muted-foreground">Manage cities where properties can be listed</p>
                        </div>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add City
                    </Button>
                </div>

                {/* Cities Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            All Cities ({cities.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>City</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Properties</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cities.map((city) => (
                                    <TableRow key={city.id} className={!city.is_active ? 'opacity-50' : ''}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {city.image_url ? (
                                                    <img
                                                        src={city.image_url}
                                                        alt={city.name}
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                        <MapPin className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{city.name}</p>
                                                    {city.tagline && (
                                                        <p className="text-xs text-muted-foreground">{city.tagline}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(city.status)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{city.property_count} properties</Badge>
                                        </TableCell>
                                        <TableCell>{city.priority_order}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Select
                                                    value={city.status}
                                                    onValueChange={(value) => handleToggleStatus(city, value)}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="AVAILABLE">
                                                            <span className="flex items-center gap-2">
                                                                <Eye className="h-3 w-3" /> Available
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="COMING_SOON">
                                                            <span className="flex items-center gap-2">
                                                                <Clock className="h-3 w-3" /> Upcoming
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="DISABLED">
                                                            <span className="flex items-center gap-2">
                                                                <EyeOff className="h-3 w-3" /> Disabled
                                                            </span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(city)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => {
                                                        setCityToDelete(city);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    disabled={city.property_count > 0}
                                                    title={city.property_count > 0 ? 'Cannot delete city with properties' : 'Delete city'}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Add/Edit City Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCity ? 'Edit City' : 'Add New City'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingCity
                                    ? 'Update the city details below.'
                                    : 'Enter the details for the new city.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">City Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Hyderabad"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tagline">Tagline</Label>
                                <Input
                                    id="tagline"
                                    value={formData.tagline}
                                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                    placeholder="e.g., City of Pearls"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="image_url">City Image</Label>
                                <div className="space-y-3">
                                    {formData.image_url ? (
                                        <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                                            <img
                                                src={formData.image_url}
                                                alt="City preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-muted/50">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                            <p className="text-xs text-muted-foreground">No image selected</p>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                id="image_url"
                                                value={formData.image_url}
                                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                placeholder="Paste image URL or upload..."
                                                className="pr-10"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="file"
                                                id="image-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => document.getElementById('image-upload')?.click()}
                                                disabled={uploading}
                                            >
                                                {uploading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Upload className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Recommended: 800x600px, JPEG/PNG/WebP (Max 5MB)
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AVAILABLE">Live (Available)</SelectItem>
                                            <SelectItem value="COMING_SOON">Upcoming (Coming Soon)</SelectItem>
                                            <SelectItem value="DISABLED">Disabled (Hidden)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority Order</Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        value={formData.priority_order}
                                        onChange={(e) => setFormData({ ...formData, priority_order: parseInt(e.target.value) || 0 })}
                                        min={0}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveCity}>
                                {editingCity ? 'Update City' : 'Add City'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Delete City</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{cityToDelete?.name}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteCity}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    );
};

export default AdminCities;
