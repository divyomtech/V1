import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Property, Room } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Edit, MapPin, IndianRupee, Home, Trash2, Eye, AlertTriangle,
  Bed, Zap, Shield, ChevronDown, ChevronUp, Building2, DoorOpen
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const SHARING_TYPES = ['Single Sharing', 'Double Sharing', 'Triple Sharing', '4-Share', 'Custom'];

const OwnerProperties = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  // Room Management State
  const [propertiesExpanded, setPropertiesExpanded] = useState(true);
  const [roomsExpanded, setRoomsExpanded] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [stayType, setStayType] = useState<'monthly' | 'daily'>('monthly');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedSharing, setSelectedSharing] = useState<string>('Single Sharing');

  // Add/Edit Room Dialog
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [deleteRoomDialogOpen, setDeleteRoomDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({
    floor_number: '',
    room_number: '',
    room_type: 'Single Sharing',
    custom_sharing_name: '',
    bed_count: '',
    monthly_price: '',
    daily_price: '',
    security_deposit: '',
    room_description: '',
    area_sqft: '',
    width_ft: '',
    has_ventilation: true
  });

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const data = await api.getProperties();
      const ownedProperties = data.filter(p => String(p.owner_id) === String(user?.id));
      setProperties(ownedProperties);
      if (ownedProperties.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(ownedProperties[0].id);
      }
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

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      await api.deleteOwnerProperty(propertyToDelete);
      toast({
        title: 'Property Deleted',
        description: 'The property has been removed successfully.',
      });
      setProperties(properties.filter(p => p.id !== propertyToDelete));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete property',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const openDeleteDialog = (propertyId: string) => {
    setPropertyToDelete(propertyId);
    setDeleteDialogOpen(true);
  };

  // Get selected property
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Get available floors
  const getFloors = () => {
    if (!selectedProperty?.rooms) return [1];
    const floors = [...new Set(selectedProperty.rooms.map(r => r.floor_number || 1))];
    return floors.sort((a, b) => a - b);
  };

  // Get rooms filtered by floor and sharing type (NOT by stay_type - that's just pricing)
  const getFilteredRooms = () => {
    if (!selectedProperty?.rooms) return [];
    return selectedProperty.rooms.filter(r =>
      (r.floor_number || 1) === selectedFloor &&
      r.room_type === selectedSharing
    );
  };

  // Handle add room
  const handleAddRoom = async () => {
    if (!selectedPropertyId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a property first' });
      return;
    }

    // Parse values
    const floorNum = parseInt(String(newRoom.floor_number)) || 0;
    const bedNum = parseInt(String(newRoom.bed_count)) || 0;
    const monthlyPrice = parseInt(String(newRoom.monthly_price)) || 0;
    const dailyPrice = parseInt(String(newRoom.daily_price)) || 0;

    // Validation - all fields mandatory except description
    if (floorNum < 1) {
      toast({ variant: 'destructive', title: 'Error', description: 'Floor Number is required' });
      return;
    }
    if (!newRoom.room_number.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Room Number is required' });
      return;
    }
    if (newRoom.room_type === 'Custom' && !newRoom.custom_sharing_name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Custom sharing name is required' });
      return;
    }
    if (newRoom.room_type === 'Custom' && bedNum < 1) {
      toast({ variant: 'destructive', title: 'Error', description: 'Number of beds is required for custom sharing' });
      return;
    }
    if (monthlyPrice <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Monthly Price is required' });
      return;
    }
    if (dailyPrice <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Daily Price is required' });
      return;
    }

    try {
      // Calculate bed_count from room_type
      let bedCount: number;
      let roomTypeName: string;

      if (newRoom.room_type === 'Custom') {
        bedCount = bedNum;
        roomTypeName = newRoom.custom_sharing_name;
      } else {
        const sharingMatch = newRoom.room_type.match(/(\d+)/);
        bedCount = sharingMatch ? parseInt(sharingMatch[1]) :
          newRoom.room_type === 'Single Sharing' ? 1 : 2;
        roomTypeName = newRoom.room_type;
      }

      const roomData = {
        floor_number: floorNum,
        room_number: newRoom.room_number,
        room_type: roomTypeName,
        bed_count: bedCount,
        price: monthlyPrice, // Legacy
        monthly_price: monthlyPrice,
        daily_price: dailyPrice,
        security_deposit: parseInt(String(newRoom.security_deposit)) || 0,
        vacancy_count: bedCount, // All beds start as vacant
        room_description: newRoom.room_description,
        is_available: true,
        area_sqft: parseInt(String(newRoom.area_sqft)) || null,
        width_ft: parseInt(String(newRoom.width_ft)) || null,
        has_ventilation: newRoom.has_ventilation,
      };

      if (editingRoomId) {
        await api.updateRoom(selectedPropertyId, editingRoomId, roomData);
        toast({ title: 'Success', description: 'Room updated successfully' });
      } else {
        await api.createRoom(selectedPropertyId, roomData);
        toast({ title: 'Success', description: 'Room added successfully' });
      }

      setAddRoomOpen(false);
      setEditingRoomId(null);
      fetchProperties();
      // Reset form
      setNewRoom({
        floor_number: '',
        room_number: '',
        room_type: 'Single Sharing',
        custom_sharing_name: '',
        bed_count: '',
        monthly_price: '',
        daily_price: '',
        security_deposit: '',
        room_description: '',
        area_sqft: '',
        width_ft: '',
        has_ventilation: true
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    const isCustom = !['Single Sharing', 'Double Sharing', 'Triple Sharing', '4-Share'].includes(room.room_type);
    setNewRoom({
      floor_number: String(room.floor_number || 1),
      room_number: room.room_number || '',
      room_type: isCustom ? 'Custom' : room.room_type,
      custom_sharing_name: isCustom ? room.room_type : '',
      bed_count: String(room.bed_count || 1),
      monthly_price: String(room.monthly_price || room.price || 0),
      daily_price: String(room.daily_price || 0),
      security_deposit: String(room.security_deposit || 0),
      room_description: room.room_description || '',
      area_sqft: String(room.area_sqft || ''),
      width_ft: String(room.width_ft || ''),
      has_ventilation: room.has_ventilation !== false
    });
    setAddRoomOpen(true);
  };

  const openDeleteRoomDialog = (room: Room) => {
    setRoomToDelete(room);
    setDeleteRoomDialogOpen(true);
  };

  const handleDeleteRoom = async () => {
    if (!selectedPropertyId || !roomToDelete) return;
    try {
      await api.deleteRoom(selectedPropertyId, roomToDelete.id);
      toast({ title: 'Success', description: 'Room deleted successfully' });
      setDeleteRoomDialogOpen(false);
      setRoomToDelete(null);
      fetchProperties();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
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
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">Property & Rooms</h1>
                <p className="text-muted-foreground mt-1">Manage your PG listings and rooms</p>
              </div>
            </div>

            {/* Properties Section */}
            <Card className="mb-6">
              <CardHeader
                className="flex flex-row items-center justify-between py-4"
              >
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                >
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Properties
                    <Badge variant="secondary">{properties.length}</Badge>
                  </CardTitle>
                  {propertiesExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/owner/properties/add')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Property
                </Button>
              </CardHeader>

              {propertiesExpanded && (
                <CardContent>
                  {properties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Home className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
                      <p className="text-muted-foreground mb-4">Start by adding your first property</p>
                      <Button onClick={() => navigate('/owner/properties/add')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Property
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                <Home className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}
                            <Badge
                              className="absolute top-2 right-2"
                              variant={property.status === 'active' ? 'default' : 'secondary'}
                            >
                              {property.status}
                            </Badge>
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold truncate">{property.title}</h3>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {property.locality}, {property.city}
                            </div>
                            {property.rooms && property.rooms.length > 0 && (
                              <div className="flex items-center text-sm font-semibold text-primary mt-1 mb-2">
                                <IndianRupee className="h-3 w-3" />
                                {Math.min(...property.rooms.map(r => r.monthly_price || r.price || 0)).toLocaleString()}
                                <span className="text-xs font-normal text-muted-foreground ml-1">/month</span>
                              </div>
                            )}
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => navigate(`/properties/${property.id}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => navigate(`/owner/properties/edit/${property.id}`)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8"
                                onClick={() => openDeleteDialog(property.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Room Management Section */}
            {properties.length > 0 && (
              <Card>
                <CardHeader
                  className="flex flex-row items-center justify-between py-4"
                >
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setRoomsExpanded(!roomsExpanded)}
                  >
                    <CardTitle className="flex items-center gap-2">
                      <DoorOpen className="h-5 w-5" />
                      Room Management
                    </CardTitle>
                    {roomsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAddRoomOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Room
                  </Button>
                </CardHeader>

                {roomsExpanded && (
                  <CardContent className="space-y-4">
                    {/* Property Selector */}
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="w-64">
                        <Label className="text-xs mb-1 block">Select Property</Label>
                        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                          <SelectContent>
                            {properties.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Stay Type Toggle */}
                      <div>
                        <Label className="text-xs mb-1 block">Booking Type</Label>
                        <div className="flex bg-muted p-1 rounded-lg">
                          <button
                            className={`px-4 py-1.5 rounded-md text-sm transition-all ${stayType === 'monthly' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                            onClick={() => setStayType('monthly')}
                          >
                            Monthly
                          </button>
                          <button
                            className={`px-4 py-1.5 rounded-md text-sm transition-all ${stayType === 'daily' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                            onClick={() => setStayType('daily')}
                          >
                            Daily
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Floor Tabs */}
                    <div>
                      <Label className="text-xs mb-2 block">Floor</Label>
                      <Tabs value={String(selectedFloor)} onValueChange={(v) => setSelectedFloor(Number(v))}>
                        <TabsList>
                          {getFloors().map(floor => (
                            <TabsTrigger key={floor} value={String(floor)}>
                              Floor {floor}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Sharing Type Tabs */}
                    <div>
                      <Label className="text-xs mb-2 block">Sharing Type</Label>
                      <Tabs value={selectedSharing} onValueChange={setSelectedSharing}>
                        <TabsList>
                          {SHARING_TYPES.map(type => (
                            <TabsTrigger key={type} value={type}>
                              {type.replace(' Sharing', '').replace('-Share', '')}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Room Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4">
                      {getFilteredRooms().length === 0 ? (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          <DoorOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No rooms found for this filter</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setAddRoomOpen(true)}
                            className="mt-2"
                          >
                            + Add a room
                          </Button>
                        </div>
                      ) : (
                        getFilteredRooms().map((room) => {
                          const isFull = (room.vacancy_count || 0) === 0;
                          const vacantBeds = room.vacancy_count || 0;

                          return (
                            <Card
                              key={room.id}
                              className={`p-3 relative group ${isFull ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'}`}
                            >
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                                  onClick={() => handleEditRoom(room)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => openDeleteRoomDialog(room)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="font-bold text-lg">{room.room_number || '-'}</div>
                              <div className="text-xs text-muted-foreground">{room.bed_count} Beds</div>
                              <div className={`text-xs font-medium mt-1 flex items-center gap-1 ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                                <span className={`h-2 w-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} />
                                {isFull ? 'Full' : `${vacantBeds} Vacant`}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">Floor {room.floor_number || 1}</div>
                              <div className="text-xs font-medium mt-2">
                                ₹{stayType === 'monthly' ? (room.monthly_price || room.price) : (room.daily_price || room.price)}
                                <span className="text-muted-foreground">/{stayType === 'monthly' ? 'mo' : 'day'}</span>
                              </div>
                            </Card>
                          );
                        })
                      )}
                    </div>

                    {/* Summary Footer */}
                    {selectedProperty && (
                      <div className="flex justify-end gap-6 pt-4 border-t text-sm">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {selectedProperty.rooms?.reduce((sum, r) => sum + (r.bed_count - (r.vacancy_count || 0)), 0) || 0}
                          </span>
                          <span className="text-muted-foreground">Occupied</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {selectedProperty.rooms?.reduce((sum, r) => sum + (r.vacancy_count || 0), 0) || 0}
                          </span>
                          <span className="text-muted-foreground">Vacant</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Room Dialog */}
      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoomId ? 'Edit Room' : 'Add New Room'}</DialogTitle>
            <DialogDescription>
              {editingRoomId ? 'Update details for this room' : `Add a room to ${selectedProperty?.title || 'your property'}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Floor Number <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g., 1"
                  value={newRoom.floor_number}
                  onChange={(e) => setNewRoom({ ...newRoom, floor_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Room Number <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g., 101"
                  required
                  value={newRoom.room_number}
                  onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Sharing Type <span className="text-destructive">*</span></Label>
              <Select
                value={newRoom.room_type}
                onValueChange={(v) => setNewRoom({ ...newRoom, room_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHARING_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Sharing Fields */}
            {newRoom.room_type === 'Custom' && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg border">
                <div>
                  <Label>Custom Sharing Name <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g., 5-Sharing, Dormitory"
                    required
                    value={newRoom.custom_sharing_name}
                    onChange={(e) => setNewRoom({ ...newRoom, custom_sharing_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Number of Beds <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g., 4"
                    value={newRoom.bed_count}
                    onChange={(e) => setNewRoom({ ...newRoom, bed_count: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Price (₹) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g., 5000"
                  value={newRoom.monthly_price || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, monthly_price: e.target.value })}
                />
              </div>
              <div>
                <Label>Daily Price (₹) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g., 300"
                  value={newRoom.daily_price || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, daily_price: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Security Deposit (₹)</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g., 10000"
                value={newRoom.security_deposit || ''}
                onChange={(e) => setNewRoom({ ...newRoom, security_deposit: e.target.value })}
              />
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Room features..."
                value={newRoom.room_description}
                onChange={(e) => setNewRoom({ ...newRoom, room_description: e.target.value })}
              />
            </div>

            {/* Room Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Room Area (sq ft)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 150"
                  value={newRoom.area_sqft || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, area_sqft: e.target.value })}
                />
              </div>
              <div>
                <Label>Room Width (ft)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 12"
                  value={newRoom.width_ft || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, width_ft: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_ventilation"
                checked={newRoom.has_ventilation}
                onCheckedChange={(checked) => setNewRoom({ ...newRoom, has_ventilation: checked === true })}
              />
              <Label htmlFor="has_ventilation" className="cursor-pointer">Has Ventilation (window/exhaust)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddRoomOpen(false);
              setEditingRoomId(null);
            }}>Cancel</Button>
            <Button onClick={handleAddRoom}>{editingRoomId ? 'Update Room' : 'Add Room'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to delete this property? This action cannot be undone.
              All associated data including bookings and reviews will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Room Confirmation Dialog */}
      <AlertDialog open={deleteRoomDialogOpen} onOpenChange={setDeleteRoomDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Room</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to delete room <strong>{roomToDelete?.room_number}</strong>? This action cannot be undone.
              All associated data including historical bookings will be disconnected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              Delete Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OwnerProperties;
