
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

  const getLatestAdminIP = async (): Promise<string | null> => {
    try {
      console.log('Fetching latest admin IP...');
      const { data: latestAdminIP, error } = await supabase
        .from('admin_ips')
        .select('ip_address')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching latest admin IP:', error);
        return null;
      }

      console.log('Latest admin IP found:', latestAdminIP?.ip_address);
      return latestAdminIP?.ip_address || null;
    } catch (error) {
      console.error('Error getting latest admin IP:', error);
      return null;
    }
  };

  const getCurrentUserIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();
      console.log('Current user IP:', ip);
      return ip;
    } catch (error) {
      console.error('Error getting current IP:', error);
      return null;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isAdmin: boolean) => {
    try {
      console.log('Signing up user:', email, 'isAdmin:', isAdmin);
      
      // Sign up the user but don't auto-login
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

      // Important: Sign out the user after signup to prevent auto-login
      await supabase.auth.signOut();

      toast({
        title: "Registration Successful",
        description: isAdmin 
          ? "Admin account created. Please login with your credentials after approval."
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

      console.log('Auth successful, checking credentials and conditions...');

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
        console.log('Student login - checking IP access...');
        
        // Get the latest admin IP from the database
        const latestAdminIP = await getLatestAdminIP();
        
        if (!latestAdminIP) {
          await supabase.auth.signOut();
          throw new Error('No admin IP found. Please contact administrator.');
        }

        // Get current user IP
        const currentUserIP = await getCurrentUserIP();
        
        if (!currentUserIP) {
          await supabase.auth.signOut();
          throw new Error('Could not verify your IP address. Please try again.');
        }

        // Check if current IP matches the latest admin IP
        if (currentUserIP !== latestAdminIP) {
          await supabase.auth.signOut();
          throw new Error('Connect to the exam LAN');
        }

        console.log('Student IP verification successful');
        
      } else if (profileData.is_admin) {
        console.log('Admin login - checking approval status...');
        
        // For admins, check if approved
        if (!profileData.admin_approved) {
          await supabase.auth.signOut();
          throw new Error('Admin account not approved yet. Please contact system administrator.');
        }

        console.log('Admin approval verification successful');

        // Store admin IP after successful login
        try {
          const currentIP = await getCurrentUserIP();
          if (currentIP) {
            console.log('Storing admin IP:', currentIP);
            
            await supabase
              .from('admin_ips')
              .upsert({
                admin_id: profileData.id,
                ip_address: currentIP
              });
          }
        } catch (ipError) {
          console.error('Error storing admin IP:', ipError);
        }
      }

      // Fetch and set the profile after all checks pass
      await fetchUserProfile(authData.user.id);

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
