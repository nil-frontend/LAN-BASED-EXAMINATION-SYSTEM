
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
      console.log('Current IP:', currentIP);
      console.log('Admin IPs:', adminIPs);

      // Check if current IP matches any admin IP
      return adminIPs.some(adminIP => adminIP.ip_address === currentIP);
    } catch (error) {
      console.error('Error checking IP access:', error);
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
      console.error('Signup error:', error);
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
      console.log('Attempting to sign in:', email);

      // First, attempt to authenticate with Supabase Auth
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
      await fetchUserProfile(authData.user.id);

      // Get the profile to check user type and conditions
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

      // Check user type and apply logic conditions
      if (profileData.is_student) {
        // For students, check IP access
        const hasIPAccess = await checkIPAccess();
        if (!hasIPAccess) {
          await supabase.auth.signOut();
          throw new Error('Connect to the exam LAN');
        }
      } else if (profileData.is_admin) {
        // For admins, check if approved
        if (!profileData.admin_approved) {
          await supabase.auth.signOut();
          throw new Error('Admin account not approved yet. Please contact system administrator.');
        }
      }

      // Store admin IP if admin login
      if (profileData.is_admin && authData.user) {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const { ip } = await response.json();
          console.log('Storing admin IP:', ip);
          
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
