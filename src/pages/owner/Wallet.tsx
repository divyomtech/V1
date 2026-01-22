import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wallet, ArrowDownRight, ArrowUpRight, CheckCircle, Clock, AlertCircle, CreditCard, KeyRound, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

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
    transaction_type: string;
    status: string;
    description?: string;
    otp_verified: boolean;
    razorpay_payment_id?: string;
    created_at: string;
}

const OwnerWallet = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [resendingId, setResendingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user || role !== 'owner') {
            navigate('/');
            return;
        }
        fetchWalletData();
    }, [user, role]);

    const fetchWalletData = async () => {
        setLoading(true);

        // Fetch balance - create wallet if doesn't exist
        try {
            const balance = await api.getWalletBalance();
            setWalletBalance(balance);
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            // Set default balance so UI shows the balance card
            setWalletBalance({
                balance: 0,
                pending_balance: 0,
                available_balance: 0,
                currency: 'INR',
                balance_inr: 0,
            });
        }

        // Fetch transactions separately - these should always load
        try {
            const txns = await api.getWalletTransactions(50);
            setTransactions(txns || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setTransactions([]);
        }

        setLoading(false);
    };

    const handleVerifyOTP = async (transactionId: string) => {
        const otp = otpInputs[transactionId];
        if (!otp || otp.length !== 6) {
            toast({
                variant: 'destructive',
                title: 'Invalid OTP',
                description: 'Please enter a valid 6-digit OTP',
            });
            return;
        }

        setVerifyingId(transactionId);
        try {
            const result = await api.verifyWalletOTP(transactionId, otp);
            toast({
                title: 'Payment Verified!',
                description: `₹${result.amount_credited?.toLocaleString() || ''} has been credited to your wallet.`,
            });
            // Clear OTP input and refresh data
            setOtpInputs(prev => ({ ...prev, [transactionId]: '' }));
            fetchWalletData();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: error.message || 'Failed to verify OTP',
            });
        } finally {
            setVerifyingId(null);
        }
    };

    const handleResendOTP = async (transactionId: string) => {
        setResendingId(transactionId);
        try {
            const result = await api.resendWalletOTP(transactionId);
            toast({
                title: 'OTP Sent',
                description: 'A new OTP has been sent to your phone.',
            });
            // Debug OTP is no longer returned in production
            if (result.otp_debug) {
                toast({
                    title: 'Debug Mode',
                    description: `OTP: ${result.otp_debug}`,
                });
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to resend',
                description: error.message || 'Failed to resend OTP',
            });
        } finally {
            setResendingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-500">Completed</Badge>;
            case 'verified':
                return <Badge className="bg-green-500">Verified</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
            case 'otp_sent':
                return <Badge variant="outline" className="text-blue-600 border-blue-600">OTP Sent</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Check if transaction needs OTP verification
    const needsOTPVerification = (txn: WalletTransaction) => {
        return (txn.status === 'pending' || txn.status === 'otp_sent') && !txn.otp_verified;
    };

    // Get pending transactions that need verification
    const pendingVerifications = transactions.filter(needsOTPVerification);

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

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 container py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-primary" />
                        My Wallet
                    </h1>
                    <p className="text-muted-foreground">
                        View your balance, verify payments, and manage transactions
                    </p>
                </div>

                {/* Wallet Balance Card */}
                <Card className="mb-8 bg-gradient-to-br from-primary/10 via-accent/5 to-background border-2 border-primary/20">
                    <CardContent className="p-8">
                        {walletBalance ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                                    <p className="text-5xl font-bold text-primary">₹{walletBalance.balance_inr.toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground mt-2">Ready to withdraw</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                                    <p className="text-3xl font-bold text-yellow-600">₹{(walletBalance.pending_balance / 100).toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground mt-2">Awaiting OTP verification</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                                    <p className="text-3xl font-bold text-blue-600">₹{((walletBalance.balance + walletBalance.pending_balance) / 100).toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground mt-2">Including pending</p>
                                </div>
                                <div className="flex items-center justify-center">
                                    <Button size="lg" className="gap-2">
                                        <ArrowDownRight className="h-5 w-5" />
                                        Withdraw Funds
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No Wallet Found</h3>
                                <p className="text-muted-foreground">
                                    Your wallet will be created automatically when you receive your first payment from a customer.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Verifications Section */}
                {pendingVerifications.length > 0 && (
                    <Card className="mb-8 border-2 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
                                <KeyRound className="h-5 w-5" />
                                Pending Verifications ({pendingVerifications.length})
                            </CardTitle>
                            <CardDescription>
                                Enter the OTP shared by the customer to verify these payments and receive funds in your wallet
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingVerifications.map((txn) => (
                                    <div key={txn.id} className="p-4 bg-background rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-lg">
                                                    Payment of ₹{(txn.amount / 100).toLocaleString()}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {txn.description || 'Booking Payment'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {format(new Date(txn.created_at), 'MMM dd, yyyy • HH:mm')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="text"
                                                    placeholder="Enter 6-digit OTP"
                                                    maxLength={6}
                                                    className="w-40 text-center font-mono text-lg tracking-widest"
                                                    value={otpInputs[txn.id] || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        setOtpInputs(prev => ({ ...prev, [txn.id]: value }));
                                                    }}
                                                />
                                                <Button
                                                    onClick={() => handleVerifyOTP(txn.id)}
                                                    disabled={verifyingId === txn.id || !otpInputs[txn.id] || otpInputs[txn.id].length !== 6}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {verifyingId === txn.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Verify
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleResendOTP(txn.id)}
                                                    disabled={resendingId === txn.id}
                                                    title="Resend OTP"
                                                >
                                                    {resendingId === txn.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Transaction History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowUpRight className="h-5 w-5" />
                            Transaction History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <div className="text-center py-12">
                                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No transactions yet</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Transactions will appear here when customers pay for your properties
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((txn) => (
                                    <div key={txn.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${txn.transaction_type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {txn.transaction_type === 'credit' ? (
                                                    <ArrowDownRight className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{txn.description || 'Wallet Transaction'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm text-muted-foreground">
                                                        {format(new Date(txn.created_at), 'MMM dd, yyyy • HH:mm')}
                                                    </span>
                                                    {txn.otp_verified && (
                                                        <Badge variant="outline" className="text-xs text-green-600">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Verified
                                                        </Badge>
                                                    )}
                                                </div>
                                                {txn.razorpay_payment_id && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Payment ID: {txn.razorpay_payment_id}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-xl ${txn.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {txn.transaction_type === 'credit' ? '+' : '-'}₹{(txn.amount / 100).toLocaleString()}
                                            </p>
                                            <div className="mt-1">
                                                {getStatusBadge(txn.status)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
};

export default OwnerWallet;
