import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

// Property validation schema
const propertySchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().trim().max(2000, 'Description must be less than 2000 characters').optional(),
  address: z.string().trim().min(10, 'Address must be at least 10 characters').max(300, 'Address must be less than 300 characters'),
  city: z.string().trim().min(2, 'City must be at least 2 characters').max(50, 'City must be less than 50 characters'),
  locality: z.string().trim().min(2, 'Locality must be at least 2 characters').max(100, 'Locality must be less than 100 characters'),
  monthly_rent: z.number().int().min(1000, 'Rent must be at least ₹1,000').max(1000000, 'Rent must be less than ₹10,00,000'),
  deposit: z.number().int().min(0, 'Deposit cannot be negative').max(5000000, 'Deposit must be less than ₹50,00,000'),
  rules: z.string().trim().max(1000, 'Rules must be less than 1000 characters').optional(),
  photos: z.array(z.string().url('Each photo must be a valid URL')).max(20, 'Maximum 20 photos allowed'),
  gender_preference: z.enum(['male', 'female', 'unisex']),
  available_from: z.string().min(1, 'Available from date is required'),
  amenities: z.array(z.string()),
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

const AddProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    locality: '',
    monthly_rent: '',
    deposit: '',
    gender_preference: 'male',
    available_from: new Date().toISOString().split('T')[0],
    rules: '',
    amenities: [] as string[],
    photos: '',
  });

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
        locality: formData.locality,
        monthly_rent: parseInt(formData.monthly_rent),
        deposit: parseInt(formData.deposit),
        gender_preference: formData.gender_preference as 'male' | 'female' | 'unisex',
        available_from: formData.available_from,
        rules: formData.rules || '',
        amenities: formData.amenities,
        photos: photoUrls,
      };

      // Validate all inputs
      const validatedData = propertySchema.parse(dataToValidate);

      // Insert validated data
      const { error } = await supabase.from('properties').insert({
        owner_id: user?.id,
        title: validatedData.title,
        description: validatedData.description || null,
        address: validatedData.address,
        city: validatedData.city,
        locality: validatedData.locality,
        monthly_rent: validatedData.monthly_rent,
        deposit: validatedData.deposit,
        gender_preference: validatedData.gender_preference,
        available_from: validatedData.available_from,
        rules: validatedData.rules || null,
        amenities: validatedData.amenities,
        photos: validatedData.photos,
        status: 'active',
      } as any);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Property added successfully',
      });

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
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
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
          <h1 className="text-3xl font-bold mb-8">Add New Property</h1>

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
                    <Input
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="e.g., Bangalore"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locality">Locality *</Label>
                    <Input
                      id="locality"
                      required
                      value={formData.locality}
                      onChange={(e) => handleChange('locality', e.target.value)}
                      placeholder="e.g., Koramangala"
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
                <div>
                  <Label htmlFor="rent">Monthly Rent (₹) *</Label>
                  <Input
                    id="rent"
                    type="number"
                    required
                    min="1000"
                    max="1000000"
                    value={formData.monthly_rent}
                    onChange={(e) => handleChange('monthly_rent', e.target.value)}
                    placeholder="10000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Between ₹1,000 and ₹10,00,000
                  </p>
                </div>
                <div>
                  <Label htmlFor="deposit">Security Deposit (₹) *</Label>
                  <Input
                    id="deposit"
                    type="number"
                    required
                    min="0"
                    max="5000000"
                    value={formData.deposit}
                    onChange={(e) => handleChange('deposit', e.target.value)}
                    placeholder="10000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum ₹50,00,000
                  </p>
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
                        <SelectItem value="unisex">Co-living</SelectItem>
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
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {AMENITIES.map((amenity) => (
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
                Add Property
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;
