'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { stravaGetAuthUrl, stravaExchangeToken, stravaRefreshToken } from '../lib/api';

interface StravaAccount {
  stravaAccountId: number;
  athleteId: number;
  scope: string;
  tokenExpiresAt: string;
}

interface StravaContextType {
  isConnected: boolean;
  account: StravaAccount | null;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  exchangeCode: (code: string) => Promise<void>;
  refresh: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

const StravaContext = createContext<StravaContextType | null>(null);

const STRAVA_KEY = 'michelin_hub_strava';
const STRAVA_PENDING_KEY = 'michelin_hub_strava_pending';

export function StravaProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [account, setAccount] = useState<StravaAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistAccount = useCallback((data: StravaAccount | null) => {
    if (data) {
      localStorage.setItem(STRAVA_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STRAVA_KEY);
    }
    setAccount(data);
  }, []);

  useEffect(() => {
    if (!user || !token) {
      setAccount(null);
      setLoading(false);
      return;
    }

    const stored = localStorage.getItem(STRAVA_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StravaAccount;
        setAccount(parsed);
        stravaRefreshToken(token)
          .then((res) => {
            persistAccount({
              stravaAccountId: res.stravaAccountId,
              athleteId: parsed.athleteId,
              scope: res.scope,
              tokenExpiresAt: res.tokenExpiresAt,
            });
          })
          .catch(() => {
            // refresh failed but keep local state — user can reconnect if needed
          })
          .finally(() => setLoading(false));
      } catch {
        localStorage.removeItem(STRAVA_KEY);
        setLoading(false);
      }
    } else {
      stravaRefreshToken(token)
        .then((res) => {
          persistAccount({
            stravaAccountId: res.stravaAccountId,
            athleteId: 0,
            scope: res.scope,
            tokenExpiresAt: res.tokenExpiresAt,
          });
        })
        .catch(() => {
          // 404 = not connected, which is fine
        })
        .finally(() => setLoading(false));
    }
  }, [user, token, persistAccount]);

  const connect = useCallback(async () => {
    if (!token) throw new Error('Non authentifie');
    setError(null);
    const { authorizationUrl } = await stravaGetAuthUrl(token);
    localStorage.setItem(STRAVA_PENDING_KEY, 'true');
    window.location.href = authorizationUrl;
  }, [token]);

  const exchangeCode = useCallback(async (code: string) => {
    if (!token) throw new Error('Non authentifie');
    setError(null);
    setLoading(true);
    try {
      const res = await stravaExchangeToken(token, code);
      persistAccount({
        stravaAccountId: res.stravaAccountId,
        athleteId: res.athleteId,
        scope: res.scope,
        tokenExpiresAt: res.tokenExpiresAt,
      });
      localStorage.removeItem(STRAVA_PENDING_KEY);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur Strava';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, persistAccount]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await stravaRefreshToken(token);
      persistAccount({
        stravaAccountId: res.stravaAccountId,
        athleteId: account?.athleteId ?? 0,
        scope: res.scope,
        tokenExpiresAt: res.tokenExpiresAt,
      });
    } catch {
      // silent fail — token may still be valid
    }
  }, [token, account, persistAccount]);

  const disconnect = useCallback(() => {
    persistAccount(null);
    localStorage.removeItem(STRAVA_PENDING_KEY);
  }, [persistAccount]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <StravaContext.Provider value={{
      isConnected: account !== null,
      account,
      loading,
      error,
      connect,
      exchangeCode,
      refresh,
      disconnect,
      clearError,
    }}>
      {children}
    </StravaContext.Provider>
  );
}

export function useStrava() {
  const ctx = useContext(StravaContext);
  if (!ctx) throw new Error('useStrava must be used within StravaProvider');
  return ctx;
}
