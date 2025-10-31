import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import welcomeIllustration from '@/assets/welcome-illustration.png';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const Auth = () => {
  const [view, setView] = useState<'welcome' | 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-password'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'owner' | 'admin'>('customer');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactInfo, setContactInfo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const { signUp, signIn, resetPassword, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for password reset token in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setView('reset-password');
    }
  }, []);

  useEffect(() => {
    if (user && !loading && view !== 'reset-password' && view !== 'verify-otp') {
      navigate('/');
    }
  }, [user, loading, navigate, view]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password, name: view === 'signup' ? name : undefined });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (view === 'login') {
      await signIn(email, password);
    } else {
      await signUp(email, password, name, role);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactInfo) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please enter your email or mobile number",
      });
      return;
    }

    // Check if it's an email or mobile number
    const isEmail = contactInfo.includes('@');
    
    if (isEmail) {
      const emailSchema = z.string().email();
      if (!emailSchema.safeParse(contactInfo).success) {
        toast({
          variant: "destructive",
          title: "Invalid email",
          description: "Please enter a valid email address",
        });
        return;
      }

      const result = await resetPassword(contactInfo);
      if (!result.error) {
        toast({
          title: "Reset link sent",
          description: "Check your email for the password reset link",
        });
        setView('login');
        setContactInfo('');
      }
    } else {
      // Treat as phone number flow (OTP)
      const phoneRaw = contactInfo.trim();
      const sanitized = phoneRaw.replace(/\s+/g, '');
      let phone = sanitized;
      if (/^\d{10,15}$/.test(sanitized)) {
        phone = `+${sanitized}`;
      }

      const phoneSchema = z.string().regex(/^\+?[1-9]\d{7,14}$/,
        'Enter a valid phone number with country code (e.g., +91XXXXXXXXXX)'
      );
      if (!phoneSchema.safeParse(phone).success) {
        toast({
          variant: "destructive",
          title: "Invalid phone number",
          description: "Use country code, e.g., +91XXXXXXXXXX",
        });
        return;
      }

      try {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        setOtpPhone(phone);
        setView('verify-otp');
        toast({
          title: "OTP sent",
          description: `We sent a 6-digit code to ${phone}`,
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Could not send OTP",
          description: err?.message || "SMS is not enabled. Use email reset or enable SMS in the backend.",
        });
      }
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpPhone) {
      toast({
        variant: "destructive",
        title: "Missing phone",
        description: "Go back and enter your phone number",
      });
      return;
    }

    if (!otpCode || otpCode.trim().length < 4) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter the 6-digit code",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: otpPhone,
        token: otpCode,
        type: 'sms',
      } as any);
      if (error) throw error;

      toast({ title: "Verified", description: "Please create your new password" });
      setView('reset-password');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error?.message || "The code you entered is invalid",
      });
    }
  };

  const handleResendPhoneOtp = async () => {
    if (!otpPhone) return;
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: otpPhone });
      if (error) throw error;
      toast({ title: "OTP resent", description: `A new code was sent to ${otpPhone}` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could not resend OTP",
        description: error?.message || "Please wait a bit and try again",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully reset",
      });
      
      setNewPassword('');
      setConfirmPassword('');
      setView('login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to reset password",
        description: error.message,
      });
    }
  };

  // Welcome Screen
  if (view === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full justify-between">
          {/* Header */}
          <div className="pt-4">
            <h1 className="text-5xl font-bold mb-3">He&She</h1>
            <p className="text-base text-muted-foreground">
              Find your perfect PG — clean, safe, affordable
            </p>
          </div>

          {/* Illustration */}
          <div className="flex-1 flex items-center justify-center">
            <img 
              src={welcomeIllustration} 
              alt="Welcome to He&She PG" 
              className="w-full max-w-[280px] h-auto"
            />
          </div>

          {/* CTA and Links */}
          <div className="space-y-6 pb-4">
            <Button 
              onClick={() => setView('signup')}
              className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl"
            >
              Get Started
            </Button>
            
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => setView('login')}
                className="text-foreground hover:text-primary font-medium text-base"
              >
                Login
              </button>
              <button
                onClick={() => setView('signup')}
                className="text-foreground hover:text-primary font-medium text-base"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Screen
  if (view === 'login') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-3">He&She</h1>
            <p className="text-base text-muted-foreground">
              Welcome back! Please login to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
            <div className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="h-12 text-base"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-12 text-base"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            
            <div className="pt-6">
              <Button type="submit" className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl">
                Login
              </Button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setView('forgot-password')}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Forgot Password?
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              Admin accounts are assigned in the backend. Just log in—if your user has the admin role, you'll be redirected to the Admin Dashboard.
            </p>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <button
              onClick={() => setView('welcome')}
              className="text-muted-foreground hover:text-primary font-medium"
            >
              ← Back
            </button>
            <p className="mt-4 text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => setView('signup')}
                className="text-primary hover:underline font-medium"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Forgot Password Screen
  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-3">He&She</h1>
            <p className="text-base text-muted-foreground">
              Enter your email or mobile number to reset your password
            </p>
          </div>

          {/* Forgot Password Form */}
          <form onSubmit={handleForgotPassword} className="space-y-4 flex-1">
            <div className="space-y-4">
              <Input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Email or Mobile Number"
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">
                Use email for a reset link or phone (+country code) to receive an OTP.
              </p>
            </div>
            
            <div className="pt-6">
              <Button type="submit" className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl">
                Send Reset Link
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <button
              onClick={() => setView('login')}
              className="text-muted-foreground hover:text-primary font-medium"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verify OTP Screen (phone)
  if (view === 'verify-otp') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-3">He&She</h1>
            <p className="text-base text-muted-foreground">
              Enter the 6-digit code sent to your phone
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleVerifyPhoneOtp} className="space-y-6 flex-1">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button type="submit" className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl">
              Verify OTP
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6 space-x-6">
            <button onClick={handleResendPhoneOtp} className="text-primary hover:underline font-medium">
              Resend code
            </button>
            <button onClick={() => setView('forgot-password')} className="text-muted-foreground hover:text-primary font-medium">
              Change number
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reset Password Screen (after clicking email link)
  if (view === 'reset-password') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-3">He&She</h1>
            <p className="text-base text-muted-foreground">
              Create your new password
            </p>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleResetPassword} className="space-y-4 flex-1">
            <div className="space-y-4">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="h-12 text-base"
              />
              
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="h-12 text-base"
              />
            </div>
            
            <div className="pt-6">
              <Button type="submit" className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl">
                Reset Password
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <button
              onClick={() => setView('login')}
              className="text-muted-foreground hover:text-primary font-medium"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sign Up Screen
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-5xl font-bold mb-3">He&She</h1>
          <p className="text-base text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div className="space-y-4">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="h-12 text-base"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-12 text-base"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-12 text-base"
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            
            <div className="space-y-3 pt-2">
              <Label className="text-base">I want to</Label>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer" className="font-normal cursor-pointer flex-1 text-base">
                    Find a PG
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="owner" id="owner" />
                  <Label htmlFor="owner" className="font-normal cursor-pointer flex-1 text-base">
                    List my PG
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <div className="pt-6">
            <Button type="submit" className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl">
              Get Started
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <button
            onClick={() => setView('welcome')}
            className="text-muted-foreground hover:text-primary font-medium"
          >
            ← Back
          </button>
          <p className="mt-4 text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => setView('login')}
              className="text-primary hover:underline font-medium"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
