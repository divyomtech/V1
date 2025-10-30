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
  const getStatusVariant = (status: string): "success" | "warning" | "secondary" => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'secondary';
      default: return 'secondary';
    }
  };

  const filterTenantsByStatus = (status: string) => {
    return tenants.filter(t => t.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Tenant Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-success hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active Tenants</p>
                <p className="text-3xl font-bold mt-1">{activeTenants}</p>
              </div>
              <div className="bg-success/10 p-3 rounded-lg">
                <User className="h-8 w-8 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Pending Documents</p>
                <p className="text-3xl font-bold mt-1">{pendingDocuments}</p>
              </div>
              <div className="bg-warning/10 p-3 rounded-lg">
                <FileText className="h-8 w-8 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Payment Pending</p>
                <p className="text-3xl font-bold mt-1">{pendingPayments}</p>
              </div>
              <div className="bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
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
                    <div key={tenant.id} className="group border rounded-xl p-5 hover:shadow-lg hover:border-accent/50 transition-all duration-300 bg-card">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-14 w-14 border-2 border-accent/20 ring-2 ring-transparent group-hover:ring-accent/30 transition-all">
                            <AvatarImage src={tenant.profile_photo} />
                            <AvatarFallback className="bg-accent/10 text-accent font-semibold text-lg">
                              {tenant.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-3 flex-1">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">{tenant.name}</h3>
                                <Badge variant={getStatusVariant(tenant.status)} className="capitalize">
                                  {tenant.status}
                                </Badge>
                                {!tenant.documents_submitted && (
                                  <Badge variant="warning" className="gap-1">
                                    <FileText className="h-3 w-3" />
                                    Docs Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1.5">
                                <Home className="h-3.5 w-3.5" />
                                {tenant.property_title}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                                <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                                <span className="text-foreground truncate">{tenant.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                                <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                                <span className="text-foreground">{tenant.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                                <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                                <span className="text-foreground">
                                  {format(new Date(tenant.check_in_date), 'MMM dd, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm bg-accent/10 p-2 rounded-lg">
                                <span className="font-bold text-accent">₹{tenant.rent_amount.toLocaleString()}</span>
                                <span className="text-muted-foreground">/month</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground hover:border-accent">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-accent/10 hover:text-accent">
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
