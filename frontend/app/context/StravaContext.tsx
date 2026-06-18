'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { stravaGetAuthUrl, stravaExchangeToken, stravaRefreshToken, stravaSyncActivities, stravaDisconnect, type StravaSyncResponse, type SyncedActivity } from '../lib/api';

interface StravaAccount {
  stravaAccountId: number;
  athleteId: number;
  scope: string;
  tokenExpiresAt: string;
}

interface StravaContextType {
  isConnected: boolean;
  account: StravaAccount | null;
  activities: SyncedActivity[];
  lastSync: string | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  sharedActivityIds: string[];
  connect: () => Promise<void>;
  exchangeCode: (code: string) => Promise<void>;
  refresh: () => Promise<void>;
  syncActivities: () => Promise<StravaSyncResponse>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  shareActivity: (activityId: string) => void;
  unshareActivity: (activityId: string) => void;
}

const StravaContext = createContext<StravaContextType | null>(null);

const STRAVA_PENDING_KEY = 'michelin_hub_strava_pending';

function userKey(base: string, userId: number): string {
  return `${base}_u${userId}`;
}

export function StravaProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [account, setAccount] = useState<StravaAccount | null>(null);
  const [activities, setActivities] = useState<SyncedActivity[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedActivityIds, setSharedActivityIds] = useState<string[]>([]);

  const userIdRef = useRef<number | null>(null);

  const stravaKey = user ? userKey('michelin_hub_strava', user.id) : null;
  const activitiesKey = user ? userKey('michelin_hub_strava_activities', user.id) : null;
  const lastSyncKey = user ? userKey('michelin_hub_strava_lastsync', user.id) : null;
  const sharedKey = user ? userKey('michelin_shared_activities', user.id) : null;

  const persistAccount = useCallback((data: StravaAccount | null) => {
    if (!stravaKey) return;
    if (data) {
      localStorage.setItem(stravaKey, JSON.stringify(data));
    } else {
      localStorage.removeItem(stravaKey);
    }
    setAccount(data);
  }, [stravaKey]);

  useEffect(() => {
    if (!user || !token) {
      setAccount(null);
      setActivities([]);
      setLastSync(null);
      setSharedActivityIds([]);
      setLoading(false);
      userIdRef.current = null;
      return;
    }

    const uid = user.id;
    const sKey = userKey('michelin_hub_strava', uid);
    const aKey = userKey('michelin_hub_strava_activities', uid);
    const lKey = userKey('michelin_hub_strava_lastsync', uid);
    const shKey = userKey('michelin_shared_activities', uid);

    // Reset state when switching users
    if (userIdRef.current !== uid) {
      setAccount(null);
      setActivities([]);
      setLastSync(null);
      setSharedActivityIds([]);
      userIdRef.current = uid;
    }

    // Load user-scoped data
    const storedActivities = localStorage.getItem(aKey);
    if (storedActivities) {
      try { setActivities(JSON.parse(storedActivities)); } catch { /* ignore */ }
    } else {
      setActivities([]);
    }

    const storedLastSync = localStorage.getItem(lKey);
    setLastSync(storedLastSync || null);

    const storedShared = localStorage.getItem(shKey);
    if (storedShared) {
      try { setSharedActivityIds(JSON.parse(storedShared)); } catch { setSharedActivityIds([]); }
    } else {
      setSharedActivityIds([]);
    }

    const stored = localStorage.getItem(sKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StravaAccount;
        setAccount(parsed);
        stravaRefreshToken(token)
          .then((res) => {
            const updated: StravaAccount = {
              stravaAccountId: res.stravaAccountId,
              athleteId: parsed.athleteId,
              scope: res.scope,
              tokenExpiresAt: res.tokenExpiresAt,
            };
            localStorage.setItem(sKey, JSON.stringify(updated));
            setAccount(updated);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } catch {
        localStorage.removeItem(sKey);
        setLoading(false);
      }
    } else {
      stravaRefreshToken(token)
        .then((res) => {
          const acct: StravaAccount = {
            stravaAccountId: res.stravaAccountId,
            athleteId: 0,
            scope: res.scope,
            tokenExpiresAt: res.tokenExpiresAt,
          };
          localStorage.setItem(sKey, JSON.stringify(acct));
          setAccount(acct);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, token]);

  const connect = useCallback(async () => {
    if (!token) throw new Error('Non authentifie');
    setError(null);
    const { authorizationUrl } = await stravaGetAuthUrl(token);
    localStorage.setItem(STRAVA_PENDING_KEY, 'true');
    window.location.href = authorizationUrl;
  }, [token]);

  const exchangeCode = useCallback(async (code: string) => {
    if (!token || !stravaKey) throw new Error('Non authentifie');
    setError(null);
    setLoading(true);
    try {
      const res = await stravaExchangeToken(token, code);
      const acct: StravaAccount = {
        stravaAccountId: res.stravaAccountId,
        athleteId: res.athleteId,
        scope: res.scope,
        tokenExpiresAt: res.tokenExpiresAt,
      };
      localStorage.setItem(stravaKey, JSON.stringify(acct));
      setAccount(acct);
      localStorage.removeItem(STRAVA_PENDING_KEY);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur Strava';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, stravaKey]);

  const refresh = useCallback(async () => {
    if (!token || !stravaKey) return;
    try {
      const res = await stravaRefreshToken(token);
      const updated: StravaAccount = {
        stravaAccountId: res.stravaAccountId,
        athleteId: account?.athleteId ?? 0,
        scope: res.scope,
        tokenExpiresAt: res.tokenExpiresAt,
      };
      localStorage.setItem(stravaKey, JSON.stringify(updated));
      setAccount(updated);
    } catch {
      // silent fail
    }
  }, [token, account, stravaKey]);

  const syncActivities = useCallback(async (): Promise<StravaSyncResponse> => {
    if (!token || !activitiesKey || !lastSyncKey) throw new Error('Non authentifie');
    setError(null);
    setSyncing(true);
    try {
      const result = await stravaSyncActivities(token);
      setActivities(result.activities);
      localStorage.setItem(activitiesKey, JSON.stringify(result.activities));
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastSync(now);
      localStorage.setItem(lastSyncKey, now);
      return result;
    } finally {
      setSyncing(false);
    }
  }, [token, activitiesKey, lastSyncKey]);

  const disconnect = useCallback(async () => {
    if (token) {
      try {
        await stravaDisconnect(token);
      } catch {}
    }
    if (stravaKey) localStorage.removeItem(stravaKey);
    if (activitiesKey) localStorage.removeItem(activitiesKey);
    if (lastSyncKey) localStorage.removeItem(lastSyncKey);
    localStorage.removeItem(STRAVA_PENDING_KEY);
    setAccount(null);
    setActivities([]);
    setLastSync(null);
  }, [token, stravaKey, activitiesKey, lastSyncKey]);

  const clearError = useCallback(() => setError(null), []);

  const shareActivity = useCallback((activityId: string) => {
    setSharedActivityIds((prev) => {
      if (prev.includes(activityId)) return prev;
      const next = [...prev, activityId];
      if (sharedKey) localStorage.setItem(sharedKey, JSON.stringify(next));
      return next;
    });
  }, [sharedKey]);

  const unshareActivity = useCallback((activityId: string) => {
    setSharedActivityIds((prev) => {
      const next = prev.filter((id) => id !== activityId);
      if (sharedKey) localStorage.setItem(sharedKey, JSON.stringify(next));
      return next;
    });
  }, [sharedKey]);

  return (
    <StravaContext.Provider value={{
      isConnected: account !== null,
      account,
      activities,
      lastSync,
      loading,
      syncing,
      error,
      sharedActivityIds,
      connect,
      exchangeCode,
      refresh,
      syncActivities,
      disconnect,
      clearError,
      shareActivity,
      unshareActivity,
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
