import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Clock, CheckCircle, AlertCircle, TrendingUp, Download, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";

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

interface WalletBalance {
  balance: number;
  pending_balance: number;
  available_balance: number;
  currency: string;
  balance_inr: number;
}

interface WalletTransaction {
  id: string;
  amount: number;
  amount_inr: number;
  transaction_type: string;
  status: string;
  payer_name?: string;
  receiver_name?: string;
  description?: string;
  otp_verified: boolean;
  created_at: string;
}

interface FinancialTrackingProps {
  payments: Payment[];
  pendingAmount: number;
  receivedAmount: number;
  upcomingAmount: number;
}

const FinancialTracking = ({ payments, pendingAmount, receivedAmount, upcomingAmount }: FinancialTrackingProps) => {
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balance, transactions] = await Promise.all([
        api.getWalletBalance(),
        api.getWalletTransactions(20)
      ]);
      setWalletBalance(balance);
      setWalletTransactions(transactions);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoadingWallet(false);
    }
  };

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
      failed: 'destructive',
      verified: 'default',
      otp_sent: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  const filterPaymentsByStatus = (status: string) => {
    return payments.filter(p => p.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            My Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWallet ? (
            <div className="animate-pulse">
              <div className="h-10 bg-muted rounded w-40 mb-2"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          ) : walletBalance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-4xl font-bold text-primary">₹{walletBalance.balance_inr.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Withdrawable amount</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">₹{(walletBalance.pending_balance / 100).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting OTP verification</p>
              </div>
              <div className="flex items-center justify-center">
                <Button variant="outline" className="gap-2">
                  <ArrowDownRight className="h-4 w-4" />
                  Withdraw Funds
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No wallet found</p>
          )}
        </CardContent>
      </Card>

      {/* Wallet Transactions */}
      {walletTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Recent Wallet Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {walletTransactions.slice(0, 5).map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {txn.transaction_type === 'credit' ? (
                      <ArrowDownRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{txn.payer_name || 'Payment'}</p>
                      <p className="text-sm text-muted-foreground">{txn.description || 'Wallet transaction'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(txn.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {txn.otp_verified && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${txn.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.transaction_type === 'credit' ? '+' : '-'}₹{txn.amount_inr.toLocaleString()}
                    </p>
                    <Badge variant={getStatusBadge(txn.status)}>
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

