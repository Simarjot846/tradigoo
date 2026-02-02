'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from './supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      // Ignore 'Row not found' (PGRST116) as it might happen during initial signup before trigger
      if (error.code === 'PGRST116') {
        console.warn('Profile missing (PGRST116). Auto-creating profile for:', authUser.id);

        const newProfile = {
          id: authUser.id,
          email: authUser.email || 'user@example.com',
          role: 'retailer', // Default role
          name: authUser.email?.split('@')[0] || 'Trader',
          business_name: 'New Trader Business',
          location: 'Delhi, India',
          trust_score: 100,
          total_orders: 0
        };

        // Insert the missing profile
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile as any) // Type cast to avoid strict shape issues during quick fix
          .select()
          .single();

        if (createError) {
          console.error('Failed to auto-create profile:', createError);
          return null;
        }

        return createdProfile;
      }
      console.error('Error fetching profile:', JSON.stringify(error, null, 2));
      return null;
    }

    return profile;
  };

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const profile = await fetchUserProfile(authUser);
      setUser(profile);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // Safety timeout - Reduced to 4 seconds as requested for faster fallback
    const timer = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading) {
          console.warn("Auth check timed out (4s). Assuming public/guest state.");
          return false;
        }
        return currentLoading;
      });
    }, 4000);

    // Check active session
    const start = performance.now();
    console.log("Authenticating...");

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        console.log(`Session found in ${(performance.now() - start).toFixed(2)}ms, fetching profile...`);
        fetchUserProfile(session.user).then(profile => {
          if (profile) {
            setUser(profile);
          } else {
            // Fallback if profile fetch fails but auth is valid? 
            // Usually implies issue, but we shouldn't block app.
            console.warn("User authenticated but profile load failed.");
          }
          setLoading(false);
          clearTimeout(timer);
        }).catch(err => {
          console.error("Profile fetch error:", err);
          setLoading(false);
          clearTimeout(timer);
        });
      } else {
        setLoading(false);
        clearTimeout(timer);
      }
    }).catch((err: any) => {
      // Ignore AbortErrors
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setLoading(false);
        clearTimeout(timer);
        return;
      }
      console.error("Session check failed:", err);
      setLoading(false);
      clearTimeout(timer);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          // Optimistic update if we already have a user and IDs match, 
          // might not need to refetch immediately unless it's a profile update event?
          // But strict generic auth change (like token refresh) shouldn't trigger heavy DB call ideally.

          if (event === 'TOKEN_REFRESHED' && user?.id === session.user.id) {
            // Skip profile refetch on token refresh to reduce load
            return;
          }

          try {
            // Only fetch if necessary
            const profile = await fetchUserProfile(session.user);
            setUser(prev => {
              if (JSON.stringify(prev) === JSON.stringify(profile)) return prev;
              return profile;
            });
          } catch (error) {
            console.error("Error updating profile on auth change:", error);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
        clearTimeout(timer);
      }
    );

  }, []);

  const signIn = async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const profile = await fetchUserProfile(data.user);
      setUser(profile);
      return profile;
    }
    return null;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      if (data.user) {
        // Sign in automatically after successful signup if session is returned
        // But since we did server-side signup, we might need to rely on the auto-login flow 
        // or just redirect the user to login if email confirmation is enabled.
        // Assuming email confirmation is NOT required for this demo or handled via flow:

        // Refresh session to get the user logged in on client side if cookies were set by server action?
        // Wait, the API route used `supabase.auth.signUp`. If email confirmation is off, it "logs in" the user instance 
        // on that server client. But it doesn't automatically set the cookie for the *browser* unless 
        // we passed the request cookies/headers in the API route correctly.
        // Actually, `createServerClient` in the API route uses `cookies()` headers.
        // Let's check `lib/supabase-server.ts`. It reads cookies.

        // In the API route:
        // const supabase = await createClient();
        // await supabase.auth.signUp(...) 
        // This sets the auth cookie on the *response* of the internal supabase client.
        // We probably need to make sure the API route returns the session or we handle the client side login content.

        // HOWEVER, simpler approach for now:
        // Just let the user log in, OR if the API route sets cookies (it might not if we didn't explicitly middleware copy them back),
        // we can just call signIn with the password immediately after signup to ensure client session is active.

        // Let's stick to the plan: The API creates the account and profile.
        // Then we can just immediately sign in client-side to establish the local session.
        try {
          await signIn(email, password);
        } catch (signInError: any) {
          // If auto-login fails (e.g., email not confirmed), we normally shouldn't block the signup success.
          // The user should just be redirected to login (or dashboard -> login).
          if (signInError?.message?.includes('Email not confirmed')) {
            console.warn('Auto-login failed: Email not confirmed. User needs to verify email.');
            // Do not throw; let the function complete so the UI treats signup as successful
          } else {
            // Other errors (like wrong password? shouldn't happen right after signup) 
            // or network issues should probably be reported.
            throw signInError;
          }
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    router.push('/');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signUp, signOut, refreshUser, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
