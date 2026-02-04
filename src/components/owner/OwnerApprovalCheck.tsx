import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Loader2 } from "lucide-react";

interface OwnerApprovalCheckProps {
    children: React.ReactNode;
}

const OwnerApprovalCheck = ({ children }: OwnerApprovalCheckProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [approvalStatus, setApprovalStatus] = useState<string | null>(null);

    useEffect(() => {
        const checkApprovalStatus = async () => {
            if (!user) {
                navigate('/auth');
                return;
            }

            try {
                const profile = await api.getProfile();
                setApprovalStatus(profile?.approval_status || null);
            } catch (error) {
                console.error('Error fetching approval status:', error);
                setApprovalStatus(null);
            } finally {
                setLoading(false);
            }
        };

        checkApprovalStatus();
    }, [user, navigate]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Block access for pending or rejected owners
    if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container py-16">
                    <div className="max-w-2xl mx-auto">
                        <Card className={`border-2 ${approvalStatus === 'pending' ? 'border-orange-300 bg-orange-50 dark:bg-orange-950' : 'border-red-300 bg-red-50 dark:bg-red-950'}`}>
                            <CardContent className="pt-8 pb-8">
                                <div className="text-center">
                                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${approvalStatus === 'pending' ? 'bg-orange-100 dark:bg-orange-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                        <UserCheck className={`h-10 w-10 ${approvalStatus === 'pending' ? 'text-orange-600' : 'text-red-600'}`} />
                                    </div>

                                    {approvalStatus === 'pending' ? (
                                        <>
                                            <h1 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-3">
                                                ⏳ Owner Approval Pending
                                            </h1>
                                            <p className="text-orange-700 dark:text-orange-300 mb-6 max-w-md mx-auto">
                                                Your registration request is under review. Admin needs to approve your account before you can access the owner dashboard and add properties.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h1 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-3">
                                                ❌ Owner Application Rejected
                                            </h1>
                                            <p className="text-red-700 dark:text-red-300 mb-6 max-w-md mx-auto">
                                                Unfortunately, your owner application was not approved. Please contact admin for more information or to reapply.
                                            </p>
                                        </>
                                    )}

                                    <div className="p-4 bg-white/60 dark:bg-black/20 rounded-lg inline-block">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📞 Need help? Contact Admin:</p>
                                        <a href="tel:6303348984" className="text-2xl font-bold text-primary hover:underline">
                                            6303348984
                                        </a>
                                    </div>

                                    <div className="mt-8 flex justify-center gap-4">
                                        <Button variant="outline" onClick={() => navigate('/')}>
                                            Go to Home
                                        </Button>
                                        <Button onClick={() => window.location.reload()}>
                                            Check Status Again
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Owner is approved - render children
    return <>{children}</>;
};

export default OwnerApprovalCheck;
