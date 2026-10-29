import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseLive } from '../lib/supabase';
import { USER_ROLES } from '../lib/constants';

const AuthContext = createContext(null);

const DEMO_USERS = [
  {
    id: 'usr-admin-01',
    email: 'admin@laundrypos.co.ke',
    full_name: 'Sarah Kimani (Operations Director)',
    phone: '+254700111222',
    role: USER_ROLES.ADMIN,
    is_active: true
  },
  {
    id: 'usr-cashier-01',
    email: 'cashier@laundrypos.co.ke',
    full_name: 'John Mwangi (Head Cashier)',
    phone: '+254700333444',
    role: USER_ROLES.CASHIER,
    is_active: true
  },
  {
    id: 'usr-laundry-01',
    email: 'processing@laundrypos.co.ke',
    full_name: 'Peter Omondi (Wash & Press Lead)',
    phone: '+254700555666',
    role: USER_ROLES.LAUNDRY_STAFF,
    is_active: true
  },
  {
    id: 'usr-delivery-01',
    email: 'dispatch@laundrypos.co.ke',
    full_name: 'Dennis Mutua (Delivery Dispatcher)',
    phone: '+254700777888',
    role: USER_ROLES.DELIVERY_STAFF,
    is_active: true
  }
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth
  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      try {
        if (isSupabaseLive()) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.user) {
            setSession(currentSession);
            await fetchUserProfile(currentSession.user);
          } else {
            // Check if demo user saved
            loadSavedDemoUser();
          }

          // Listen for Supabase auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            setSession(newSession);
            if (newSession?.user) {
              await fetchUserProfile(newSession.user);
            } else {
              loadSavedDemoUser();
            }
          });

          return () => subscription.unsubscribe();
        } else {
          loadSavedDemoUser();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        loadSavedDemoUser();
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  function loadSavedDemoUser() {
    const savedDemoId = localStorage.getItem('laundrypos_active_demo_user');
    const matched = DEMO_USERS.find(u => u.id === savedDemoId) || DEMO_USERS[1]; // default to Cashier
    setCurrentUser(matched);
  }

  async function fetchUserProfile(authUser) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !profile) {
        // Fallback profile if user exists in auth but not profiles table
        setCurrentUser({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          phone: authUser.user_metadata?.phone || '',
          role: authUser.user_metadata?.role || USER_ROLES.CASHIER,
          is_active: true
        });
      } else {
        setCurrentUser({
          id: profile.id,
          email: authUser.email,
          full_name: profile.full_name,
          phone: profile.phone,
          role: profile.role,
          is_active: profile.is_active
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }

  // Login with Supabase Email & Password
  async function loginWithPassword(email, password) {
    if (isSupabaseLive()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } else {
      // Demo authentication match
      const matched = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem('laundrypos_active_demo_user', matched.id);
        return { user: matched };
      }
      // If not recognized, set as cashier with custom email
      const customUser = {
        id: `usr-${Date.now()}`,
        email,
        full_name: email.split('@')[0],
        phone: '+254700000000',
        role: USER_ROLES.CASHIER,
        is_active: true
      };
      setCurrentUser(customUser);
      return { user: customUser };
    }
  }

  // Sign Up / Register new staff account in Supabase
  async function signUpWithPassword({ email, password, fullName, phone, role = USER_ROLES.CASHIER }) {
    if (isSupabaseLive()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
            role: role
          }
        }
      });
      if (error) throw error;
      if (data?.user && data?.session) {
        setSession(data.session);
        await fetchUserProfile(data.user);
      }
      return data;
    } else {
      const customUser = {
        id: `usr-${Date.now()}`,
        email,
        full_name: fullName || email.split('@')[0],
        phone: phone || '+254700000000',
        role,
        is_active: true
      };
      setCurrentUser(customUser);
      return { user: customUser };
    }
  }

  // Switch demo user (for fast testing across Cashier, Laundry Staff, Admin, Delivery roles)
  function switchDemoRole(roleOrUserId) {
    const matched = DEMO_USERS.find(u => u.id === roleOrUserId || u.role === roleOrUserId) || DEMO_USERS[0];
    setCurrentUser(matched);
    localStorage.setItem('laundrypos_active_demo_user', matched.id);
  }

  // Logout
  async function logout() {
    if (isSupabaseLive() && session) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem('laundrypos_active_demo_user');
  }

  // Permissions helpers
  const role = currentUser?.role || USER_ROLES.CASHIER;
  const isAdmin = role === USER_ROLES.ADMIN;
  const isCashier = role === USER_ROLES.CASHIER || isAdmin;
  const isLaundryStaff = role === USER_ROLES.LAUNDRY_STAFF || isAdmin;
  const isDeliveryStaff = role === USER_ROLES.DELIVERY_STAFF || isAdmin;

  const value = {
    currentUser,
    session,
    loading,
    role,
    isAdmin,
    isCashier,
    isLaundryStaff,
    isDeliveryStaff,
    demoUsers: DEMO_USERS,
    loginWithPassword,
    signUpWithPassword,
    switchDemoRole,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
