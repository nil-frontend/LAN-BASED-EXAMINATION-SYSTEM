
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
  admin_approved: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, isAdmin: boolean) => Promise<void>;
  signIn: (email: string, password: string, userIP?: string) => Promise<void>;
  signOut: () => Promise<void>;
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkIPAccess = async (): Promise<boolean> => {
    try {
      // Get admin IPs from database
      const { data: adminIPs, error } = await supabase
        .from('admin_ips')
        .select('ip_address');

      if (error) throw error;

      // Get user's current IP (in a real app, you'd get this from the client)
      // For now, we'll simulate it or get it from a service
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip: currentIP } = await response.json();

      // Check if current IP matches any admin IP
      return adminIPs.some(adminIP => adminIP.ip_address === currentIP);
    } catch (error) {
      console.error('Error checking IP access:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            is_admin: isAdmin,
            is_student: !isAdmin
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Registration Successful",
        description: isAdmin 
          ? "Admin account created. Please wait for approval before logging in."
          : "Student account created successfully. You can now log in.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string, userIP?: string) => {
    try {
      setLoading(true);

      // First, check if email exists in profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        throw new Error('Email not found in our system');
      }

      // Check user type and apply logic
      if (profileData.is_student) {
        // For students, check IP access
        const hasIPAccess = await checkIPAccess();
        if (!hasIPAccess) {
          throw new Error('Connect to the exam LAN');
        }
      } else if (profileData.is_admin) {
        // For admins, check if approved
        if (!profileData.admin_approved) {
          throw new Error('Admin account not approved yet. Please contact system administrator.');
        }
      }

      // Proceed with authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Store admin IP if admin login
      if (profileData.is_admin && data.user) {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const { ip } = await response.json();
          
          await supabase
            .from('admin_ips')
            .upsert({
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

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
