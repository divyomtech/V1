import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Payment {
    id: string;
    booking_id: string | null;
    user_id: string;
    user_name: string | null;
    user_email: string | null;
    property_title: string | null;
    amount: number;
    currency: string;
    status: string;
    type: string;
    razorpay_payment_id: string | null;
    created_at: string;
}

interface PaymentStats {
    total_payments: number;
    total_revenue: number;
    pending_payments: number;
    failed_payments: number;
}

const AdminPayments = () => {
    const navigate = useNavigate();
    const { role, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<PaymentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Refund dialog state
    const [refundDialogOpen, setRefundDialogOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refundLoading, setRefundLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && role !== 'admin') {
            navigate('/auth');
        }
    }, [role, authLoading, navigate]);

    useEffect(() => {
        fetchData();
    }, [statusFilter, typeFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status_filter', statusFilter);
            if (typeFilter !== 'all') params.append('type_filter', typeFilter);

            const [paymentsRes, statsRes] = await Promise.all([
                api.request(`/api/admin/payments?${params.toString()}`),
                api.request('/api/admin/payments/stats'),
            ]);

            setPayments(paymentsRes);
            setStats(statsRes);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error loading payments',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!selectedPayment || !refundReason.trim()) {
            toast({
                variant: 'destructive',
                title: 'Missing information',
                description: 'Please provide a reason for the refund',
            });
            return;
        }

        setRefundLoading(true);
        try {
            await api.request(`/api/admin/payments/${selectedPayment.id}/refund`, {
                method: 'POST',
                body: JSON.stringify({
                    reason: refundReason,
                    amount: refundAmount ? parseInt(refundAmount) : null,
                }),
            });

            toast({
                title: 'Refund processed',
                description: `Refund of ₹${refundAmount || selectedPayment.amount} has been initiated`,
            });

            setRefundDialogOpen(false);
            setSelectedPayment(null);
            setRefundAmount('');
            setRefundReason('');
            fetchData();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Refund failed',
                description: error.message,
            });
        } finally {
            setRefundLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            completed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
            refunded: 'bg-blue-100 text-blue-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold">Payments Management</h1>
                    </div>
                    <Button onClick={fetchData} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-8 w-8 text-green-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                                        <p className="text-xl font-bold">₹{stats.total_revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-8 w-8 text-blue-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Payments</p>
                                        <p className="text-xl font-bold">{stats.total_payments}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-8 w-8 text-yellow-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Pending</p>
                                        <p className="text-xl font-bold">{stats.pending_payments}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Failed</p>
                                        <p className="text-xl font-bold">{stats.failed_payments}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="booking">Booking</SelectItem>
                                    <SelectItem value="monthly_rent">Monthly Rent</SelectItem>
                                    <SelectItem value="refund">Refund</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            No payments found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{payment.user_name || 'Unknown'}</p>
                                                    <p className="text-sm text-muted-foreground">{payment.user_email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{payment.property_title || '-'}</TableCell>
                                            <TableCell className={payment.amount < 0 ? 'text-red-600' : ''}>
                                                ₹{Math.abs(payment.amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="capitalize">{payment.type.replace('_', ' ')}</TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                            <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                {payment.status === 'completed' && payment.type !== 'refund' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            setRefundAmount(payment.amount.toString());
                                                            setRefundDialogOpen(true);
                                                        }}
                                                    >
                                                        Refund
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Refund Dialog */}
                <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Process Refund</DialogTitle>
                            <DialogDescription>
                                Refund payment of ₹{selectedPayment?.amount.toLocaleString()} to {selectedPayment?.user_name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">Refund Amount (₹)</label>
                                <Input
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    placeholder="Leave empty for full refund"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Reason *</label>
                                <Textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Enter reason for refund"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleRefund} disabled={refundLoading}>
                                {refundLoading ? 'Processing...' : 'Process Refund'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminPayments;
