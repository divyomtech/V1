import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Building2, Save, Upload, Check, X, FileText, CreditCard, Shield, Bell, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    name: "",
    full_name: "",
    display_name: "",
    business_name: "",
    phone: "",
    phone_verified: false,
    city: "",
    address: "",
    current_address: "",
    permanent_address: "",
    profile_photo: "",
    avatar_url: "",
    gender: "",
    date_of_birth: "",
    aadhar_front_url: "",
    aadhar_back_url: "",
    college_company_id_url: "",
    pan_card_url: "",
    gst_doc_url: "",
    profile_verification_status: "pending",
    about: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_address: "",
    work_type: "",
    work_place: "",
    languages_known: [],
    mother_tongue: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      // Try to get profile from API
      const data = await api.getProfile();
      if (data) {
        setProfile({
          name: data.name || "",
          full_name: data.full_name || "",
          display_name: data.display_name || "",
          business_name: data.business_name || "",
          phone: data.phone || "",
          phone_verified: data.phone_verified || false,
          city: data.city || "",
          address: data.address || "",
          current_address: data.current_address || "",
          permanent_address: data.permanent_address || "",
          profile_photo: data.profile_photo || "",
          avatar_url: data.avatar_url || "",
          gender: data.gender || "",
          date_of_birth: data.date_of_birth || "",
          aadhar_front_url: data.aadhar_front_url || "",
          aadhar_back_url: data.aadhar_back_url || "",
          college_company_id_url: data.college_company_id_url || "",
          pan_card_url: data.pan_card_url || "",
          gst_doc_url: data.gst_doc_url || "",
          profile_verification_status: data.profile_verification_status || "pending",
          about: data.about || "",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          emergency_contact_address: data.emergency_contact_address || "",
          work_type: data.work_type || "",
          work_place: data.work_place || "",
          languages_known: data.languages_known || [],
          mother_tongue: data.mother_tongue || ""
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set defaults from user data
      setProfile((prev: any) => ({
        ...prev,
        name: user?.name || "",
        full_name: user?.name || ""
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        name: profile.name || profile.full_name,
        phone: profile.phone,
        city: profile.city,
        address: profile.address || profile.current_address,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isOwner = role === 'owner';
  const isCustomer = role === 'customer';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-muted-foreground">Manage your account information</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              {/* Profile Photo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{isOwner ? 'Business Profile' : 'Profile Picture'}</span>
                    <Badge variant={profile.profile_verification_status === 'verified' ? 'default' : 'secondary'}>
                      {profile.profile_verification_status === 'verified' ? (
                        <><Check className="h-3 w-3 mr-1" /> Verified</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> {profile.profile_verification_status}</>
                      )}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url || profile.profile_photo} />
                    <AvatarFallback>
                      {isOwner ? <Building2 className="h-12 w-12" /> : <User className="h-12 w-12" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isOwner ? 'Upload your business logo or photo' : 'Upload a profile picture'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Owner-specific fields */}
              {isOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={profile.display_name}
                          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                          placeholder="Your name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business_name">Business Name</Label>
                        <Input
                          id="business_name"
                          value={profile.business_name}
                          onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                          placeholder="Your PG/Business name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="about">About</Label>
                      <Textarea
                        id="about"
                        value={profile.about}
                        onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                        placeholder="Tell us about your business..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name || profile.name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    {isCustomer && (
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Input
                          id="gender"
                          value={profile.gender}
                          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                          placeholder="Male/Female/Other"
                        />
                      </div>
                    )}

                    {isCustomer && (
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={profile.date_of_birth}
                          onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex gap-2">
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                        {profile.phone_verified ? (
                          <Badge variant="default" className="shrink-0">
                            <Check className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        ) : (
                          <Button variant="outline" size="sm">Verify</Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        placeholder="Enter your city"
                      />
                    </div>
                  </div>

                  {isCustomer && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="current_address">Current Address</Label>
                        <Textarea
                          id="current_address"
                          value={profile.current_address}
                          onChange={(e) => setProfile({ ...profile, current_address: e.target.value })}
                          placeholder="Enter your current address"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="permanent_address">Permanent Address</Label>
                        <Textarea
                          id="permanent_address"
                          value={profile.permanent_address}
                          onChange={(e) => setProfile({ ...profile, permanent_address: e.target.value })}
                          placeholder="Enter your permanent address"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {!isCustomer && (
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Enter your complete address"
                        rows={3}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Contact & Work Details for Customers */}
              {isCustomer && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Emergency Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emergency_contact_name">Parent/Guardian Name</Label>
                          <Input
                            id="emergency_contact_name"
                            value={profile.emergency_contact_name}
                            onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
                            placeholder="Enter parent or guardian name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emergency_contact_phone">Emergency Contact Number</Label>
                          <Input
                            id="emergency_contact_phone"
                            value={profile.emergency_contact_phone}
                            onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })}
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_address">Emergency Contact Address</Label>
                        <Textarea
                          id="emergency_contact_address"
                          value={profile.emergency_contact_address}
                          onChange={(e) => setProfile({ ...profile, emergency_contact_address: e.target.value })}
                          placeholder="Enter emergency contact address"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Work & Language Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="work_type">Type of Work</Label>
                          <Input
                            id="work_type"
                            value={profile.work_type}
                            onChange={(e) => setProfile({ ...profile, work_type: e.target.value })}
                            placeholder="Student/Working Professional/Business"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="work_place">Work Place</Label>
                          <Input
                            id="work_place"
                            value={profile.work_place}
                            onChange={(e) => setProfile({ ...profile, work_place: e.target.value })}
                            placeholder="Company/College name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mother_tongue">Mother Tongue</Label>
                          <Input
                            id="mother_tongue"
                            value={profile.mother_tongue}
                            onChange={(e) => setProfile({ ...profile, mother_tongue: e.target.value })}
                            placeholder="Your native language"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="languages_known">Languages Known</Label>
                          <Input
                            id="languages_known"
                            value={profile.languages_known?.join(', ')}
                            onChange={(e) => setProfile({ ...profile, languages_known: e.target.value.split(',').map(lang => lang.trim()).filter(Boolean) })}
                            placeholder="English, Hindi, Tamil"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Role Badge */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="default" className="text-base px-4 py-2">
                    {role === 'owner' ? 'Property Owner' : role === 'customer' ? 'Tenant' : 'User'}
                  </Badge>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {isCustomer && (
                <Card>
                  <CardHeader>
                    <CardTitle>Identity Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Aadhar Card</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">Front Side</p>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">Back Side</p>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>College/Company ID</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">Upload ID Proof</p>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isCustomer && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Emergency Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Parent/Guardian Name</Label>
                        <Input
                          id="emergency_contact_name"
                          value={profile.emergency_contact_name}
                          onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
                          placeholder="Enter parent or guardian name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Emergency Contact Number</Label>
                        <Input
                          id="emergency_contact_phone"
                          value={profile.emergency_contact_phone}
                          onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_address">Emergency Contact Address</Label>
                        <Textarea
                          id="emergency_contact_address"
                          value={profile.emergency_contact_address}
                          onChange={(e) => setProfile({ ...profile, emergency_contact_address: e.target.value })}
                          placeholder="Enter emergency contact address"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Work & Language Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="work_type">Type of Work</Label>
                        <Input
                          id="work_type"
                          value={profile.work_type}
                          onChange={(e) => setProfile({ ...profile, work_type: e.target.value })}
                          placeholder="Student/Working Professional/Business etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="work_place">Work Place</Label>
                        <Input
                          id="work_place"
                          value={profile.work_place}
                          onChange={(e) => setProfile({ ...profile, work_place: e.target.value })}
                          placeholder="Company/College name and location"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mother_tongue">Mother Tongue</Label>
                        <Input
                          id="mother_tongue"
                          value={profile.mother_tongue}
                          onChange={(e) => setProfile({ ...profile, mother_tongue: e.target.value })}
                          placeholder="Your native language"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="languages_known">Languages Known</Label>
                        <Input
                          id="languages_known"
                          value={profile.languages_known?.join(', ')}
                          onChange={(e) => setProfile({ ...profile, languages_known: e.target.value.split(',').map(lang => lang.trim()).filter(Boolean) })}
                          placeholder="English, Hindi, Tamil (comma separated)"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {isOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle>KYC Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>PAN Card</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">Upload PAN Card</p>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>GST Certificate (Optional)</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">Upload GST Document</p>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Bank Account Details</Label>
                      <Input placeholder="Account Number" />
                      <Input placeholder="IFSC Code" />
                      <Input placeholder="Bank Name" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input id="current_password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input id="new_password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input id="confirm_password" type="password" />
                  </div>
                  <Button>
                    <Lock className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive push notifications</p>
                    </div>
                    <input type="checkbox" />
                  </div>
                </CardContent>
              </Card>

              {isCustomer && (
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Hide Contact Information</p>
                        <p className="text-sm text-muted-foreground">Don't show contact to other tenants</p>
                      </div>
                      <input type="checkbox" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
