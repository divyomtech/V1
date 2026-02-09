import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Info, Loader2, Plus, X } from 'lucide-react';
import { z } from 'zod';

// Property validation schema
const propertySchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().trim().max(2000, 'Description must be less than 2000 characters').optional(),
  address: z.string().trim().min(10, 'Address must be at least 10 characters').max(300, 'Address must be less than 300 characters'),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(50, 'City must be less than 50 characters'),
  locality: z.string().trim().min(2, 'Area must be at least 2 characters').max(100, 'Area must be less than 100 characters'),
  monthly_rent: z.number().int().min(0).max(1000000).optional(),
  maintenance_charge: z.number().int().min(0, 'Maintenance charge cannot be negative').max(100000, 'Maintenance charge must be less than ₹1,00,000').optional(),
  rules: z.string().trim().max(1000, 'Rules must be less than 1000 characters').optional(),
  photos: z.array(z.string().url('Each photo must be a valid URL')).max(20, 'Maximum 20 photos allowed'),
  gender_preference: z.enum(['male', 'female', 'mixed']),
  available_from: z.string().min(1, 'Available from date is required'),
  amenities: z.array(z.string()),
  rooms: z.array(z.object({
    room_type: z.string().min(1, 'Room type is required'),
    bed_count: z.number().int().min(1, 'Bed count must be at least 1'),
    price: z.number().int().min(0, 'Price cannot be negative'),
    deposit: z.number().int().min(0).max(5000000).optional(),
    vacancy_count: z.number().int().min(0, 'Vacancy count cannot be negative'),
    stay_type: z.enum(['monthly', 'daily']).optional(),
    min_stay: z.number().int().min(1).optional(),
    is_extension_allowed: z.boolean().optional(),
    complementaries: z.array(z.string()).optional(),
  })),
});

const AMENITIES = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'food', label: 'Food' },
  { id: 'ac', label: 'AC' },
  { id: 'parking', label: 'Parking' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'cctv', label: 'CCTV' },
  { id: 'fridge', label: 'Fridge' },
  { id: 'water', label: 'Hot Water' },
  { id: 'power_backup', label: 'Power Backup' },
];

const DAILY_COMPLEMENTARIES = [
  { id: 'food', label: 'Food' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'water', label: 'Water' },
  { id: 'wifi', label: 'WiFi' },
  { id: 'housekeeping', label: 'Housekeeping' },
  { id: 'power_backup', label: 'Power Backup' },
  { id: 'toiletries', label: 'Toiletries' },
  { id: 'linen', label: 'Bed Linen' },
  { id: 'ac', label: 'AC' },
];

const AddProperty = () => {
  const navigate = useNavigate();
  const { id: propertyId } = useParams<{ id: string }>();
  const isEditMode = Boolean(propertyId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [isAmenityDialogOpen, setIsAmenityDialogOpen] = useState(false);
  const [isCompDialogOpen, setIsCompDialogOpen] = useState(false);
  const [activeRoomIndex, setActiveRoomIndex] = useState<number | null>(null);
  const [customCompInput, setCustomCompInput] = useState('');
  const [customAmenitiesList, setCustomAmenitiesList] = useState<{ id: string, label: string }[]>([]);
  const [isNearbyCategoryDialogOpen, setIsNearbyCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [availableCities, setAvailableCities] = useState<{ id: string; name: string; status: string }[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    city_id: '',
    locality: '',
    monthly_rent: '0',
    maintenance_charge: '0',
    gender_preference: 'male',
    available_from: new Date().toISOString().split('T')[0],
    rules: '',
    amenities: [] as string[],
    photos: '',
    rooms: [] as {
      room_type: string;
      bed_count: number;
      price: number;
      deposit: number;
      vacancy_count: number;
      stay_type: 'monthly' | 'daily';
      min_stay: number;
      is_extension_allowed: boolean;
      complementaries: string[];
      caption?: string;
      room_description?: string;
      area_sqft?: number | null;
      width_ft?: number | null;
      has_ventilation?: boolean;
    }[],
    safety_score: 0,
    nearby_amenities: {
      metro: [] as string[],
      hospital: [] as string[],
      market: [] as string[],
      school: [] as string[],
    },
  });

  // Load existing property data in edit mode
  useEffect(() => {
    if (isEditMode && propertyId) {
      const loadProperty = async () => {
        try {
          const property = await api.getProperty(propertyId);
          setFormData({
            title: property.title || '',
            description: property.description || '',
            address: property.address || '',
            city: property.city || '',
            city_id: property.city_id || '',
            locality: property.locality || '',
            monthly_rent: String(property.monthly_rent || ''),
            maintenance_charge: String(property.maintenance_charge || '0'),
            gender_preference: property.gender_preference || 'male',
            available_from: property.available_from?.split('T')[0] || new Date().toISOString().split('T')[0],
            rules: property.rules || '',
            amenities: property.amenities || [],
            photos: (property.photos || []).join('\n'),
            rooms: (property.rooms || []).map((r: any) => ({
              room_type: r.room_type,
              bed_count: r.bed_count,
              price: r.price,
              deposit: r.deposit || 0,
              vacancy_count: r.vacancy_count || 0,
              stay_type: r.stay_type || 'monthly',
              min_stay: r.min_stay || 1,
              is_extension_allowed: r.is_extension_allowed !== undefined ? r.is_extension_allowed : true,
              complementaries: r.complementaries || [],
            })),
            safety_score: property.safety_score || 0,
            nearby_amenities: property.nearby_amenities || {
              metro: [],
              hospital: [],
              market: [],
              school: [],
            },
          });
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load property data',
          });
          navigate('/owner/properties');
        } finally {
          setInitialLoading(false);
        }
      };
      loadProperty();
    }
  }, [isEditMode, propertyId]);

  // Fetch available cities
  useEffect(() => {
    const loadCities = async () => {
      try {
        const cities = await api.request('/api/cities') as { id: string; name: string; status: string }[];
        setAvailableCities(cities);
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    loadCities();
  }, []);


  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleAmenity = (amenityId: string) => {
    const current = formData.amenities;
    if (current.includes(amenityId)) {
      handleChange('amenities', current.filter((a) => a !== amenityId));
    } else {
      handleChange('amenities', [...current, amenityId]);
    }
  };

  const addCustomAmenity = () => {
    if (customAmenityInput.trim()) {
      const newAmenity = {
        id: customAmenityInput.toLowerCase().replace(/\s+/g, '_'),
        label: customAmenityInput.trim()
      };
      setCustomAmenitiesList([...customAmenitiesList, newAmenity]);
      setFormData({
        ...formData,
        amenities: [...formData.amenities, newAmenity.id]
      });
      setCustomAmenityInput('');
      setIsAmenityDialogOpen(false);
    }
  };

  const addCustomComplementary = () => {
    if (activeRoomIndex !== null && customCompInput.trim()) {
      const current = formData.rooms[activeRoomIndex].complementaries || [];
      updateRoom(activeRoomIndex, 'complementaries', [...current, customCompInput.trim()]);
      setCustomCompInput('');
      setIsCompDialogOpen(false);
    }
  };

  // Get all available amenities (predefined + custom)
  const getAllAmenities = () => {
    return [...AMENITIES, ...customAmenitiesList];
  };

  const addNearbyCategory = () => {
    if (newCategoryName.trim()) {
      const categoryKey = newCategoryName.toLowerCase().replace(/\s+/g, '_');
      setFormData({
        ...formData,
        nearby_amenities: {
          ...formData.nearby_amenities,
          [categoryKey]: []
        }
      });
      setNewCategoryName('');
      setIsNearbyCategoryDialogOpen(false);
    }
  };

  const removeNearbyCategory = (categoryKey: string) => {
    const updated = { ...formData.nearby_amenities };
    delete (updated as any)[categoryKey];
    handleChange('nearby_amenities', updated);
  };

  const addRoom = () => {
    handleChange('rooms', [...formData.rooms, {
      room_type: 'Single Sharing',
      bed_count: 1,
      price: 0,
      deposit: 0,
      vacancy_count: 0,
      stay_type: 'monthly',
      min_stay: 1,
      is_extension_allowed: true,
      complementaries: []
    }]);
  };

  const removeRoom = (index: number) => {
    const newRooms = [...formData.rooms];
    newRooms.splice(index, 1);
    handleChange('rooms', newRooms);
  };

  const updateRoom = (index: number, field: string, value: any) => {
    const newRooms = [...formData.rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    handleChange('rooms', newRooms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse and validate photo URLs
      const photoUrls = formData.photos
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      // Prepare data for validation
      const dataToValidate = {
        title: formData.title,
        description: formData.description || '',
        address: formData.address,
        city: formData.city,
        city_id: formData.city_id || undefined,
        locality: formData.locality,
        monthly_rent: parseInt(formData.monthly_rent) || 0,
        maintenance_charge: parseInt(formData.maintenance_charge) || 0,
        gender_preference: formData.gender_preference as 'male' | 'female' | 'mixed',
        available_from: formData.available_from,
        rules: formData.rules || '',
        amenities: formData.amenities,
        photos: photoUrls,
        rooms: formData.rooms.map(r => ({
          ...r,
          deposit: parseInt(r.deposit as any) || 0
        })),
      };

      // Calculate representative monthly_rent and deposit for listing view (Lead Room = Cheapest Monthly Room)
      const monthlyRooms = formData.rooms.filter(r => (r.stay_type || 'monthly') === 'monthly');
      const leadRoom = monthlyRooms.length > 0
        ? [...monthlyRooms].sort((a, b) => (a.price || 0) - (b.price || 0))[0]
        : null;

      if (leadRoom) {
        dataToValidate.monthly_rent = leadRoom.price;
        // @ts-ignore - dynamic data
        dataToValidate.deposit = leadRoom.deposit;
      }

      // Validate all inputs
      const validatedData = propertySchema.parse(dataToValidate);

      const propertyData = {
        title: validatedData.title,
        description: validatedData.description || undefined,
        address: validatedData.address,
        city: validatedData.city,
        locality: validatedData.locality,
        monthly_rent: validatedData.monthly_rent,
        deposit: validatedData.deposit,
        maintenance_charge: validatedData.maintenance_charge,
        gender_preference: validatedData.gender_preference as 'male' | 'female' | 'mixed',
        available_from: validatedData.available_from,
        rules: validatedData.rules || undefined,
        amenities: validatedData.amenities,
        photos: validatedData.photos,
        rooms: validatedData.rooms,
        safety_score: formData.safety_score || undefined,
        nearby_amenities: Object.values(formData.nearby_amenities).some(arr => arr.length > 0)
          ? formData.nearby_amenities
          : undefined,
      };

      // Use update API for edit mode, create API for add mode
      if (isEditMode && propertyId) {
        await api.updateProperty(propertyId, propertyData);
        toast({
          title: 'Success',
          description: 'Property updated successfully',
        });
      } else {
        await api.createProperty(propertyData);
        toast({
          title: 'Success',
          description: 'Property added successfully',
        });
      }

      navigate('/owner/properties');
    } catch (error: any) {
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: firstError.message,
        });
      } else {
        // Handle different error formats
        let errorMessage = 'Failed to save property';
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.detail) {
          errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
        } else if (error?.message) {
          errorMessage = typeof error.message === 'string' ? error.message : 'An unexpected error occurred';
        }
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{isEditMode ? 'Edit Property' : 'Add New Property'}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    required
                    minLength={5}
                    maxLength={100}
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., Comfortable PG near Metro"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    5-100 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    maxLength={2000}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your property..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 2000 characters
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Select
                      value={formData.city_id || ''}
                      onValueChange={(value) => {
                        const selectedCity = availableCities.find(c => c.id === value);
                        if (selectedCity) {
                          setFormData({ ...formData, city_id: value, city: selectedCity.name });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.filter(c => c.status === 'AVAILABLE').map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                        {availableCities.filter(c => c.status === 'COMING_SOON' || c.status === 'UPCOMING').length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-sm text-muted-foreground font-medium pointer-events-none">
                              — Coming Soon —
                            </div>
                            {availableCities.filter(c => c.status === 'COMING_SOON' || c.status === 'UPCOMING').map((city) => (
                              <SelectItem key={city.id} value={city.id} disabled>
                                {city.name} (Coming Soon)
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="locality">Area *</Label>
                    <Input
                      id="locality"
                      required
                      value={formData.locality}
                      onChange={(e) => handleChange('locality', e.target.value)}
                      placeholder="e.g., Koramangala, KPHB"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Full Address *</Label>
                  <Textarea
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Full address with landmark"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Global deposit removed - now per room */}
                  <div>
                    <Label htmlFor="maintenance">Monthly Maintenance Charge (₹)</Label>
                    <Input
                      id="maintenance"
                      type="number"
                      min="0"
                      max="100000"
                      value={formData.maintenance_charge}
                      onChange={(e) => handleChange('maintenance_charge', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender Preference *</Label>
                    <Select
                      value={formData.gender_preference}
                      onValueChange={(value) => handleChange('gender_preference', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Boys Only</SelectItem>
                        <SelectItem value="female">Girls Only</SelectItem>
                        <SelectItem value="mixed">Co-living</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="available_from">Available From *</Label>
                    <Input
                      id="available_from"
                      type="date"
                      required
                      value={formData.available_from}
                      onChange={(e) => handleChange('available_from', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>



            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Amenities</CardTitle>
                <Dialog open={isAmenityDialogOpen} onOpenChange={setIsAmenityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Custom Amenity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-amenity">Amenity Name</Label>
                        <Input
                          id="custom-amenity"
                          placeholder="e.g., Gym, Swimming Pool, TV"
                          value={customAmenityInput}
                          onChange={(e) => setCustomAmenityInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomAmenity();
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAmenityDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={addCustomAmenity}
                          disabled={!customAmenityInput.trim()}
                        >
                          Add Amenity
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCompDialogOpen} onOpenChange={setIsCompDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Custom Complementary</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom-comp text-sm">Complementary Name</Label>
                        <Input
                          id="custom-comp"
                          placeholder="e.g., Early Check-in, Welcome Drink"
                          value={customCompInput}
                          onChange={(e) => setCustomCompInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomComplementary();
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCompDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={addCustomComplementary}
                          disabled={!customCompInput.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* All amenities (predefined + custom) */}
                  {getAllAmenities().map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={formData.amenities.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      <Label htmlFor={amenity.id} className="cursor-pointer">
                        {amenity.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Safety & Nearby Places</CardTitle>
                <Dialog open={isNearbyCategoryDialogOpen} onOpenChange={setIsNearbyCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input
                          id="category-name"
                          placeholder="e.g., Bus Stops, Malls"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsNearbyCategoryDialogOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={addNearbyCategory} disabled={!newCategoryName.trim()}>Add</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Safety Score */}
                <div>
                  <Label htmlFor="safety_score" className="flex items-center gap-2 mb-2">
                    Safety Score
                    <Badge variant="outline" className="font-normal text-xs">0-5 stars</Badge>
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="safety_score"
                      type="number"
                      min="0"
                      max="5"
                      step="1"
                      value={formData.safety_score}
                      onChange={(e) => handleChange('safety_score', Math.min(5, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-24"
                    />
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleChange('safety_score', star)}
                          className={`p-1 transition-colors ${formData.safety_score >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formData.safety_score >= 4 ? 'Very Safe' : formData.safety_score >= 3 ? 'Safe' : formData.safety_score >= 2 ? 'Moderate' : 'Not Set'}
                    </span>
                  </div>
                </div>

                {/* Nearby Amenities */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Nearby Places</Label>
                  <p className="text-xs text-muted-foreground -mt-2">Add places near your property (comma-separated)</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(formData.nearby_amenities).map(([key, value]) => (
                      <div key={key} className="relative group">
                        <Label htmlFor={`nearby_${key}`} className="text-sm flex items-center gap-2 capitalize">
                          {key.replace(/_/g, ' ')}
                          {!['metro', 'hospital', 'market', 'school'].includes(key) && (
                            <button
                              type="button"
                              onClick={() => removeNearbyCategory(key)}
                              className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Label>
                        <Input
                          id={`nearby_${key}`}
                          placeholder={`Add ${key.replace(/_/g, ' ')}...`}
                          value={(value as string[]).join(', ')}
                          onChange={(e) => handleChange('nearby_amenities', {
                            ...formData.nearby_amenities,
                            [key]: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>House Rules & Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rules">House Rules</Label>
                  <Textarea
                    id="rules"
                    maxLength={1000}
                    value={formData.rules}
                    onChange={(e) => handleChange('rules', e.target.value)}
                    placeholder="Describe your house rules..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 1000 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="photos">Photo URLs (one per line)</Label>
                  <Textarea
                    id="photos"
                    value={formData.photos}
                    onChange={(e) => handleChange('photos', e.target.value)}
                    placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add photo URLs, one per line
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/owner/properties')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Property' : 'Add Property'}
              </Button>
            </div>
          </form>
        </div>
      </div >
    </div >
  );
};

export default AddProperty;
