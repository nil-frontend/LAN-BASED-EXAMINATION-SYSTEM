
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_student: boolean;
  is_super_admin: boolean;
  admin_approved: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, isAdmin: boolean) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      console.log('Profile fetched:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const verifyStudentIPAccess = async (): Promise<boolean> => {
    try {
      console.log('Starting IP verification for student...');
      
      // Get all admin IPs sorted by created_at (most recent first)
      const { data: adminIPs, error: adminIPError } = await supabase
        .from('admin_ips')
        .select('ip_address, created_at')
        .order('created_at', { ascending: false });

      console.log('Admin IPs fetched:', adminIPs);

      if (adminIPError) {
        console.error('Error fetching admin IPs:', adminIPError);
        return false;
      }

      // Check if we have any admin IPs
      if (!adminIPs || adminIPs.length === 0) {
        console.log('No admin IPs found in database');
        return false;
      }

      // Get the most recent admin IP (0th index)
      const latestAdminIP = adminIPs[0];
      console.log('Latest admin IP record:', latestAdminIP);

      // Get student's current IP
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip: currentIP } = await response.json();
      
      console.log('Latest admin IP:', latestAdminIP.ip_address);
      console.log('Student current IP:', currentIP);

      // Compare IPs (convert admin IP to string since it's stored as inet type)
      const adminIPString = String(latestAdminIP.ip_address);
      const ipMatch = adminIPString === currentIP;
      
      console.log('IP match result:', ipMatch);
      return ipMatch;
    } catch (error) {
      console.error('Error in IP verification:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isAdmin: boolean) => {
    try {
      console.log('Signing up user:', email, 'isAdmin:', isAdmin);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            is_admin: isAdmin,
            is_student: !isAdmin,
            is_super_admin: false
          }
        }
      });

      if (error) throw error;

      // Important: Sign out the user immediately after signup to prevent auto-login
      await supabase.auth.signOut();

      toast({
        title: "Registration Successful",
        description: isAdmin 
          ? "Admin account created. Please login and wait for approval."
          : "Student account created successfully. Please login with your credentials.",
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting to sign in:', email);

      // First, authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      console.log('Auth successful, fetching profile...');

      // Fetch the user profile after successful authentication
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Profile error:', profileError);
        await supabase.auth.signOut();
        throw new Error('User profile not found. Please contact administrator.');
      }

      console.log('Profile found:', profileData);

      // Check user type and apply authentication logic
      if (profileData.is_student) {
        console.log('Student login detected, checking IP access...');
        // For students, check IP access against latest admin IP
        const hasIPAccess = await verifyStudentIPAccess();
        if (!hasIPAccess) {
          await supabase.auth.signOut();
          throw new Error('Access denied. Please connect to the exam network.');
        }
        console.log('Student IP verification passed');
      } else if (profileData.is_super_admin) {
        console.log('Super admin login detected');
        // Super admin has unrestricted access
      } else if (profileData.is_admin) {
        console.log('Admin login detected, checking approval status...');
        // For admins, check if approved
        if (!profileData.admin_approved) {
          await supabase.auth.signOut();
          throw new Error('Admin account not approved yet. Please contact system administrator.');
        }
        console.log('Admin approval check passed');
      }

      // Store admin IP if admin or super admin login (after approval check)
      if ((profileData.is_admin && profileData.admin_approved) || profileData.is_super_admin) {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const { ip } = await response.json();
          console.log('Storing admin IP:', ip);
          
          await supabase
            .from('admin_ips')
            .insert({
              admin_id: profileData.id,
              ip_address: ip
            });
        } catch (ipError) {
          console.error('Error storing admin IP:', ipError);
        }
      }

      toast({
        title: "Login Successful",
        description: `Welcome ${profileData.full_name}!`,
      });

    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setSession(null);
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
