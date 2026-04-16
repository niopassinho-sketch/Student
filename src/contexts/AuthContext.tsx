import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handlePopupAuth = (currentSession: Session | null) => {
      // If this is a popup window and we have a session, send it back and close
      if (currentSession && window.opener && window.name === 'oauth_popup') {
        try {
          window.opener.postMessage({ 
            type: 'OAUTH_AUTH_SUCCESS',
            session: currentSession
          }, '*');
          window.close();
        } catch (e) {
          console.error('Error sending message to opener', e);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      handlePopupAuth(session);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      handlePopupAuth(session);
    });

    const handleMessage = async (event: MessageEvent) => {
      // Compatibility with previous approach
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.session) {
        const { access_token, refresh_token } = event.data.session;
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
      // New oauth-callback.html approach
      if (event.data?.type === 'OAUTH_AUTH_CALLBACK') {
        const hash = event.data.hash;
        const search = event.data.search;
        
        try {
          if (search && search.includes('code=')) {
            const params = new URLSearchParams(search);
            const code = params.get('code');
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
            }
          } else if (hash && hash.includes('access_token=')) {
            // Implicit grant flow (hash fragment)
            const hashParams = new URLSearchParams(hash.substring(1));
            const access_token = hashParams.get('access_token');
            const refresh_token = hashParams.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        } catch (e) {
          console.error("Error processing oauth callback:", e);
        }
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
