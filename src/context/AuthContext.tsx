/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export type UserRole = 'ADMIN' | 'CABDIN' | 'SUPER_ADMIN' | 'PENGAWAS' | 'SEKOLAH';

export interface Profile {
  id: string;
  role: UserRole;
  nama_lengkap: string;
  nomor_induk: string;
  email: string;
  avatar_url?: string;
  sekolah_binaan?: string[]; 
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  signOut: async () => {},
});

let activeFetchPromise: Promise<Profile | null> | null = null;
let cachedUserId: string | null = null;
let cachedProfileData: Profile | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (cachedUserId === userId && cachedProfileData) {
      setProfile(cachedProfileData);
      setLoading(false);
      return;
    }

    if (activeFetchPromise && cachedUserId === userId) {
      try {
        const data = await activeFetchPromise;
        if (data) setProfile(data);
      } catch (err) {
        console.error("[Satelit PENA]: Gagal menumpang fetch:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    cachedUserId = userId;
    activeFetchPromise = (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    })();

    try {
      const data = await activeFetchPromise;
      if (!data) {
        console.warn("[Satelit PENA]: Akun valid, tapi belum punya profil!");
        setProfile(null);
        cachedProfileData = null;
      } else {
        console.log("[Satelit PENA]: Profil Terverifikasi ->", data);
        setProfile(data as Profile);
        cachedProfileData = data as Profile;
      }
    } catch (error: any) {
      console.error("[Satelit PENA Error]: Gagal menarik profil:", error.message || error);
      setProfile(null);
      cachedUserId = null;
      cachedProfileData = null;
    } finally {
      activeFetchPromise = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 🌟 FULL SUPABASE AUTH (SINGLE SIGN-ON) - Jalur bypass lama dihapus
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Kesalahan getSession:", err);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          cachedUserId = null;
          cachedProfileData = null;
          activeFetchPromise = null;
          setLoading(false);
        }
      }
    );
    const subscription = data.subscription;

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    
    // Hapus sisa-sisa cache bypass lama jika masih menempel di browser user
    localStorage.removeItem('pena_executive_session'); 
    
    cachedUserId = null;
    cachedProfileData = null;
    activeFetchPromise = null;
    
    await supabase.auth.signOut();
    
    setUser(null);
    setProfile(null);
    setLoading(false);
    
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, signOut: logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);