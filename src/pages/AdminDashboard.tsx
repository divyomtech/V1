import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, Shield, Users, Home, FileText, UserCog } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OwnerApplication {
  id: string;
  user_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  id_proof_url: string | null;
  property_documents: string[] | null;
  admin_notes: string | null;
  created_at: string;
  profiles: {
    name: string;
    email?: string;
    phone?: string;
  };
}

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'owner' | 'admin';
  created_at: string;
}

const AdminDashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, totalProperties: 0 });
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ open: boolean; userId: string; newRole: 'customer' | 'owner' | 'admin'; userName: string } | null>(null);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchApplications();
    fetchStats();
    fetchUsers();
  }, [role, navigate]);

  const fetchApplications = async () => {
    try {
      const { data: ownersData, error } = await supabase
        .from('owners_profile')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data separately for each owner
      const applicationsWithProfiles = await Promise.all(
        (ownersData || []).map(async (owner) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, phone')
            .eq('id', owner.user_id)
            .single();

          return {
            ...owner,
            profiles: profile || { name: 'Unknown', phone: 'N/A' }
          };
        })
      );

      setApplications(applicationsWithProfiles as any);
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

  const fetchStats = async () => {
    try {
      const [ownersRes, propertiesRes] = await Promise.all([
        supabase.from('owners_profile').select('approval_status'),
        supabase.from('properties').select('id'),
      ]);

      const pending = ownersRes.data?.filter(o => o.approval_status === 'pending').length || 0;
      const approved = ownersRes.data?.filter(o => o.approval_status === 'approved').length || 0;
      const rejected = ownersRes.data?.filter(o => o.approval_status === 'rejected').length || 0;

      setStats({
        pending,
        approved,
        rejected,
        totalProperties: propertiesRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // Fetch all profiles with email
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();

          return {
            id: profile.id,
            name: profile.name || 'Unknown',
            phone: profile.phone || 'N/A',
            email: profile.email || 'N/A',
            role: (roleData?.role || 'customer') as 'customer' | 'owner' | 'admin',
            created_at: profile.created_at || new Date().toISOString(),
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching users',
        description: error.message,
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'customer' | 'owner' | 'admin') => {
    // Prevent admins from changing their own role
    if (userId === user?.id) {
      toast({
        variant: 'destructive',
        title: 'Action Not Allowed',
        description: 'You cannot change your own role for security reasons.',
      });
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    // Show confirmation dialog
    setRoleChangeDialog({
      open: true,
      userId,
      newRole,
      userName: targetUser.name,
    });
  };

  const confirmRoleChange = async () => {
    if (!roleChangeDialog) return;

    const { userId, newRole, userName } = roleChangeDialog;

    try {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      // Insert audit log
      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        action: 'role_change',
        details: `Changed ${userName}'s role to ${newRole}`,
        ip_address: 'system',
      });

      toast({
        title: 'Role updated',
        description: `${userName}'s role has been changed to ${newRole}.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setRoleChangeDialog(null);
    }
  };

  const handleApproval = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('owners_profile')
        .update({ approval_status: status })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: status === 'approved' ? 'Owner Approved' : 'Owner Rejected',
        description: `The owner application has been ${status}.`,
      });

      fetchApplications();
      fetchStats();
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingApplications = applications.filter(a => a.approval_status === 'pending');
  const approvedApplications = applications.filter(a => a.approval_status === 'approved');
  const rejectedApplications = applications.filter(a => a.approval_status === 'rejected');

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage owner applications and platform settings</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Owners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{stats.rejected}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalProperties}</div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{user.name}</span>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <p>Email: {user.email}</p>
                            <p>Phone: {user.phone}</p>
                          </div>
                        </div>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as any)}
                          disabled={user.id === user?.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Owner Applications</CardTitle>
            <CardDescription>Review and approve owner registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Pending ({pendingApplications.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({approvedApplications.length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({rejectedApplications.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-4">
                {pendingApplications.length === 0 ? (
                  <Alert>
                    <AlertDescription>No pending applications at the moment.</AlertDescription>
                  </Alert>
                ) : (
                  pendingApplications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{app.profiles?.name || 'Unknown'}</span>
                              <Badge variant="secondary">{app.approval_status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Phone: {app.profiles?.phone || 'N/A'}</p>
                              <p>Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                              {app.id_proof_url && (
                                <a 
                                  href={app.id_proof_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  View ID Proof
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproval(app.id, 'approved')}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(app.id, 'rejected')}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4 mt-4">
                {approvedApplications.length === 0 ? (
                  <Alert>
                    <AlertDescription>No approved applications yet.</AlertDescription>
                  </Alert>
                ) : (
                  approvedApplications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{app.profiles?.name || 'Unknown'}</span>
                              <Badge className="bg-green-500">{app.approval_status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Phone: {app.profiles?.phone || 'N/A'}</p>
                              <p>Approved: {new Date(app.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproval(app.id, 'rejected')}
                          >
                            Revoke
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4 mt-4">
                {rejectedApplications.length === 0 ? (
                  <Alert>
                    <AlertDescription>No rejected applications.</AlertDescription>
                  </Alert>
                ) : (
                  rejectedApplications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{app.profiles?.name || 'Unknown'}</span>
                              <Badge variant="destructive">{app.approval_status}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Phone: {app.profiles?.phone || 'N/A'}</p>
                              <p>Rejected: {new Date(app.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproval(app.id, 'approved')}
                          >
                            Re-approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Role Change Confirmation Dialog */}
        <AlertDialog open={roleChangeDialog?.open || false} onOpenChange={(open) => !open && setRoleChangeDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to change <strong>{roleChangeDialog?.userName}</strong>'s role to <strong>{roleChangeDialog?.newRole}</strong>?
                <br /><br />
                This action will immediately affect their access permissions and will be logged in the audit trail.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRoleChange}>Confirm Change</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
