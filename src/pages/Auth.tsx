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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Eye, EyeOff } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long').optional(),
});

const Auth = () => {
  const [view, setView] = useState<'welcome' | 'login' | 'signup' | 'forgot-password' | 'verify-otp' | 'reset-password' | 'verify-email-otp'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [signupRole, setSignupRole] = useState<'customer' | 'owner' | 'admin'>('customer');
  const [loginMode, setLoginMode] = useState<'user' | 'owner' | 'admin'>('user');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactInfo, setContactInfo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingRole, setPendingRole] = useState<'customer' | 'owner' | 'admin'>('customer');
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, verifyEmail, resendOtp, signIn, signOut, resetPassword, user, loading, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for password reset token in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setView('reset-password');
    }

    // Check for login mode in query string
    const qs = new URLSearchParams(window.location.search);
    const mode = qs.get('mode');
    if (mode === 'admin' || mode === 'owner') {
      setLoginMode(mode as 'user' | 'owner' | 'admin');
      setView('login');
    }
  }, []);

  // Countdown timer for OTP resend button
  useEffect(() => {
    if (view === 'verify-email-otp' && !canResendOtp && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (view === 'verify-email-otp' && resendCountdown === 0) {
      setCanResendOtp(true);
    }
  }, [view, canResendOtp, resendCountdown]);

  useEffect(() => {
    if (user && !loading && view !== 'reset-password' && view !== 'verify-otp' && view !== 'verify-email-otp') {
      // Validate role matches the selected login mode
      if (loginMode === 'admin') {
        // Admin login mode - require admin role
        if (role !== 'admin') {
          if (role === 'owner') {
            setErrors({ login: 'This is an owner account. Use Owner Login.' });
          } else {
            setErrors({ login: 'This is a user account. Use User Login.' });
          }
          signOut();
          return;
        }
        toast({ title: 'Login successful', description: 'Welcome to Admin Dashboard' });
        navigate('/admin');
      } else if (loginMode === 'owner') {
        // Owner login mode - require owner role
        if (role !== 'owner') {
          if (role === 'admin') {
            setErrors({ login: 'This is an admin account. Use Admin Login.' });
          } else {
            setErrors({ login: 'This is a user account. Use User Login.' });
          }
          signOut();
          return;
        }
        toast({ title: 'Login successful', description: 'Welcome to Owner Dashboard' });
        navigate('/owner/dashboard');
      } else {
        // User login mode - require customer role
        if (role !== 'customer') {
          if (role === 'admin') {
            setErrors({ login: 'This is an admin account. Use Admin Login.' });
          } else if (role === 'owner') {
            setErrors({ login: 'This is an owner account. Use Owner Login.' });
          }
          signOut();
          return;
        }
        toast({ title: 'Login successful', description: 'Welcome back!' });
        navigate('/');
      }
    }
  }, [user, role, loading, navigate, view, loginMode, signOut, toast]);

  const validateForm = () => {
    try {
      authSchema.parse({
        email,
        password,
        name: view === 'signup' ? name : undefined,
        phone: view === 'signup' ? phone : undefined
      });
      // Additional phone validation for signup
      if (view === 'signup' && (!phone || phone.length < 10)) {
        setErrors({ phone: 'Phone number is required (at least 10 digits)' });
        return false;
      }
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
      const result = await signIn(email, password);

      // If login was successful, validate role matches selected login mode
      if (!result.error) {
        // We need to check the role from the response
        // The role is set in the auth context after successful login
        // We'll validate in useEffect after role is updated
      }
    } else {
      const result = await signUp(email, password, name, phone, signupRole);

      // Check if email verification is required
      if (!result.error && result.requiresVerification && result.email) {
        setPendingEmail(result.email);
        setPendingRole(result.role || signupRole);
        setOtpCode('');
        setView('verify-email-otp');
        setCanResendOtp(false);
        setResendCountdown(30);
      }
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

      // Phone OTP not supported without Supabase
      toast({
        variant: "destructive",
        title: "Phone OTP not available",
        description: "Please use email for password reset.",
      });
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      variant: "destructive",
      title: "Phone OTP not available",
      description: "Please use email for password reset.",
    });
  };

  const handleResendPhoneOtp = async () => {
    toast({
      variant: "destructive",
      title: "Phone OTP not available",
      description: "Please use email for password reset.",
    });
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

    // Password reset via token needs backend API implementation
    toast({
      title: "Password reset",
      description: "Password reset functionality requires backend implementation.",
    });
    setNewPassword('');
    setConfirmPassword('');
    setView('login');
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
              <button
                onClick={() => { setLoginMode('admin'); setView('login'); }}
                className="text-primary hover:underline font-medium text-base"
                aria-label="Go to Admin Login"
              >
                Admin Portal
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
              {loginMode === 'admin' ? 'Admin Portal — authorized access only' : loginMode === 'owner' ? 'Owner Portal — manage your properties' : 'Welcome back! Please login to continue'}
            </p>
          </div>

          {/* Mode Switch */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Button
              type="button"
              variant={loginMode === 'user' ? 'default' : 'outline'}
              onClick={() => { setLoginMode('user'); setErrors({}); }}
              className="h-10"
            >
              User Login
            </Button>
            <Button
              type="button"
              variant={loginMode === 'owner' ? 'default' : 'outline'}
              onClick={() => { setLoginMode('owner'); setErrors({}); }}
              className="h-10"
            >
              Owner Login
            </Button>
            <Button
              type="button"
              variant={loginMode === 'admin' ? 'default' : 'outline'}
              onClick={() => { setLoginMode('admin'); setErrors({}); }}
              className="h-10"
            >
              Admin Login
            </Button>
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

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-12 text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              {errors.login && <p className="text-sm text-destructive mt-2 text-center font-medium">{errors.login}</p>}
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

  // Verify Email OTP Screen (signup flow)
  if (view === 'verify-email-otp') {
    const handleVerifyEmailOtp = async (e: React.FormEvent) => {
      e.preventDefault();

      if (otpCode.length !== 6) {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: "Please enter the 6-digit verification code",
        });
        return;
      }

      const result = await verifyEmail(pendingEmail, otpCode, pendingRole);
      if (!result.error) {
        // Successfully verified - redirect to appropriate dashboard
        setTimeout(() => {
          if (pendingRole === 'owner') {
            navigate('/owner');
          } else if (pendingRole === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 500); // Small delay to show success toast
      }
    };

    const handleResendEmailOtp = async () => {
      if (!canResendOtp) return;

      const result = await resendOtp(pendingEmail);
      if (!result.error) {
        setCanResendOtp(false);
        setResendCountdown(30);
        setOtpCode('');
      }
    };

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-3">He&She</h1>
            <p className="text-base text-muted-foreground">
              Enter the 6-digit code sent to your email
            </p>
            <p className="text-sm text-primary mt-2 font-medium">
              {pendingEmail}
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleVerifyEmailOtp} className="space-y-6 flex-1">
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

            <p className="text-center text-sm text-muted-foreground">
              Check your email inbox (and spam folder) for the verification code.
            </p>

            <Button type="submit" className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 rounded-xl">
              Verify Email
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6 space-y-4">
            <div>
              {canResendOtp ? (
                <button onClick={handleResendEmailOtp} className="text-primary hover:underline font-medium">
                  Resend code
                </button>
              ) : (
                <span className="text-muted-foreground">
                  Resend code in {resendCountdown}s
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setView('signup');
                setOtpCode('');
                setPendingEmail('');
              }}
              className="text-muted-foreground hover:text-primary font-medium"
            >
              ← Back to Sign Up
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
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="h-12 text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="h-12 text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number (e.g., +91XXXXXXXXXX)"
              className="h-12 text-base"
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-12 text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}

            <div className="space-y-3 pt-2">
              <Label className="text-base">I want to</Label>
              <RadioGroup value={signupRole} onValueChange={(v) => setSignupRole(v as typeof signupRole)}>
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
