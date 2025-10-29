import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Phone, Mail, Home, Calendar, FileText, MessageSquare, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile_photo: string;
  property_title: string;
  property_id: string;
  booking_id: string;
  check_in_date: string;
  rent_amount: number;
  status: string;
  documents_submitted: boolean;
  last_payment_date?: string;
}

interface TenantManagementProps {
  tenants: Tenant[];
  activeTenants: number;
  pendingDocuments: number;
  pendingPayments: number;
}

const TenantManagement = ({ tenants, activeTenants, pendingDocuments, pendingPayments }: TenantManagementProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterTenantsByStatus = (status: string) => {
    return tenants.filter(t => t.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Tenant Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold">{activeTenants}</p>
              </div>
              <User className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Documents</p>
                <p className="text-2xl font-bold">{pendingDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment Pending</p>
                <p className="text-2xl font-bold">{pendingPayments}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant List */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All ({tenants.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({filterTenantsByStatus('active').length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({filterTenantsByStatus('pending').length})</TabsTrigger>
            </TabsList>
            
            {['all', 'active', 'pending'].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                {(tab === 'all' ? tenants : filterTenantsByStatus(tab)).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No {tab !== 'all' ? tab : ''} tenants found</p>
                  </div>
                ) : (
                  (tab === 'all' ? tenants : filterTenantsByStatus(tab)).map((tenant) => (
                    <div key={tenant.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={tenant.profile_photo} />
                            <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{tenant.name}</h3>
                                <Badge className={getStatusColor(tenant.status)}>
                                  {tenant.status}
                                </Badge>
                                {!tenant.documents_submitted && (
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    Docs Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Home className="h-3 w-3" />
                                {tenant.property_title}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{tenant.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{tenant.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Joined: {format(new Date(tenant.check_in_date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold">₹{tenant.rent_amount.toLocaleString()}/mo</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantManagement;
