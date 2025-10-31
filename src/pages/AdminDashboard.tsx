import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, Shield, Users, Home, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const AdminDashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, totalProperties: 0 });

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchApplications();
    fetchStats();
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
      </div>
    </div>
  );
};

export default AdminDashboard;
