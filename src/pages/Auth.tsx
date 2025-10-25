import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import welcomeIllustration from '@/assets/welcome-illustration.png';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const Auth = () => {
  const [view, setView] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'owner' | 'admin'>('customer');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp, signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

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
