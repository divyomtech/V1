import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, Heart, X, Check } from 'lucide-react';

interface RoommateProfile {
  id: string;
  user_id: string;
  age_range: string;
  occupation: string;
  lifestyle: string[];
  interests: string[];
  dietary_preference: string;
  smoking: boolean;
  drinking: boolean;
  pets: boolean;
  cleanliness_level: number;
  budget_min: number;
  budget_max: number;
  preferred_gender: string;
  preferred_locations: string[];
  bio: string;
  looking_for_roommate: boolean;
  matchScore?: number;
  profiles?: {
    name: string;
    profile_photo: string | null;
    city: string | null;
  };
}

const lifestyleOptions = ['early_bird', 'night_owl', 'social', 'quiet', 'fitness_enthusiast', 'homebody'];
const interestOptions = ['sports', 'music', 'cooking', 'reading', 'movies', 'gaming', 'travel', 'art'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

const RoommateMatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [myProfile, setMyProfile] = useState<RoommateProfile | null>(null);
  const [matches, setMatches] = useState<RoommateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    age_range: '',
    occupation: '',
    lifestyle: [] as string[],
    interests: [] as string[],
    dietary_preference: '',
    smoking: false,
    drinking: false,
    pets: false,
    cleanliness_level: 3,
    budget_min: 5000,
    budget_max: 20000,
    preferred_gender: 'any',
    preferred_locations: [] as string[],
    bio: '',
    looking_for_roommate: false,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfileAndMatches();
  }, [user]);

  const fetchProfileAndMatches = async () => {
    try {
      // Try to get existing profile
      const profile = await api.getRoommateProfile();
      setMyProfile(profile);
      setFormData({
        age_range: profile.age?.toString() || '',
        occupation: profile.occupation || '',
        lifestyle: profile.preferences || [],
        interests: profile.hobbies || [],
        dietary_preference: '',
        smoking: profile.preferences?.includes('smoker') || false,
        drinking: false,
        pets: profile.preferences?.includes('pet_friendly') || false,
        cleanliness_level: 3,
        budget_min: profile.budget_min || 5000,
        budget_max: profile.budget_max || 20000,
        preferred_gender: profile.gender || 'any',
        preferred_locations: profile.preferred_location ? [profile.preferred_location] : [],
        bio: profile.bio || '',
        looking_for_roommate: profile.is_active || false,
      });

      // Fetch matches
      const matchResults = await api.getRoommateMatches();
      setMatches(matchResults.map((m: any) => ({
        id: m.id,
        user_id: m.matched_user_id,
        matchScore: m.match_score,
        bio: m.bio,
        profiles: {
          name: m.user_name,
          profile_photo: m.user_photo,
          city: null,
        },
        occupation: m.occupation,
        lifestyle: m.preferences || [],
        interests: m.preferences || [],
        age_range: m.age?.toString() || '',
        dietary_preference: '',
        smoking: false,
        drinking: false,
        pets: false,
        cleanliness_level: 3,
        budget_min: 0,
        budget_max: 0,
        preferred_gender: '',
        preferred_locations: [],
        looking_for_roommate: true,
      })) as RoommateProfile[]);
      setEditing(false);
    } catch (error) {
      // No profile exists, show create form
      setEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const profileData = {
        age: formData.age_range ? parseInt(formData.age_range) : undefined,
        occupation: formData.occupation,
        preferences: [...formData.lifestyle, formData.smoking ? 'smoker' : 'non_smoker', formData.pets ? 'pet_friendly' : ''].filter(Boolean),
        hobbies: formData.interests,
        budget_min: formData.budget_min,
        budget_max: formData.budget_max,
        preferred_city: formData.preferred_locations[0],
        bio: formData.bio,
        gender: formData.preferred_gender,
      };

      const savedProfile = await api.createOrUpdateRoommateProfile(profileData);
      setMyProfile(savedProfile);
      setEditing(false);

      toast({
        title: 'Profile Saved',
        description: 'Your roommate preferences have been saved!',
      });

      // Refresh matches
      fetchProfileAndMatches();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: 'Error',
        description: error.message || 'Failed to save profile',
      });
    }
  };

  const calculateMatchScore = (profile: RoommateProfile): number => {
    if (!myProfile) return 0;

    let score = 0;
    const weights = {
      lifestyle: 2,
      interests: 2,
      habits: 1.5,
      budget: 1.5,
      location: 1,
    };

    // Lifestyle match
    const commonLifestyle = profile.lifestyle?.filter(l => myProfile.lifestyle?.includes(l)).length || 0;
    score += (commonLifestyle / Math.max(profile.lifestyle?.length || 1, 1)) * weights.lifestyle * 20;

    // Interests match
    const commonInterests = profile.interests?.filter(i => myProfile.interests?.includes(i)).length || 0;
    score += (commonInterests / Math.max(profile.interests?.length || 1, 1)) * weights.interests * 20;

    // Habits match
    if (profile.smoking === myProfile.smoking) score += weights.habits * 10;
    if (profile.drinking === myProfile.drinking) score += weights.habits * 10;
    if (profile.pets === myProfile.pets) score += weights.habits * 10;

    // Budget overlap
    const budgetOverlap =
      Math.min(profile.budget_max, myProfile.budget_max) -
      Math.max(profile.budget_min, myProfile.budget_min);
    if (budgetOverlap > 0) {
      score += weights.budget * 10;
    }

    // Location match
    const commonLocations = profile.preferred_locations?.filter(l =>
      myProfile.preferred_locations?.includes(l)
    ).length || 0;
    if (commonLocations > 0) score += weights.location * 10;

    return Math.min(Math.round(score), 100);
  };

  const sortedMatches = matches
    .map(m => ({ ...m, matchScore: calculateMatchScore(m) }))
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Roommate Matching</h1>
              <p className="text-muted-foreground">Find your perfect roommate match</p>
            </div>
            {myProfile && !editing && (
              <Button onClick={() => setEditing(true)}>Edit Profile</Button>
            )}
          </div>

          <Tabs defaultValue={myProfile ? 'matches' : 'profile'} className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">My Profile</TabsTrigger>
              <TabsTrigger value="matches">Find Matches</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Roommate Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Age Range</Label>
                      <Input
                        placeholder="e.g., 22-28"
                        value={formData.age_range}
                        onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label>Occupation</Label>
                      <Input
                        placeholder="e.g., Software Engineer"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Lifestyle</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {lifestyleOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`lifestyle-${option}`}
                            checked={formData.lifestyle.includes(option)}
                            onCheckedChange={(checked) => {
                              setFormData({
                                ...formData,
                                lifestyle: checked
                                  ? [...formData.lifestyle, option]
                                  : formData.lifestyle.filter((l) => l !== option),
                              });
                            }}
                            disabled={!editing}
                          />
                          <label htmlFor={`lifestyle-${option}`} className="text-sm capitalize">
                            {option.replace('_', ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Interests</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {interestOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`interest-${option}`}
                            checked={formData.interests.includes(option)}
                            onCheckedChange={(checked) => {
                              setFormData({
                                ...formData,
                                interests: checked
                                  ? [...formData.interests, option]
                                  : formData.interests.filter((i) => i !== option),
                              });
                            }}
                            disabled={!editing}
                          />
                          <label htmlFor={`interest-${option}`} className="text-sm capitalize">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Dietary Preference</Label>
                      <Select
                        value={formData.dietary_preference}
                        onValueChange={(value) =>
                          setFormData({ ...formData, dietary_preference: value })
                        }
                        disabled={!editing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="veg">Vegetarian</SelectItem>
                          <SelectItem value="non_veg">Non-Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="any">Any</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Preferred Gender</Label>
                      <Select
                        value={formData.preferred_gender}
                        onValueChange={(value) =>
                          setFormData({ ...formData, preferred_gender: value })
                        }
                        disabled={!editing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="any">Any</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cleanliness (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.cleanliness_level}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cleanliness_level: parseInt(e.target.value),
                          })
                        }
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Budget Min (₹)</Label>
                      <Input
                        type="number"
                        value={formData.budget_min}
                        onChange={(e) =>
                          setFormData({ ...formData, budget_min: parseInt(e.target.value) })
                        }
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label>Budget Max (₹)</Label>
                      <Input
                        type="number"
                        value={formData.budget_max}
                        onChange={(e) =>
                          setFormData({ ...formData, budget_max: parseInt(e.target.value) })
                        }
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="smoking"
                        checked={formData.smoking}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, smoking: checked as boolean })
                        }
                        disabled={!editing}
                      />
                      <label htmlFor="smoking" className="text-sm">
                        Smoking
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="drinking"
                        checked={formData.drinking}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, drinking: checked as boolean })
                        }
                        disabled={!editing}
                      />
                      <label htmlFor="drinking" className="text-sm">
                        Drinking
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pets"
                        checked={formData.pets}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, pets: checked as boolean })
                        }
                        disabled={!editing}
                      />
                      <label htmlFor="pets" className="text-sm">
                        Pets
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Locations</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {cities.map((city) => (
                        <div key={city} className="flex items-center space-x-2">
                          <Checkbox
                            id={`city-${city}`}
                            checked={formData.preferred_locations.includes(city)}
                            onCheckedChange={(checked) => {
                              setFormData({
                                ...formData,
                                preferred_locations: checked
                                  ? [...formData.preferred_locations, city]
                                  : formData.preferred_locations.filter((c) => c !== city),
                              });
                            }}
                            disabled={!editing}
                          />
                          <label htmlFor={`city-${city}`} className="text-sm">
                            {city}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      placeholder="Tell potential roommates about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!editing}
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="looking"
                      checked={formData.looking_for_roommate}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, looking_for_roommate: checked as boolean })
                      }
                      disabled={!editing}
                    />
                    <label htmlFor="looking" className="text-sm font-medium">
                      I'm actively looking for a roommate
                    </label>
                  </div>

                  {editing && (
                    <div className="flex gap-2">
                      <Button onClick={saveProfile}>Save Profile</Button>
                      {myProfile && (
                        <Button variant="outline" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="matches">
              {!myProfile?.looking_for_roommate ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Enable Roommate Search</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete your profile and enable "Looking for roommate" to see matches
                    </p>
                    <Button onClick={() => setEditing(true)}>Complete Profile</Button>
                  </CardContent>
                </Card>
              ) : sortedMatches.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Matches Yet</h3>
                    <p className="text-muted-foreground">
                      Check back later for potential roommate matches
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {sortedMatches.map((match) => (
                    <Card key={match.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={match.profiles?.profile_photo || ''} />
                            <AvatarFallback>
                              <User className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-lg">
                                {match.profiles?.name || 'Anonymous'}
                              </h3>
                              <Badge variant="secondary">{match.matchScore}% Match</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {match.occupation} • {match.age_range}
                            </p>
                            {match.profiles?.city && (
                              <p className="text-sm text-muted-foreground">{match.profiles.city}</p>
                            )}
                          </div>
                        </div>

                        {match.bio && (
                          <p className="text-sm mb-3 line-clamp-2">{match.bio}</p>
                        )}

                        <div className="space-y-2 text-sm mb-4">
                          {match.lifestyle && match.lifestyle.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {match.lifestyle.map((item) => (
                                <Badge key={item} variant="outline" className="text-xs">
                                  {item.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {match.interests && match.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {match.interests.map((item) => (
                                <Badge key={item} variant="secondary" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Budget: ₹{match.budget_min.toLocaleString()} - ₹{match.budget_max.toLocaleString()}</span>
                          </div>
                        </div>

                        <Button className="w-full" size="sm">
                          Connect
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RoommateMatch;
