import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft, Star, MapPin, Calendar, Phone, Mail, MessageSquare,
    Building2, Heart, CheckCircle, TrendingUp, Users, Clock, Loader2
} from 'lucide-react';
import api from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface HostProfile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profile_photo: string | null;
    about: string | null;
    city: string | null;
    languages_known: string[];
    is_verified: boolean;
    years_hosting: number;
    member_since_date: string | null;
    properties_count: number;
    avg_rating: number;
    total_reviews: number;
    stats: {
        response_rate: number;
        occupancy_rate: number;
        repeat_guest_rate: number;
        response_time: string;
    };
    is_active_host: boolean;
    availability: {
        is_available: boolean;
        available_from: string;
        available_to: string;
        available_days: string[];
    };
}

interface HostProperty {
    id: string;
    title: string;
    address: string;
    locality: string;
    city: string;
    gender_preference: string;
    monthly_rent: number;
    photos: string[];
    amenities: string[];
    vacancy_count: number;
    avg_rating: number;
    reviews_count: number;
}

interface HostReview {
    id: string;
    rating: number;
    comment: string | null;
    cleanliness_rating: number | null;
    food_rating: number | null;
    safety_rating: number | null;
    created_at: string | null;
    reviewer: {
        name: string;
        profile_photo: string | null;
    };
    property: {
        id: string | null;
        title: string | null;
    };
}

const getPhotoUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function HostProfile() {
    const { hostId } = useParams<{ hostId: string }>();
    const navigate = useNavigate();
    const [host, setHost] = useState<HostProfile | null>(null);
    const [properties, setProperties] = useState<HostProperty[]>([]);
    const [reviews, setReviews] = useState<HostReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('properties');

    useEffect(() => {
        if (hostId) {
            fetchHostData();
        }
    }, [hostId]);

    const fetchHostData = async () => {
        try {
            setLoading(true);
            const [hostData, propertiesData, reviewsData] = await Promise.all([
                api.getHostProfile(hostId!),
                api.getHostProperties(hostId!),
                api.getHostReviews(hostId!)
            ]);
            setHost(hostData);
            setProperties(propertiesData);
            setReviews(reviewsData);
        } catch (error) {
            console.error('Error fetching host data:', error);
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

    if (!host) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <p className="text-center text-muted-foreground">Host not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-6 pb-24 max-w-6xl">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-4"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Previous Page
                </Button>

                {/* Host Header Card */}
                <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-0">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Host Info */}
                            <div className="flex items-start gap-4 flex-1">
                                <Avatar className="h-20 w-20 border-4 border-primary/30">
                                    <AvatarImage src={getPhotoUrl(host.profile_photo) || undefined} />
                                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                        {host.name?.substring(0, 2).toUpperCase() || 'H'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h1 className="text-2xl font-bold">{host.name}</h1>
                                        {host.is_verified && (
                                            <Badge className="bg-green-100 text-green-700 gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                Verified
                                            </Badge>
                                        )}
                                        <Badge variant="outline">Property Host</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-4 w-4" />
                                            {host.properties_count} Properties
                                        </span>
                                        {host.city && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {host.city}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {host.years_hosting > 0 ? `${host.years_hosting}+ years hosting` : 'New host'}
                                        </span>
                                    </div>
                                    {/* Star Rating */}
                                    <div className="flex items-center gap-1 mt-2">
                                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                        <span className="font-semibold">{host.avg_rating}</span>
                                        <span className="text-sm text-muted-foreground">
                                            ({host.total_reviews} reviews)
                                        </span>
                                    </div>
                                    {/* Contact Buttons */}
                                    <div className="flex gap-2 mt-4 flex-wrap">
                                        {host.phone && (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                                <Phone className="h-4 w-4 mr-2" />
                                                Call Host
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline">
                                            <Mail className="h-4 w-4 mr-2" />
                                            Send Message
                                        </Button>
                                        {host.phone && (
                                            <Button
                                                size="sm"
                                                className="bg-green-500 hover:bg-green-600"
                                                onClick={() => {
                                                    const cleanPhone = host.phone?.replace(/\D/g, '') || '';
                                                    const phoneNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
                                                    window.open(`https://wa.me/${phoneNumber}`, '_blank');
                                                }}
                                            >
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                WhatsApp
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Performance Stats */}
                            <Card className="md:w-80">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        Host Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Response Rate</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500 rounded-full"
                                                    style={{ width: `${host.stats.response_rate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-red-500">
                                                {host.stats.response_rate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500 rounded-full"
                                                    style={{ width: `${host.stats.occupancy_rate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-red-500">
                                                {host.stats.occupancy_rate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Repeat Guests</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500 rounded-full"
                                                    style={{ width: `${host.stats.repeat_guest_rate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-red-500">
                                                {host.stats.repeat_guest_rate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Response Time</span>
                                        <span className="text-sm font-semibold text-primary">
                                            {host.stats.response_time}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="properties">
                            All Properties ({properties.length})
                        </TabsTrigger>
                        <TabsTrigger value="reviews">
                            Reviews ({host.total_reviews})
                        </TabsTrigger>
                        <TabsTrigger value="about">
                            About Host
                        </TabsTrigger>
                    </TabsList>

                    {/* Properties Tab */}
                    <TabsContent value="properties">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold">All Properties by {host.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {properties.length} properties available for booking
                                </p>
                            </div>
                            {host.is_active_host ? (
                                <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
                                    <Users className="h-3 w-3" />
                                    Active Host
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1 text-gray-500 border-gray-300">
                                    <Users className="h-3 w-3" />
                                    Host
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {properties.map((property) => (
                                <Card
                                    key={property.id}
                                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                                    onClick={() => navigate(`/properties/${property.id}`)}
                                >
                                    <div className="relative">
                                        {property.photos && property.photos.length > 0 ? (
                                            <img
                                                src={getPhotoUrl(property.photos[0]) || '/placeholder.jpg'}
                                                alt={property.title}
                                                className="w-full h-40 object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-40 bg-muted flex items-center justify-center">
                                                <Building2 className="h-12 w-12 text-muted-foreground/50" />
                                            </div>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // TODO: Add to favorites
                                            }}
                                        >
                                            <Heart className="h-4 w-4" />
                                        </Button>
                                        {property.vacancy_count > 0 && (
                                            <Badge className="absolute bottom-2 left-2 bg-green-600">
                                                {property.vacancy_count} beds available
                                            </Badge>
                                        )}
                                    </div>
                                    <CardContent className="pt-4">
                                        <h3 className="font-semibold line-clamp-1">{property.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {property.locality}, {property.city}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-sm font-medium">{property.avg_rating}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({property.reviews_count})
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-primary">
                                                    ₹{property.monthly_rent?.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-muted-foreground">/month</span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="mt-2 text-xs">
                                            {property.gender_preference === 'mixed' ? 'Co-living' :
                                                property.gender_preference === 'boys' ? 'Boys' :
                                                    property.gender_preference === 'girls' ? 'Girls' :
                                                        property.gender_preference || 'Co-living'}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {properties.length === 0 && (
                            <div className="text-center py-12">
                                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground">No properties found</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Reviews Tab */}
                    <TabsContent value="reviews">
                        {reviews.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {reviews.length} reviews, sorted by highest rating
                                    </p>
                                </div>
                                {reviews.map((review) => (
                                    <Card key={review.id} className="p-4">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={getPhotoUrl(review.reviewer.profile_photo) || undefined} />
                                                <AvatarFallback>
                                                    {review.reviewer.name?.substring(0, 2).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold">{review.reviewer.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {review.property.title && `Stayed at ${review.property.title}`}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={`h-4 w-4 ${star <= review.rating
                                                                    ? 'text-yellow-500 fill-yellow-500'
                                                                    : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        {review.comment}
                                                    </p>
                                                )}
                                                {/* Sub-ratings */}
                                                {(review.cleanliness_rating || review.food_rating || review.safety_rating) && (
                                                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                        {review.cleanliness_rating && (
                                                            <span>Cleanliness: {review.cleanliness_rating}/5</span>
                                                        )}
                                                        {review.food_rating && (
                                                            <span>Food: {review.food_rating}/5</span>
                                                        )}
                                                        {review.safety_rating && (
                                                            <span>Safety: {review.safety_rating}/5</span>
                                                        )}
                                                    </div>
                                                )}
                                                {review.created_at && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {new Date(review.created_at).toLocaleDateString('en-IN', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground">
                                    No reviews yet for {host.name}'s properties
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* About Tab */}
                    <TabsContent value="about">
                        <Card>
                            <CardHeader>
                                <CardTitle>About {host.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {host.about ? (
                                    <p className="text-muted-foreground">{host.about}</p>
                                ) : (
                                    <p className="text-muted-foreground italic">
                                        No description provided by the host.
                                    </p>
                                )}

                                {host.languages_known && host.languages_known.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Languages</h4>
                                        <div className="flex gap-2 flex-wrap">
                                            {host.languages_known.map((lang, idx) => (
                                                <Badge key={idx} variant="outline">{lang}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Member Since</p>
                                        <p className="font-medium">{host.member_since_date || `${host.years_hosting}+ years`}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Properties</p>
                                        <p className="font-medium">{host.properties_count} listings</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Response Time</p>
                                        <p className="font-medium">{host.stats.response_time}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Response Rate</p>
                                        <p className="font-medium">{host.stats.response_rate}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Host Availability Card */}
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Host Availability</span>
                                    <Badge
                                        variant={host.availability?.is_available ? "default" : "secondary"}
                                        className={host.availability?.is_available ? "bg-green-500" : "bg-gray-400"}
                                    >
                                        {host.availability?.is_available ? "Available" : "Not Available"}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Contact Hours</p>
                                        <p className="font-medium">
                                            {host.availability?.available_from || "09:00"} - {host.availability?.available_to || "21:00"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Available Days</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(host.availability?.available_days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((day, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">{day}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {!host.availability?.is_available && (
                                    <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                                        ⚠️ This host is currently marked as not available. They may take longer to respond.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
