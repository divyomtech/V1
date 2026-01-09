import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Settings, Save, Percent, IndianRupee } from 'lucide-react';

interface SystemSetting {
    id: string;
    key: string;
    value: string;
    description: string;
    updated_at: string;
}

const AdminSettings = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [settings, setSettings] = useState<Record<string, string>>({
        commission_percentage: '10',
        minimum_booking_days: '30',
        cancellation_policy_hours: '24',
        platform_fee: '100',
        referral_reward: '500',
        max_properties_per_owner: '10',
    });

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/');
            return;
        }
        fetchSettings();
    }, [role, navigate]);

    const fetchSettings = async () => {
        try {
            const data = await api.getSystemSettings();
            const settingsMap: Record<string, string> = {};
            data.forEach((s: SystemSetting) => {
                settingsMap[s.key] = s.value;
            });
            setSettings(prev => ({ ...prev, ...settingsMap }));
        } catch (error) {
            console.log('Using default settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: string, value: string) => {
        setSavingKey(key);
        try {
            await api.updateSystemSetting(key, value);
            toast({
                title: "Saved",
                description: `${key.replace(/_/g, ' ')} updated successfully`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save setting",
            });
        } finally {
            setSavingKey(null);
        }
    };

    const settingsConfig = [
        {
            key: 'commission_percentage',
            label: 'Platform Commission (%)',
            description: 'Percentage commission taken from each booking',
            icon: Percent,
        },
        {
            key: 'platform_fee',
            label: 'Platform Fee (₹)',
            description: 'Fixed platform fee per booking',
            icon: IndianRupee,
        },
        {
            key: 'minimum_booking_days',
            label: 'Minimum Booking Days',
            description: 'Minimum number of days for a booking',
            icon: Settings,
        },
        {
            key: 'cancellation_policy_hours',
            label: 'Cancellation Window (hours)',
            description: 'Hours before check-in for free cancellation',
            icon: Settings,
        },
        {
            key: 'referral_reward',
            label: 'Referral Reward (₹)',
            description: 'Reward amount for successful referrals',
            icon: IndianRupee,
        },
        {
            key: 'max_properties_per_owner',
            label: 'Max Properties per Owner',
            description: 'Maximum properties an owner can list',
            icon: Settings,
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-2">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Settings className="h-8 w-8" /> System Settings
                    </h1>
                    <p className="text-muted-foreground">Configure platform settings, commission, and policies</p>
                </div>

                {/* Settings Cards */}
                <div className="grid gap-6">
                    {settingsConfig.map(({ key, label, description, icon: Icon }) => (
                        <Card key={key}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Icon className="h-5 w-5" /> {label}
                                </CardTitle>
                                <CardDescription>{description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="text"
                                        value={settings[key] || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                                        className="max-w-xs"
                                    />
                                    <Button
                                        onClick={() => handleSave(key, settings[key])}
                                        disabled={savingKey === key}
                                    >
                                        {savingKey === key ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
