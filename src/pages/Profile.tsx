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
import { User, Mail, Phone, MapPin, Building2, Save, Upload, Check, X, FileText, CreditCard, Shield, Bell, Lock, Eye, EyeOff, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  // Privacy settings state
  const [hideContactInfo, setHideContactInfo] = useState(false);

  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    dl_front_url: "",
    dl_back_url: "",
    gst_doc_url: "",
    profile_verification_status: "pending",
    about: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_address: "",
    work_type: "",
    work_place: "",
    languages_known: [],
    mother_tongue: "",
    bank_account_number: "",
    bank_ifsc_code: "",
    bank_name: "",
    // Owner availability
    owner_available: true,
    available_from: "09:00",
    available_to: "21:00",
    available_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  });

  // Track original phone number to detect changes
  const [originalPhone, setOriginalPhone] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Helper to get full image URL
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

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
          dl_front_url: data.dl_front_url || "",
          dl_back_url: data.dl_back_url || "",
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
          mother_tongue: data.mother_tongue || "",
          bank_account_number: data.bank_account_number || "",
          bank_ifsc_code: data.bank_ifsc_code || "",
          bank_name: data.bank_name || "",
          // Owner availability
          owner_available: data.owner_available !== false,
          available_from: data.available_from || "09:00",
          available_to: data.available_to || "21:00",
          available_days: data.available_days || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        });

        // Load notification settings from API
        setEmailNotifications(data.email_notifications !== false);
        setSmsNotifications(data.sms_notifications !== false);
        setPushNotifications(data.push_notifications === true);

        // Load privacy settings from API
        setHideContactInfo(data.hide_contact_info === true);

        // Store original phone number to detect changes
        setOriginalPhone(data.phone || "");
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
    // Check if phone number was changed but not verified
    const phoneChanged = profile.phone !== originalPhone && profile.phone.length >= 10;
    if (phoneChanged) {
      toast({
        variant: "destructive",
        title: "Phone Verification Required",
        description: "Please verify your new phone number before saving. Click the Verify button next to your phone number.",
      });
      return;
    }

    setSaving(true);
    try {
      // Build update data with all fields
      const updateData: any = {
        name: profile.name || profile.full_name,
        phone: profile.phone,
        city: profile.city,
        address: profile.address,
        current_address: profile.current_address,
        permanent_address: profile.permanent_address,
        profile_photo: profile.profile_photo,

        // Document URLs (saved for both roles)
        pan_card_url: profile.pan_card_url,
        gst_doc_url: profile.gst_doc_url,
        aadhar_front_url: profile.aadhar_front_url,
        aadhar_back_url: profile.aadhar_back_url,
        dl_front_url: profile.dl_front_url,
        dl_back_url: profile.dl_back_url,
        college_company_id_url: profile.college_company_id_url,

        // Notification settings
        email_notifications: emailNotifications,
        sms_notifications: smsNotifications,
        push_notifications: pushNotifications,

        // Privacy settings
        hide_contact_info: hideContactInfo,
      };

      // Add owner-specific fields
      if (role === 'owner') {
        updateData.display_name = profile.display_name;
        updateData.business_name = profile.business_name;
        updateData.about = profile.about;
        updateData.languages_known = profile.languages_known;
        updateData.bank_account_number = profile.bank_account_number;
        updateData.bank_ifsc_code = profile.bank_ifsc_code;
        updateData.bank_name = profile.bank_name;
        // Owner availability
        updateData.owner_available = profile.owner_available;
        updateData.available_from = profile.available_from;
        updateData.available_to = profile.available_to;
        updateData.available_days = profile.available_days;
      }

      // Add customer-specific fields
      if (role === 'customer') {
        updateData.gender = profile.gender;
        updateData.date_of_birth = profile.date_of_birth;
        updateData.work_type = profile.work_type;
        updateData.work_place = profile.work_place;
        updateData.mother_tongue = profile.mother_tongue;
        updateData.languages_known = profile.languages_known;
        updateData.emergency_contact_name = profile.emergency_contact_name;
        updateData.emergency_contact_phone = profile.emergency_contact_phone;
        updateData.emergency_contact_address = profile.emergency_contact_address;
      }

      const response = await api.updateProfile(updateData);

      // Show profile update success
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });

      // Auto-refresh profile to update verification status
      await fetchProfile();

      // Handle notification status feedback
      const notificationStatus = response?.notification_status;
      if (notificationStatus) {
        // Email notification feedback
        if (notificationStatus.email_confirmation_sent === true) {
          toast({
            title: "📧 Email Confirmation Sent",
            description: "We've sent a confirmation email to verify your email notifications.",
          });
        } else if (notificationStatus.email_confirmation_sent === false && notificationStatus.email_confirmation_error) {
          toast({
            variant: "destructive",
            title: "Email Confirmation Failed",
            description: notificationStatus.email_confirmation_error,
          });
        } else if (notificationStatus.email_already_confirmed) {
          toast({
            title: "Email Already Confirmed",
            description: "Email notifications were already confirmed recently.",
          });
        }

        // SMS notification feedback
        if (notificationStatus.sms_confirmation_sent === true) {
          toast({
            title: "📱 SMS Confirmation Sent",
            description: "We've sent a confirmation SMS to your phone number.",
          });
        } else if (notificationStatus.sms_confirmation_sent === false && notificationStatus.sms_confirmation_error) {
          toast({
            variant: "destructive",
            title: "SMS Confirmation Failed",
            description: notificationStatus.sms_confirmation_error,
          });
        } else if (notificationStatus.sms_already_confirmed) {
          toast({
            title: "SMS Already Confirmed",
            description: "SMS notifications were already confirmed recently.",
          });
        }
      }
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


  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all password fields",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "New password must be at least 8 characters",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirm password must match",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed",
      });
      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password change failed",
        description: error.message || "Failed to change password",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select an image file",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be less than 5MB",
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = await api.uploadDocument(file, 'profile_photo');
      setProfile({ ...profile, profile_photo: result.url, avatar_url: result.url });

      // Also update the profile in the database
      await api.updateProfile({ profile_photo: result.url });

      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload photo",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select an image (JPG, PNG, WebP) or PDF file",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File must be less than 5MB",
      });
      return;
    }

    setUploadingDoc(docType);
    try {
      const result = await api.uploadDocument(file, docType);
      setProfile({ ...profile, [fieldName]: result.url });

      toast({
        title: "Document uploaded",
        description: `${docType.replace(/_/g, ' ')} has been uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload document",
      });
    } finally {
      setUploadingDoc(null);
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
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
                    <AvatarImage src={getImageUrl(profile.avatar_url || profile.profile_photo)} />
                    <AvatarFallback>
                      {isOwner ? <Building2 className="h-12 w-12" /> : <User className="h-12 w-12" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <Button
                      variant="outline"
                      disabled={uploadingPhoto}
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
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

                    <div className="space-y-2">
                      <Label htmlFor="languages_known">Languages Spoken</Label>
                      <Input
                        id="languages_known"
                        value={profile.languages_known?.join(', ')}
                        onChange={(e) => setProfile({ ...profile, languages_known: e.target.value.split(',').map(lang => lang.trim()).filter(Boolean) })}
                        placeholder="English, Hindi, Telugu, Tamil..."
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter languages separated by commas. These will be displayed on your property listings.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Owner Availability Settings */}
              {isOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle>Availability Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Currently Available</Label>
                        <p className="text-sm text-muted-foreground">
                          Toggle to show tenants if you're available for contact
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="owner_available"
                          checked={profile.owner_available}
                          onChange={(e) => setProfile({ ...profile, owner_available: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="owner_available" className={profile.owner_available ? "text-green-600" : "text-red-500"}>
                          {profile.owner_available ? "Available" : "Not Available"}
                        </Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="available_from">Available From</Label>
                        <Input
                          id="available_from"
                          type="time"
                          value={profile.available_from}
                          onChange={(e) => setProfile({ ...profile, available_from: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="available_to">Available To</Label>
                        <Input
                          id="available_to"
                          type="time"
                          value={profile.available_to}
                          onChange={(e) => setProfile({ ...profile, available_to: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Available Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                          <Badge
                            key={day}
                            variant={profile.available_days?.includes(day) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const days = profile.available_days || [];
                              if (days.includes(day)) {
                                setProfile({ ...profile, available_days: days.filter((d: string) => d !== day) });
                              } else {
                                setProfile({ ...profile, available_days: [...days, day] });
                              }
                            }}
                          >
                            {day}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Click days to select/deselect. This will be shown to tenants on your host profile.
                      </p>
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
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!profile.phone || profile.phone.length < 10}
                            onClick={() => {
                              if (!profile.phone || profile.phone.length < 10) {
                                toast({
                                  variant: "destructive",
                                  title: "Invalid phone number",
                                  description: "Please enter a valid phone number first.",
                                });
                                return;
                              }
                              toast({
                                title: "Phone Verification",
                                description: "Phone number verification via OTP is coming soon. For now, please save your profile and your phone number will be verified by admin.",
                              });
                            }}
                          >
                            Verify
                          </Button>
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
                          {profile.aadhar_front_url ? (
                            <div className="space-y-2">
                              <Check className="h-8 w-8 mx-auto text-green-500" />
                              <p className="text-sm text-green-600">Front Side uploaded</p>
                              <a href={getImageUrl(profile.aadhar_front_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View</a>
                            </div>
                          ) : (
                            <>
                              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-2">Front Side</p>
                            </>
                          )}
                          <input
                            type="file"
                            id="aadhar-front-upload"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleDocumentUpload(e, 'aadhar_front', 'aadhar_front_url')}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadingDoc === 'aadhar_front'}
                            onClick={() => document.getElementById('aadhar-front-upload')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingDoc === 'aadhar_front' ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {profile.aadhar_back_url ? (
                            <div className="space-y-2">
                              <Check className="h-8 w-8 mx-auto text-green-500" />
                              <p className="text-sm text-green-600">Back Side uploaded</p>
                              <a href={getImageUrl(profile.aadhar_back_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View</a>
                            </div>
                          ) : (
                            <>
                              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-2">Back Side</p>
                            </>
                          )}
                          <input
                            type="file"
                            id="aadhar-back-upload"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleDocumentUpload(e, 'aadhar_back', 'aadhar_back_url')}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadingDoc === 'aadhar_back'}
                            onClick={() => document.getElementById('aadhar-back-upload')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingDoc === 'aadhar_back' ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>PAN Card</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        {profile.pan_card_url ? (
                          <div className="space-y-2">
                            <Check className="h-8 w-8 mx-auto text-green-500" />
                            <p className="text-sm text-green-600">PAN Card uploaded</p>
                            <a href={getImageUrl(profile.pan_card_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View</a>
                          </div>
                        ) : (
                          <>
                            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">Upload PAN Card</p>
                          </>
                        )}
                        <input
                          type="file"
                          id="pan-card-upload"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'pan_card', 'pan_card_url')}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={uploadingDoc === 'pan_card'}
                          onClick={() => document.getElementById('pan-card-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingDoc === 'pan_card' ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Driving License</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {profile.dl_front_url ? (
                            <div className="space-y-2">
                              <Check className="h-8 w-8 mx-auto text-green-500" />
                              <p className="text-sm text-green-600">Front Side uploaded</p>
                              <a href={getImageUrl(profile.dl_front_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View</a>
                            </div>
                          ) : (
                            <>
                              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-2">Front Side</p>
                            </>
                          )}
                          <input
                            type="file"
                            id="dl-front-upload"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleDocumentUpload(e, 'dl_front', 'dl_front_url')}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadingDoc === 'dl_front'}
                            onClick={() => document.getElementById('dl-front-upload')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingDoc === 'dl_front' ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {profile.dl_back_url ? (
                            <div className="space-y-2">
                              <Check className="h-8 w-8 mx-auto text-green-500" />
                              <p className="text-sm text-green-600">Back Side uploaded</p>
                              <a href={getImageUrl(profile.dl_back_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View</a>
                            </div>
                          ) : (
                            <>
                              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mb-2">Back Side</p>
                            </>
                          )}
                          <input
                            type="file"
                            id="dl-back-upload"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleDocumentUpload(e, 'dl_back', 'dl_back_url')}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadingDoc === 'dl_back'}
                            onClick={() => document.getElementById('dl-back-upload')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingDoc === 'dl_back' ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>College/Company ID</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        {profile.college_company_id_url ? (
                          <div className="space-y-2">
                            <Check className="h-8 w-8 mx-auto text-green-500" />
                            <p className="text-sm text-green-600">ID Proof uploaded</p>
                            <a href={getImageUrl(profile.college_company_id_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View</a>
                          </div>
                        ) : (
                          <>
                            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">Upload ID Proof</p>
                          </>
                        )}
                        <input
                          type="file"
                          id="college-id-upload"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'college_company_id', 'college_company_id_url')}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={uploadingDoc === 'college_company_id'}
                          onClick={() => document.getElementById('college-id-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingDoc === 'college_company_id' ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                        {profile.pan_card_url ? (
                          <div className="space-y-2">
                            <Check className="h-8 w-8 mx-auto text-green-500" />
                            <p className="text-sm text-green-600">PAN Card uploaded</p>
                            <a href={getImageUrl(profile.pan_card_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View Document</a>
                          </div>
                        ) : (
                          <>
                            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">Upload PAN Card</p>
                          </>
                        )}
                        <input
                          type="file"
                          id="pan-upload"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'pan_card', 'pan_card_url')}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={uploadingDoc === 'pan_card'}
                          onClick={() => document.getElementById('pan-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingDoc === 'pan_card' ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>GST Certificate (Optional)</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        {profile.gst_doc_url ? (
                          <div className="space-y-2">
                            <Check className="h-8 w-8 mx-auto text-green-500" />
                            <p className="text-sm text-green-600">GST Certificate uploaded</p>
                            <a href={getImageUrl(profile.gst_doc_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">View Document</a>
                          </div>
                        ) : (
                          <>
                            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">Upload GST Document</p>
                          </>
                        )}
                        <input
                          type="file"
                          id="gst-upload"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'gst_doc', 'gst_doc_url')}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={uploadingDoc === 'gst_doc'}
                          onClick={() => document.getElementById('gst-upload')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingDoc === 'gst_doc' ? 'Uploading...' : 'Upload'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Bank Account Details</Label>
                      <Input
                        placeholder="Account Number"
                        value={profile.bank_account_number}
                        onChange={(e) => setProfile({ ...profile, bank_account_number: e.target.value })}
                      />
                      <Input
                        placeholder="IFSC Code"
                        value={profile.bank_ifsc_code}
                        onChange={(e) => setProfile({ ...profile, bank_ifsc_code: e.target.value })}
                      />
                      <Input
                        placeholder="Bank Name"
                        value={profile.bank_name}
                        onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
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
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="h-5 w-5 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      className="h-5 w-5 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive push notifications</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="h-5 w-5 cursor-pointer"
                    />
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
                      <input
                        type="checkbox"
                        checked={hideContactInfo}
                        onChange={(e) => setHideContactInfo(e.target.checked)}
                        className="h-5 w-5 cursor-pointer"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Change Password Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 8 characters)"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleChangePassword} disabled={changingPassword}>
                    <Lock className="h-4 w-4 mr-2" />
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
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
