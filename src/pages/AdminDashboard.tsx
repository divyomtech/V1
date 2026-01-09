import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
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
  profiles?: {
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
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, totalProperties: 0 });
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ open: boolean; userId: string; newRole: 'customer' | 'owner' | 'admin'; userName: string } | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    try {
      // Fetch admin stats
      const adminStats = await api.getAdminStats();

      // Fetch owner applications
      const apps = await api.getOwnerApplications();

      // Calculate stats from applications
      const pendingCount = apps.filter((a: any) => a.approval_status === 'pending').length;
      const approvedCount = apps.filter((a: any) => a.approval_status === 'approved').length;
      const rejectedCount = apps.filter((a: any) => a.approval_status === 'rejected').length;

      setStats({
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalProperties: adminStats.total_properties,
      });

      setApplications(apps.map((a: any) => ({
        ...a,
        profiles: {
          name: a.user_name,
          email: a.user_email,
          phone: a.user_phone,
        }
      })));

      // Fetch audit logs for Recent Activity
      try {
        const logs = await api.getAuditLogs(10);
        setAuditLogs(logs);
      } catch (e) {
        console.log('Audit logs not available');
      }

      // Fetch all users for User Management
      try {
        const usersData = await api.getAllUsers();
        setUsers(usersData.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name || 'Unknown',
          phone: u.phone,
          role: u.role || 'customer',
          created_at: u.created_at,
        })));
      } catch (e) {
        console.log('Users list not available');
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin data. Please check if the backend is running.",
      });
    } finally {
      setLoading(false);
      setUsersLoading(false);
      setLogsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRoleChange = async (userId: string, newRole: 'customer' | 'owner' | 'admin') => {
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

    setRoleChangeDialog({
      open: true,
      userId,
      newRole,
      userName: targetUser.name,
    });
  };

  const confirmRoleChange = async () => {
    if (!roleChangeDialog) return;

    try {
      await api.updateUserRole(roleChangeDialog.userId, roleChangeDialog.newRole);
      toast({
        title: 'Success',
        description: `Role updated to ${roleChangeDialog.newRole} for ${roleChangeDialog.userName}`,
      });
      // Refresh users list
      const usersData = await api.getAllUsers();
      setUsers(usersData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update role',
      });
    }
    setRoleChangeDialog(null);
  };

  const handleApproval = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'approved') {
        await api.approveOwnerApplication(applicationId);
      } else {
        await api.rejectOwnerApplication(applicationId);
      }

      toast({
        title: 'Success',
        description: `Application ${status} successfully`,
      });

      // Refresh data
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update application',
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/bookings')}>
              Bookings
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/properties')}>
              Properties
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/settings')}>
              Settings
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin/analytics')}>
              Analytics
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
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

        {/* Recent Activity - Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>System audit logs and recent actions</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : auditLogs.length === 0 ? (
              <Alert>
                <AlertDescription>No recent activity to display.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{log.action}</Badge>
                            <span className="text-sm font-medium">{log.profiles?.name || 'System'}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{log.details}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
