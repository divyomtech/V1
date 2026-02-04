import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api, setToken, getToken, removeToken, AuthResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'customer' | 'owner' | 'admin';

interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  profile_photo?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone: string, role: AppRole) => Promise<{ error: any; requiresVerification?: boolean; email?: string; role?: AppRole }>;
  verifyEmail: (email: string, otpCode: string, role: AppRole) => Promise<{ error: any }>;
  resendOtp: (email: string) => Promise<{ error: any }>;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  confirmResetPassword: (token: string, password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing token and load user
    const token = getToken();
    if (token) {
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await api.getCurrentUser();
      setUser(response.user);
      setProfile(response.profile);
      setRole(response.role);
    } catch (error) {
      // Token invalid, remove it
      removeToken();
      setUser(null);
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshRole = async () => {
    if (getToken()) {
      await loadCurrentUser();
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string, selectedRole: AppRole) => {
    try {
      const response = await api.signup(email, password, name, phone, selectedRole);

      // New flow: OTP verification required
      if (response.requires_verification) {
        toast({
          title: "Verification Required",
          description: `We've sent a verification code to ${response.email}`,
        });

        // Return email for OTP verification step
        return { error: null, requiresVerification: true, email: response.email, role: selectedRole };
      }

      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message,
      });
      return { error };
    }
  };

  const verifyEmail = async (email: string, otpCode: string, selectedRole: AppRole) => {
    try {
      const response = await api.verifyEmail(email, otpCode);

      // Store token
      setToken(response.token.access_token);

      // Set user data
      setUser(response.user);
      setProfile(response.profile);
      setRole(response.role);

      toast({
        title: "Account created!",
        description: selectedRole === 'owner'
          ? "Your owner account will be activated after admin approval"
          : "Welcome to He&She PG Booking",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message,
      });
      return { error };
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const response = await api.resendOtp(email);

      toast({
        title: "Code Resent",
        description: `New verification code sent to ${response.email}`,
      });

      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to resend code",
        description: error.message,
      });
      return { error };
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      // Clear previous user state first to prevent stale data
      setUser(null);
      setProfile(null);
      setRole(null);
      removeToken();

      const response = await api.login(identifier, password);

      // Store token
      setToken(response.token.access_token);

      // Set user data from fresh response
      setUser(response.user);
      setProfile(response.profile);
      setRole(response.role);

      // Toast removed - role validation in Auth.tsx will handle redirects
      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
      return { error };
    }
  };

  const signOut = async () => {
    removeToken();
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await api.resetPassword(email);

      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message,
      });
      return { error };
    }
  };

  const confirmResetPassword = async (token: string, password: string) => {
    try {
      await api.resetPasswordConfirm(token, password);

      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error.message,
      });
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signUp, verifyEmail, resendOtp, signIn, signOut, refreshRole, resetPassword, confirmResetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};