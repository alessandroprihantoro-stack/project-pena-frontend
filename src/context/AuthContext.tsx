/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export type UserRole = 'ADMIN' | 'PENGAWAS' | 'SEKOLAH';

export interface Profile {
  id: string;
  role: UserRole;
  nama_lengkap: string;
  nomor_induk: string;
  email: string;
  avatar_url?: string;
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

// 🛡️ CHECKPOINT PROTECTION (SINGLE FLIGHT MODULE GUARD):
// Tipe data dipertegas menjadi Promise<Profile | null> agar TypeScript puas
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
        console.warn("[Satelit PENA]: Akun valid, tapi belum punya KTP di tabel profiles!");
        setProfile(null);
        cachedProfileData = null;
      } else {
        console.log("[Satelit PENA]: KTP Terverifikasi ->", data);
        setProfile(data);
        cachedProfileData = data;
      }
    } catch (error: any) {
      console.error("[Satelit PENA Error]: Gagal menarik KTP:", error.message || error);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    cachedUserId = null;
    cachedProfileData = null;
    activeFetchPromise = null;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, signOut: logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);