import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from './supabase';
import { debugLogger } from './debug';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache pour éviter les requêtes répétées
let profileCache: { [userId: string]: Profile | null } = {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔄 AuthProvider render - user:', !!user, 'profile:', !!profile, 'loading:', loading);

  // Debug logging pour l'authentification
  useEffect(() => {
    if (user && profile) {
      debugLogger.auth('Utilisateur connecté', {
        email: profile.email,
        role: profile.role,
        campus: profile.campus?.name || 'Non assigné',
        userId: user.id
      });
    } else if (!user && !loading) {
      debugLogger.auth('Utilisateur déconnecté');
    }
  }, [user, profile, loading]);

  useEffect(() => {
    console.log('🚀 AuthProvider useEffect: Getting initial session...');
    
    let mounted = true;
    
    // Timeout de sécurité - forcer l'arrêt du loading après 10 secondes
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log('⏰ TIMEOUT: Forcing loading to false after 10s');
        setLoading(false);
      }
    }, 10000);

    const getInitialSession = async () => {
      try {
        // Timeout sur getSession
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        console.log('📋 Initial session result:', !!session?.user, error ? 'ERROR' : 'OK');
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('👤 User found in session, setting user and fetching profile...');
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('❌ No user in session');
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    getInitialSession();

    console.log('👂 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state change:', event, !!session?.user);
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Auth change: User found, fetching profile...');
          await fetchProfile(session.user.id);
        } else {
          console.log('❌ Auth change: No user');
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('🔍 fetchProfile called for userId:', userId);
    
    // Vérifier le cache d'abord
    if (profileCache[userId]) {
      console.log('💾 Profile found in cache');
      setProfile(profileCache[userId]);
      setLoading(false);
      return;
    }
    
    try {
      console.log('📡 Starting Supabase profile query...');
      
      // Timeout sur la requête profile
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 3000)
      );
      
      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      console.log('📡 Supabase profile query completed - data:', !!data, 'error:', !!error);
      
      if (error) {
        console.log('❌ Profile fetch error:', error.code, error.message);
        if (error.code === 'PGRST116') {
          console.log('👤 No profile found (404)');
        }
        profileCache[userId] = null;
        setProfile(null);
      } else {
        console.log('✅ Profile fetched successfully:', data?.email, data?.role);
        profileCache[userId] = data;
        setProfile(data);
      }
    } catch (error) {
      console.log('💥 Profile fetch exception:', error);
      profileCache[userId] = null;
      setProfile(null);
    } finally {
      console.log('🏁 fetchProfile finished, setting loading to false');
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 signIn called for:', email);
    debugLogger.auth('Tentative de connexion', { email });
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('🔐 signIn result:', error ? 'ERROR' : 'SUCCESS');
      if (error) {
        debugLogger.error('AUTH', 'Échec de connexion', { email, error: error.message });
        // En cas d'erreur, arrêter le loading immédiatement
        setLoading(false);
      } else {
        debugLogger.auth('Connexion réussie', { email });
        // En cas de succès, onAuthStateChange gérera le loading
      }
      return { error };
    } catch (error) {
      console.log('💥 signIn exception:', error);
      // En cas d'exception, arrêter le loading
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('🚪 signOut called');
    debugLogger.auth('Déconnexion demandée', { email: profile?.email });
    setLoading(true);
    
    // Vider le cache
    profileCache = {};
    
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
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