import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, TrendingUp, Clock, Home, Users, Loader2 } from 'lucide-react';

interface Payment {
    id: string;
    booking_id: string;
    amount: number;
    payment_type: string;
    status: string;
    payment_date: string | null;
    created_at: string;
    tenant_name: string | null;
    property_title: string | null;
}

interface Invoice {
    id: string;
    booking_id: string;
    amount: number;
    due_date: string | null;
    status: string;
    created_at: string;
    tenant_name: string | null;
    property_title: string | null;
}

interface FinancialSummary {
    total_revenue: number;
    pending_payments: number;
    total_properties: number;
    total_tenants: number;
    monthly_revenue: number;
}

const Finances = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || role !== 'owner') {
            navigate('/');
            return;
        }
        fetchFinancialData();
    }, [user, role]);

    const fetchFinancialData = async () => {
        try {
            const [summaryData, paymentsData, invoicesData] = await Promise.all([
                api.getOwnerFinancialSummary(),
                api.getOwnerPayments(),
                api.getOwnerInvoices(),
            ]);
            setSummary(summaryData);
            setPayments(paymentsData);
            setInvoices(invoicesData);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load financial data",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-500">Completed</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Financial Tracking</h1>
                    <p className="text-muted-foreground">
                        Track your revenue, payments, and invoices
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <IndianRupee className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">₹{(summary?.total_revenue || 0).toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <TrendingUp className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">₹{(summary?.monthly_revenue || 0).toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">₹{(summary?.pending_payments || 0).toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">Pending Payments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Users className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{summary?.total_tenants || 0}</p>
                                    <p className="text-sm text-muted-foreground">Active Tenants</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payments & Invoices Tabs */}
                <Tabs defaultValue="payments">
                    <TabsList className="mb-4">
                        <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
                        <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="payments">
                        {payments.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No payments recorded yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {payments.map((payment) => (
                                    <Card key={payment.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold">{payment.tenant_name || 'Tenant'}</p>
                                                    <p className="text-sm text-muted-foreground">{payment.property_title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(payment.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold">₹{payment.amount.toLocaleString()}</p>
                                                    <p className="text-sm text-muted-foreground capitalize">{payment.payment_type}</p>
                                                    {getStatusBadge(payment.status)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="invoices">
                        {invoices.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <IndianRupee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No invoices generated yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {invoices.map((invoice) => (
                                    <Card key={invoice.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold">{invoice.tenant_name || 'Tenant'}</p>
                                                    <p className="text-sm text-muted-foreground">{invoice.property_title}</p>
                                                    {invoice.due_date && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold">₹{invoice.amount.toLocaleString()}</p>
                                                    {getStatusBadge(invoice.status)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Finances;
