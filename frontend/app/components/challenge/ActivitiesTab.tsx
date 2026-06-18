"use client";

import { useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useStrava } from "../../context/StravaContext";
import { useRouter } from "next/navigation";
import type { SyncedActivity } from "../../lib/api";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

function formatDistance(meters: number) {
  return (meters / 1000).toFixed(1);
}

function formatSpeed(ms: number) {
  return (ms * 3.6).toFixed(1);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffH < 1) return "Il y a moins d'1h";
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD} jours`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const GRADIENTS = [
  "from-orange-500 to-red-600",
  "from-blue-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-700",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-blue-600",
];

function StravaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Strava">
      <path
        d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"
        fill="#FC4C02"
      />
    </svg>
  );
}

function ActivityCard({ activity, index, isShared, onToggleShare }: {
  activity: { id: number; activityId: string; name: string; distance: number; movingTime: number; totalElevationGain: number; sportType: string; startedAt: string; locationCity: string | null; locationCountry: string | null; averageSpeed: number };
  index: number;
  isShared: boolean;
  onToggleShare: () => void;
}) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const location = [activity.locationCity, activity.locationCountry].filter(Boolean).join(", ");

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-[#000c34] text-sm truncate">{activity.name}</h3>
            <div className="text-gray-400 text-[11px] flex items-center gap-1.5 mt-0.5">
              <span>{formatDate(activity.startedAt)}</span>
              {location && (
                <>
                  <span className="text-gray-300">&middot;</span>
                  <span>{location}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 bg-orange-50 text-[#FC4C02] text-[9px] font-black px-2 py-1 rounded-full border border-orange-200 shrink-0 ml-2">
            <StravaLogo size={10} />
            {activity.sportType}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100">
          <div>
            <div className="text-gray-400 text-[9px] font-black tracking-widest">DISTANCE</div>
            <div className="text-[#000c34] font-black text-base">{formatDistance(activity.distance)} km</div>
          </div>
          <div>
            <div className="text-gray-400 text-[9px] font-black tracking-widest">DENIVELE</div>
            <div className="text-[#000c34] font-black text-base">+{Math.round(activity.totalElevationGain)} m</div>
          </div>
          <div>
            <div className="text-gray-400 text-[9px] font-black tracking-widest">TEMPS</div>
            <div className="text-[#000c34] font-black text-base">{formatTime(activity.movingTime)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-[9px] font-black tracking-widest">VITESSE</div>
            <div className="text-[#000c34] font-black text-base">{formatSpeed(activity.averageSpeed)} km/h</div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={onToggleShare}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              isShared
                ? "bg-green-50 text-green-600 border border-green-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                : "bg-[#27509b]/10 text-[#27509b] border border-[#27509b]/20 hover:bg-[#27509b]/20"
            }`}
          >
            {isShared ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Partagee au flux
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Partager au flux
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ activities }: { activities: SyncedActivity[] }) {
  const totalDistance = activities.reduce((s, a) => s + a.distance, 0);
  const totalElevation = activities.reduce((s, a) => s + a.totalElevationGain, 0);
  const totalTime = activities.reduce((s, a) => s + a.movingTime, 0);

  return (
    <div className="bg-[#000c34] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <StravaLogo size={20} />
        <h3 className="font-title text-white text-sm">Statistiques globales</h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: "Distance totale", value: `${formatDistance(totalDistance)} km`, color: "text-[#FC4C02]" },
          { label: "Denivele total", value: `${Math.round(totalElevation).toLocaleString("fr-FR")} m`, color: "text-emerald-400" },
          { label: "Temps total", value: formatTime(totalTime), color: "text-blue-400" },
          { label: "Sorties", value: `${activities.length}`, color: "text-[#fce500]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 rounded-xl p-3">
            <div className={`text-lg font-black ${color}`}>{value}</div>
            <div className="text-white/40 text-[10px] mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ isConnected, onConnect, onSync, syncing }: {
  isConnected: boolean;
  onConnect: () => void;
  onSync: () => void;
  syncing: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-[#FC4C02]/10 rounded-full flex items-center justify-center mb-5">
        <svg className="w-10 h-10" viewBox="0 0 80 80" fill="none">
          <circle cx="25" cy="55" r="16" stroke="#FC4C02" strokeWidth="3" />
          <circle cx="55" cy="55" r="16" stroke="#FC4C02" strokeWidth="3" />
          <path d="M25 55 L35 25 L45 45 L55 25 L55 55" stroke="#FC4C02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="25" cy="55" r="3" fill="#FC4C02" />
          <circle cx="55" cy="55" r="3" fill="#FC4C02" />
        </svg>
      </div>
      {isConnected ? (
        <>
          <h3 className="font-title text-[#000c34] text-xl mb-2">Aucune activite synchronisee</h3>
          <p className="text-gray-400 text-sm max-w-xs mb-5">
            Cliquez sur synchroniser pour importer vos sorties velo depuis Strava.
          </p>
          <button
            onClick={onSync}
            disabled={syncing}
            className="bg-[#fce500] text-[#000c34] rounded-xl px-6 py-3.5 text-sm font-black hover:bg-yellow-300 transition-colors inline-flex items-center gap-2 min-h-[48px] disabled:opacity-60"
          >
            {syncing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Synchronisation...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Synchroniser mes sorties
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <h3 className="font-title text-[#000c34] text-xl mb-2">Connectez Strava</h3>
          <p className="text-gray-400 text-sm max-w-xs mb-5">
            Liez votre compte Strava pour voir toutes vos sorties velo ici.
          </p>
          <button
            onClick={onConnect}
            className="bg-[#FC4C02] text-white rounded-xl px-6 py-3.5 text-sm font-black hover:bg-orange-600 transition-colors inline-flex items-center gap-2 min-h-[48px]"
          >
            <StravaLogo size={20} />
            Se connecter avec Strava
          </button>
        </>
      )}
    </div>
  );
}

export default function ActivitiesTab() {
  const { user } = useAuth();
  const { isConnected, connect, syncActivities, activities, lastSync, syncing, sharedActivityIds, shareActivity, unshareActivity } = useStrava();
  const router = useRouter();

  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = useCallback(async () => {
    setSyncError(null);
    try {
      await syncActivities();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Erreur de synchronisation");
    }
  }, [syncActivities]);

  const handleConnect = useCallback(async () => {
    if (!user) { router.push("/login"); return; }
    try { await connect(); } catch { /* redirect happens */ }
  }, [user, connect, router]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: activities list */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-title text-[#000c34] text-xl flex items-center gap-2">
            <StravaLogo size={22} />
            Mes Activites
            {activities.length > 0 && (
              <span className="bg-[#FC4C02] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                {activities.length}
              </span>
            )}
          </h2>
          {isConnected && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 text-[#FC4C02] text-xs font-bold hover:underline disabled:opacity-50"
            >
              {syncing ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {syncing ? "Sync..." : "Synchroniser"}
            </button>
          )}
        </div>

        {/* Error */}
        {syncError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
            {syncError}
          </div>
        )}

        {/* Content */}
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((a, i) => (
              <ActivityCard
                key={a.id}
                activity={a}
                index={i}
                isShared={sharedActivityIds.includes(a.activityId)}
                onToggleShare={() => {
                  if (sharedActivityIds.includes(a.activityId)) {
                    unshareActivity(a.activityId);
                  } else {
                    shareActivity(a.activityId);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            isConnected={isConnected}
            onConnect={handleConnect}
            onSync={handleSync}
            syncing={syncing}
          />
        )}
      </div>

      {/* Right sidebar */}
      <div className="space-y-6">
        {activities.length > 0 && <StatsCard activities={activities} />}

        {lastSync && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="font-black text-[#000c34] text-xs">Derniere synchronisation</div>
              <div className="text-gray-400 text-[11px]">{lastSync}</div>
            </div>
          </div>
        )}

        {!lastSync && isConnected && (
          <div className="bg-[#FC4C02]/5 border border-[#FC4C02]/15 rounded-2xl p-5">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FC4C02]/10 flex items-center justify-center shrink-0">
                <StravaLogo size={20} />
              </div>
              <div>
                <div className="font-black text-[#000c34] text-sm">Pret a synchroniser</div>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                  Cliquez sur &ldquo;Synchroniser&rdquo; pour importer vos dernieres sorties depuis Strava.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
