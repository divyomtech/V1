import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
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
      authSchema.parse({ email, password, name: isLogin ? undefined : name });
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

    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password, name, role);
    }
  };

  if (!isLogin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4">He&She</h1>
            <p className="text-lg text-muted-foreground">
              Find your perfect PG — clean, safe, affordable
            </p>
          </div>

          {/* Illustration Area */}
          <div className="flex-1 flex items-center justify-center my-8">
            <div className="w-full aspect-square max-w-xs bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center">
              <div className="text-center p-8">
                <p className="text-6xl mb-4">🏠</p>
                <p className="text-muted-foreground">Welcome to He&She PG</p>
              </div>
            </div>
          </div>

          {/* Sign Up Form */}
          <div className="space-y-4 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="h-12"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="h-12"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-12"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              
              <div className="space-y-3">
                <RadioGroup value={role} onValueChange={(v) => setRole(v as typeof role)}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer" className="font-normal cursor-pointer flex-1">Find a PG</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border">
                    <RadioGroupItem value="owner" id="owner" />
                    <Label htmlFor="owner" className="font-normal cursor-pointer flex-1">List my PG</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center">
            <button
              onClick={() => setIsLogin(true)}
              className="text-primary hover:underline font-medium"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4">He&She</h1>
          <p className="text-lg text-muted-foreground">
            Find your perfect PG — clean, safe, affordable
          </p>
        </div>

        {/* Illustration Area */}
        <div className="flex-1 flex items-center justify-center my-8">
          <div className="w-full aspect-square max-w-xs bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center">
            <div className="text-center p-8">
              <p className="text-6xl mb-4">👋</p>
              <p className="text-muted-foreground">Welcome back!</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-4 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-12"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-12"
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            
            <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90">
              Login
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={() => setIsLogin(false)}
            className="text-primary hover:underline font-medium"
          >
            Don't have an account? Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;