import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Train, Hospital, ShoppingCart, GraduationCap, MapPin } from 'lucide-react';

interface NearbyAmenitiesProps {
  amenities: {
    metro?: string[];
    hospital?: string[];
    market?: string[];
    school?: string[];
  };
}

export const NearbyAmenities = ({ amenities }: NearbyAmenitiesProps) => {
  const amenityTypes = [
    { key: 'metro', label: 'Metro Stations', icon: Train, color: 'bg-blue-100 text-blue-700' },
    { key: 'hospital', label: 'Hospitals', icon: Hospital, color: 'bg-red-100 text-red-700' },
    { key: 'market', label: 'Markets', icon: ShoppingCart, color: 'bg-green-100 text-green-700' },
    { key: 'school', label: 'Schools', icon: GraduationCap, color: 'bg-purple-100 text-purple-700' },
  ];

  const hasAnyAmenities = Object.values(amenities || {}).some(arr => arr && arr.length > 0);

  if (!hasAnyAmenities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nearby Amenities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No nearby amenities information available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Nearby Amenities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(amenities || {}).map(([key, items]) => {
            if (!items || (items as string[]).length === 0) return null;

            const predefined = amenityTypes.find(t => t.key === key);
            const label = predefined?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const Icon = predefined?.icon || MapPin;
            const color = predefined?.color || 'bg-muted text-muted-foreground';

            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(items as string[]).map((item, idx) => (
                    <Badge key={idx} variant="secondary" className={color}>
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};