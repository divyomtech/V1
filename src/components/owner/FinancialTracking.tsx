import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Clock, CheckCircle, AlertCircle, DollarSign, TrendingUp, Download } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
  property_title?: string;
  tenant_name?: string;
}

interface FinancialTrackingProps {
  payments: Payment[];
  pendingAmount: number;
  receivedAmount: number;
  upcomingAmount: number;
}

const FinancialTracking = ({ payments, pendingAmount, receivedAmount, upcomingAmount }: FinancialTrackingProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive'
    };
    return variants[status] || 'secondary';
  };

  const filterPaymentsByStatus = (status: string) => {
    return payments.filter(p => p.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Received</p>
                <p className="text-2xl font-bold text-green-600">₹{receivedAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">₹{upcomingAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment Transactions</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({payments.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({filterPaymentsByStatus('completed').length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({filterPaymentsByStatus('pending').length})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({filterPaymentsByStatus('failed').length})</TabsTrigger>
            </TabsList>
            
            {['all', 'completed', 'pending', 'failed'].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                {(tab === 'all' ? payments : filterPaymentsByStatus(tab)).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No {tab !== 'all' ? tab : ''} payments found</p>
                  </div>
                ) : (
                  (tab === 'all' ? payments : filterPaymentsByStatus(tab)).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <p className="font-medium">{payment.property_title || 'Property Payment'}</p>
                          <p className="text-sm text-muted-foreground">{payment.tenant_name || 'Tenant'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(payment.created_at), 'MMM dd, yyyy')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {payment.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                        <Badge variant={getStatusBadge(payment.status)}>
                          {payment.status}
                        </Badge>
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

export default FinancialTracking;
