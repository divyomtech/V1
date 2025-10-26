import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Gift, Copy, Check, Users, IndianRupee } from 'lucide-react';

interface Referral {
  id: string;
  referral_code: string;
  reward_amount: number;
  reward_claimed: boolean;
  created_at: string;
  referee_id: string | null;
}

const Referrals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myReferralCode, setMyReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totalRewards, setTotalRewards] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrCreateReferralCode();
    fetchReferrals();
  }, [user]);

  const fetchOrCreateReferralCode = async () => {
    if (!user) return;

    // Check if user already has a referral code
    const { data: existing } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', user.id)
      .limit(1)
      .single();

    if (existing) {
      setMyReferralCode(existing.referral_code);
    } else {
      // Create a new referral code
      const code = `REF${user.id.substring(0, 8).toUpperCase()}`;
      const { data, error } = await supabase
        .from('referrals')
        .insert({ referrer_id: user.id, referral_code: code })
        .select('referral_code')
        .single();

      if (!error && data) {
        setMyReferralCode(data.referral_code);
      }
    }
  };

  const fetchReferrals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReferrals(data);
      const total = data.reduce((sum, ref) => 
        sum + (ref.reward_claimed ? ref.reward_amount : 0), 0
      );
      setTotalRewards(total);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${myReferralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const successfulReferrals = referrals.filter(r => r.referee_id !== null).length;
  const pendingRewards = referrals.filter(r => !r.reward_claimed && r.referee_id).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
            <p className="text-muted-foreground">
              Invite friends and earn rewards when they book their first PG!
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{successfulReferrals}</p>
                    <p className="text-sm text-muted-foreground">Successful Referrals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <IndianRupee className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹{totalRewards}</p>
                    <p className="text-sm text-muted-foreground">Total Rewards Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Gift className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingRewards}</p>
                    <p className="text-sm text-muted-foreground">Pending Rewards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/auth?ref=${myReferralCode}`}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md text-sm bg-muted"
                  />
                  <Button onClick={copyReferralLink} variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share this link with your friends. When they sign up and book their first PG, 
                  you'll earn ₹500!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Referral History */}
          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No referrals yet. Start sharing your link!
                </p>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {referral.referee_id ? 'Friend Joined!' : 'Link Shared'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold flex items-center">
                          <IndianRupee className="h-4 w-4" />
                          {referral.reward_amount}
                        </span>
                        <Badge
                          variant={referral.reward_claimed ? 'default' : 'secondary'}
                        >
                          {referral.reward_claimed ? 'Claimed' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Referrals;