import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar, IndianRupee, MapPin, Home, CreditCard, Loader2, CheckCircle, Copy, KeyRound, RefreshCw, LogOut } from 'lucide-react';

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Booking {
  id: string;
  status: string;
  start_date: string;
  amount: number;
  created_at: string;
  property?: {
    title: string;
    city: string;
    locality?: string;
    photos?: string[];
  };
  room?: {
    room_type: string;
    bed_count: number;
  };
}

interface PendingPayment {
  transaction_id: string;
  amount: number;
  owner_name: string;
  property_title: string | null;
  status: string;
  created_at: string;
}

const Bookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  // OTP Dialog State
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [paymentOtp, setPaymentOtp] = useState<{ otp: string; ownerName: string; amount: number; transactionId: string } | null>(null);
  const [otpCopied, setOtpCopied] = useState(false);
  const [regeneratingOtp, setRegeneratingOtp] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [regeneratingTxnId, setRegeneratingTxnId] = useState<string | null>(null);
  const [vacatingBookingId, setVacatingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchPendingPayments();
      loadRazorpayScript();
    }
  }, [user]);

  const fetchPendingPayments = async () => {
    try {
      const payments = await api.getMyPendingPayments();
      setPendingPayments(payments || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // If already loaded
      if (window.Razorpay) {
        setRazorpayReady(true);
        resolve();
        return;
      }

      // If script tag exists, wait for it to load
      const existingScript = document.getElementById('razorpay-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          setRazorpayReady(true);
          resolve();
        });
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayReady(true);
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load payment system'));
      };
      document.head.appendChild(script);
    });
  };

  const fetchBookings = async () => {
    try {
      const data = await api.getBookings();
      setBookings(data || []);
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

  const handlePayment = async (booking: Booking) => {
    // Ensure Razorpay is loaded
    if (!window.Razorpay) {
      try {
        toast({ title: 'Loading payment system...', description: 'Please wait a moment.' });
        await loadRazorpayScript();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load payment system. Check your internet connection.',
        });
        return;
      }
    }

    setPayingBookingId(booking.id);

    try {
      // Step 1: Initiate wallet payment (creates Razorpay order)
      const paymentOrder = await api.initiateWalletPayment(booking.id, booking.amount);

      // Step 2: Open Razorpay checkout
      const options = {
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'He&She PG',
        description: `Payment for ${booking.property?.title || 'Booking'}`,
        order_id: paymentOrder.razorpay_order_id,
        handler: async function (response: any) {
          try {
            // Step 3: Verify payment with backend
            const verifyResult = await api.verifyWalletPayment({
              transaction_id: paymentOrder.transaction_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Show OTP in dialog for customer to share with owner
            if (verifyResult.otp) {
              setPaymentOtp({
                otp: verifyResult.otp,
                ownerName: verifyResult.owner_name || 'Property Owner',
                amount: verifyResult.amount || booking.amount,
                transactionId: verifyResult.transaction_id,
              });
              setOtpDialogOpen(true);
            } else {
              toast({
                title: 'Payment Successful!',
                description: 'Payment completed. The owner will verify to complete the transaction.',
              });
            }

            // Refresh bookings
            fetchBookings();
          } catch (error: any) {
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description: error.message,
            });
          }
        },
        prefill: {
          email: user?.email || '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function () {
            setPayingBookingId(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);

      // Handle payment failure
      razorpay.on('payment.failed', function (response: any) {
        console.error('Razorpay Payment Failed:', response.error);
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: response.error.description || 'Something went wrong with the payment.',
        });
        setPayingBookingId(null);
      });

      razorpay.open();

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
      });
    } finally {
      setPayingBookingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: 'bg-yellow-500',
      accepted: 'bg-blue-500',
      approved: 'bg-green-500',
      paid: 'bg-green-600',
      rejected: 'bg-red-500',
      cancelled: 'bg-gray-500',
    };
    return colors[status] || 'bg-blue-500';
  };

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings;
    if (status === 'pending') return bookings.filter((b) => b.status === 'requested');
    if (status === 'active') return bookings.filter((b) => ['accepted', 'approved', 'paid'].includes(b.status));
    if (status === 'past') return bookings.filter((b) => ['cancelled', 'rejected', 'completed'].includes(b.status));
    return bookings;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

          {/* Pending Payments Section - Show if customer has pending OTP verifications */}
          {pendingPayments.length > 0 && (
            <Card className="mb-8 border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <KeyRound className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                    Pending OTP Verification ({pendingPayments.length})
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Regenerate OTP and share with the property owner to complete your payment.
                </p>
                <div className="space-y-3">
                  {pendingPayments.map((payment) => (
                    <div key={payment.transaction_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-background rounded-lg border">
                      <div>
                        <p className="font-medium">{payment.property_title || 'Property Payment'}</p>
                        <p className="text-sm text-muted-foreground">To: {payment.owner_name} • ₹{payment.amount.toLocaleString()}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-amber-500 text-amber-700 hover:bg-amber-100"
                        disabled={regeneratingTxnId === payment.transaction_id}
                        onClick={async () => {
                          setRegeneratingTxnId(payment.transaction_id);
                          try {
                            const result = await api.resendWalletOTP(payment.transaction_id);
                            if (result.otp) {
                              setPaymentOtp({
                                otp: result.otp,
                                ownerName: result.owner_name || payment.owner_name,
                                amount: result.amount || payment.amount,
                                transactionId: payment.transaction_id,
                              });
                              setOtpDialogOpen(true);
                            }
                          } catch (error: any) {
                            toast({ variant: 'destructive', title: 'Error', description: error.message });
                          } finally {
                            setRegeneratingTxnId(null);
                          }
                        }}
                      >
                        {regeneratingTxnId === payment.transaction_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Get OTP
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>

            {['all', 'pending', 'active', 'past'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                {filterBookings(tab).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Home className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Bookings Found</h3>
                      <p className="text-muted-foreground mb-6">Start searching for your perfect PG</p>
                      <Button onClick={() => navigate('/search')}>
                        Search Properties
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filterBookings(tab).map((booking) => (
                      <Card key={booking.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-48 h-48 md:h-auto relative">
                              {booking.property?.photos && booking.property.photos[0] ? (
                                <img
                                  src={booking.property.photos[0]}
                                  alt={booking.property?.title || 'Property'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Home className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="text-xl font-semibold mb-2">{booking.property?.title || 'Property'}</h3>
                                  <div className="flex items-center text-muted-foreground mb-2">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {booking.property?.locality || 'N/A'}, {booking.property?.city || 'N/A'}
                                  </div>
                                  {booking.room && (
                                    <p className="text-sm text-muted-foreground">
                                      {booking.room.room_type} • {booking.room.bed_count} beds
                                    </p>
                                  )}
                                </div>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <div className="text-sm text-muted-foreground mb-1">Move-in Date</div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(booking.start_date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground mb-1">Amount</div>
                                  <div className="flex items-center font-semibold">
                                    <IndianRupee className="h-4 w-4" />
                                    {booking.amount.toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/bookings/${booking.id}`)}
                                >
                                  View Details
                                </Button>

                                {/* Pay Now Button - Show for accepted bookings */}
                                {booking.status === 'accepted' && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handlePayment(booking)}
                                    disabled={payingBookingId === booking.id}
                                  >
                                    {payingBookingId === booking.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Pay Now
                                      </>
                                    )}
                                  </Button>
                                )}

                                {booking.status === 'requested' && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await api.cancelBooking(booking.id);
                                        toast({
                                          title: 'Booking Cancelled',
                                          description: 'Your booking request has been cancelled.',
                                        });
                                        fetchBookings();
                                      } catch (error: any) {
                                        toast({
                                          variant: 'destructive',
                                          title: 'Error',
                                          description: error.message,
                                        });
                                      }
                                    }}
                                  >
                                    Cancel Request
                                  </Button>
                                )}

                                {/* Vacate PG Button - Show for paid/active bookings */}
                                {['paid', 'active', 'checked-in'].includes(booking.status) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                    disabled={vacatingBookingId === booking.id}
                                    onClick={async () => {
                                      if (!confirm('Are you sure you want to vacate this PG? The owner will be notified about your request.')) {
                                        return;
                                      }
                                      setVacatingBookingId(booking.id);
                                      try {
                                        await api.vacateBooking(booking.id);
                                        toast({
                                          title: 'Vacate Request Sent',
                                          description: 'The property owner has been notified about your vacate request.',
                                        });
                                        fetchBookings();
                                      } catch (error: any) {
                                        toast({
                                          variant: 'destructive',
                                          title: 'Error',
                                          description: error.message,
                                        });
                                      } finally {
                                        setVacatingBookingId(null);
                                      }
                                    }}
                                  >
                                    {vacatingBookingId === booking.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Vacate PG
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* OTP Dialog - Shows after successful payment */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Payment Successful!
            </DialogTitle>
            <DialogDescription className="text-base">
              Your payment of <span className="font-bold text-foreground">₹{paymentOtp?.amount?.toLocaleString()}</span> has been processed.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-amber-800 dark:text-amber-200">Verification OTP</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="text-4xl font-mono font-bold tracking-[0.5em] bg-white dark:bg-background py-3 px-6 rounded-lg border-2 border-dashed border-amber-300">
                  {paymentOtp?.otp}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentOtp?.otp || '');
                    setOtpCopied(true);
                    setTimeout(() => setOtpCopied(false), 2000);
                    toast({ title: 'OTP Copied!', description: 'OTP has been copied to clipboard.' });
                  }}
                >
                  {otpCopied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                <span>Share this OTP with <strong className="text-foreground">{paymentOtp?.ownerName}</strong> (the property owner)</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                <span>The owner will enter this OTP in their dashboard to verify the payment</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                <span>Once verified, the transaction will be completed and your booking confirmed</span>
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={async () => {
                if (!paymentOtp?.transactionId) return;
                setRegeneratingOtp(true);
                try {
                  const result = await api.resendWalletOTP(paymentOtp.transactionId);
                  if (result.otp) {
                    setPaymentOtp({
                      ...paymentOtp,
                      otp: result.otp,
                    });
                    toast({ title: 'New OTP Generated!', description: 'Share this new OTP with the owner.' });
                  }
                } catch (error: any) {
                  toast({ variant: 'destructive', title: 'Error', description: error.message });
                } finally {
                  setRegeneratingOtp(false);
                }
              }}
              disabled={regeneratingOtp}
              className="gap-2"
            >
              {regeneratingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regenerate OTP
            </Button>
            <Button onClick={() => setOtpDialogOpen(false)} className="flex-1">
              Got it, I'll share the OTP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;

