"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useStrava } from "../../context/StravaContext";
import { useRouter } from "next/navigation";

/* ─── Entity types ──────────────────────────────────────────────── */

type ObjectiveType = "DISTANCE" | "ELEVATION" | "FREQUENCY" | "DURATION";
type ChallengeStatus = "DRAFT" | "ACTIVE" | "FINISHED" | "ARCHIVED";
type ModalStep = "connect" | "connecting" | "sync" | "syncing" | "error" | "manage";

interface Activity {
  id: string;
  stravaActivityId: string;
  name: string;
  distance: number;
  movingTime: number;
  elevationGain: number;
  averageSpeed: number;
  sportType: string;
  startedAt: string;
  gradient: string;
}

interface FeedActivity {
  id: string;
  initials: string;
  avatarBg: string;
  name: string;
  when: string;
  title: string;
  desc: string;
  gradient: string;
  tireName?: string;
  stats: { label: string; value: string }[];
  fromStrava?: boolean;
}

/* ─── Mock data (demo — no activity-fetch endpoint yet) ─────────── */

const CHALLENGE = {
  id: 1,
  title: "Grand Tour Michelin 2024",
  slug: "grand-tour-michelin-2024",
  description: "Parcourez 1 000 km sur les routes francaises avant le 31 decembre.",
  objectiveType: "DISTANCE" as ObjectiveType,
  objectiveValue: 1000,
  startDate: "1 Oct. 2024",
  endDate: "31 Dec. 2024",
  status: "ACTIVE" as ChallengeStatus,
};

const MOCK_PARTICIPATION = {
  progress: 0.67,
  completed: false,
  rank: 142,
  joinedAt: "5 Oct. 2024",
};

const STRAVA_PENDING: Activity[] = [
  {
    id: "s1", stravaActivityId: "11234567890",
    name: "Tour du Viaduc de Millau", distance: 67.3,
    movingTime: 8100, elevationGain: 820, averageSpeed: 29.9,
    sportType: "Ride", startedAt: "Hier",
    gradient: "from-red-800 to-orange-600",
  },
  {
    id: "s2", stravaActivityId: "11234567891",
    name: "Montee du Ventoux", distance: 21.5,
    movingTime: 6300, elevationGain: 1617, averageSpeed: 12.3,
    sportType: "Ride", startedAt: "Il y a 3 jours",
    gradient: "from-indigo-900 to-blue-600",
  },
  {
    id: "s3", stravaActivityId: "11234567892",
    name: "Sortie matinale Bordeaux", distance: 42.1,
    movingTime: 5280, elevationGain: 210, averageSpeed: 28.7,
    sportType: "Ride", startedAt: "Il y a 5 jours",
    gradient: "from-amber-600 to-yellow-400",
  },
];

const INITIAL_FEED: FeedActivity[] = [
  {
    id: "c1", initials: "JD", avatarBg: "bg-[#27509b]",
    name: "Jean Dupont", when: "Il y a 2 heures · Paris, France",
    title: "Matinee Puissance sur les Quais",
    desc: "Test des nouveaux pneus Michelin Power Cup. Grip exceptionnel sur sol humide.",
    gradient: "bg-gradient-to-br from-gray-700 to-gray-900",
    tireName: "Michelin Power Cup",
    stats: [
      { label: "DISTANCE", value: "54.2 km" },
      { label: "DENIVELE", value: "450 m" },
      { label: "TEMPS", value: "1h 42m" },
    ],
  },
  {
    id: "c2", initials: "ML", avatarBg: "bg-purple-600",
    name: "Marie Lefebvre", when: "Hier · Annecy, France",
    title: "Tour du Lac - Record Personnel !",
    desc: "Equipee en Michelin Lithion 2, une confiance totale dans les virages.",
    gradient: "bg-gradient-to-br from-blue-600 via-teal-500 to-emerald-400",
    tireName: "Michelin Lithion 2",
    stats: [
      { label: "DISTANCE", value: "38.0 km" },
      { label: "DENIVELE", value: "120 m" },
      { label: "TEMPS", value: "1h 10m" },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────────────────── */

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

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

/* ─── Feed card ──────────────────────────────────────────────────── */
function FeedCard({ activity }: { activity: FeedActivity }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${activity.avatarBg}`}>
              {activity.fromStrava ? <StravaLogo size={20} /> : activity.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#000c34] text-sm">{activity.name}</span>
                {activity.fromStrava && (
                  <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-orange-200">
                    <StravaLogo size={8} /> Strava
                  </span>
                )}
              </div>
              <div className="text-gray-400 text-[11px]">{activity.when}</div>
            </div>
          </div>
        </div>

        <h3 className="font-title text-[#000c34] text-base">{activity.title}</h3>
        <p className="text-gray-400 text-xs mt-1 leading-relaxed">{activity.desc}</p>

        {activity.tireName && (
          <div className="mt-2 inline-flex items-center gap-1.5 border border-[#27509b]/30 rounded-lg px-2.5 py-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <ellipse cx="12" cy="12" rx="5" ry="10" fill="white" stroke="black" strokeWidth="1.5" />
              <ellipse cx="12" cy="12" rx="10" ry="5" fill="white" stroke="black" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2.5" fill="black" />
            </svg>
            <span className="text-[#27509b] text-[10px] font-bold">{activity.tireName}</span>
          </div>
        )}
      </div>

      <div className={`mx-4 rounded-xl h-36 ${activity.gradient}`} />

      <div className="px-4 pt-3 pb-4">
        <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-3">
          {activity.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-gray-400 text-[9px] font-black tracking-widest">{s.label}</div>
              <div className="text-[#000c34] font-black text-base">{s.value}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <button className="flex items-center gap-1.5 text-gray-400 text-sm font-medium hover:text-[#27509b] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905C11 8.102 9.5 9.5 7 10m7 0H7m0 0H5a2 2 0 00-2 2v6a2 2 0 002 2h2" />
            </svg>
            Kudo
          </button>
          <button className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-[#27509b] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            4
          </button>
          <button className="ml-auto bg-[#fce500] text-[#000c34] text-[11px] font-black px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors">
            Acheter ce pneu
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Strava Modal ───────────────────────────────────────────────── */
interface ModalProps {
  step: ModalStep;
  selected: Set<string>;
  lastSync: string | null;
  userInitials: string;
  userDisplayName: string;
  connectError: string | null;
  onClose: () => void;
  onConnect: () => void;
  onToggleActivity: (id: string) => void;
  onSync: () => void;
  onDisconnect: () => void;
  onManage: () => void;
}

function StravaModal({
  step, selected, lastSync, userInitials, userDisplayName, connectError,
  onClose, onConnect, onToggleActivity, onSync, onDisconnect, onManage,
}: ModalProps) {
  const selectedCount = selected.size;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-[#000c34]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* step: connect */}
        {step === "connect" && (
          <div className="p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#000c34] rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-8 h-8">
                  <ellipse cx="18" cy="10" rx="7" ry="7" fill="white" />
                  <ellipse cx="18" cy="22" rx="10" ry="7" fill="white" />
                  <ellipse cx="18" cy="31" rx="12" ry="6" fill="white" />
                </svg>
              </div>
              <div className="w-8 h-0.5 bg-gray-200 rounded-full" />
              <div className="w-12 h-12 bg-[#FC4C02] rounded-xl flex items-center justify-center">
                <StravaLogo size={30} />
              </div>
            </div>
            <h2 className="font-title text-[#000c34] text-2xl text-center">Connectez Strava</h2>
            <p className="text-gray-500 text-sm text-center mt-1 mb-5">
              Importez vos sorties et participez aux defis Michelin
            </p>
            <div className="space-y-3 mb-6">
              {[
                "Importez automatiquement vos activites velo",
                "Comparez vos performances avec la communaute",
                "Debloquez des defis et recompenses exclusifs",
              ].map((b) => (
                <div key={b} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#fce500] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="#000c34" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#000c34] text-sm">{b}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onConnect}
              className="w-full bg-[#FC4C02] text-white rounded-xl py-3.5 font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors min-h-[48px]"
            >
              <StravaLogo size={20} />
              Se connecter avec Strava
            </button>
            <p className="text-gray-400 text-[11px] text-center mt-3 leading-relaxed">
              Nous accedons uniquement a vos activites velo publiques.<br />
              Vous pouvez deconnecter a tout moment.
            </p>
          </div>
        )}

        {/* step: connecting */}
        {step === "connecting" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[260px]">
            <div className="w-16 h-16 bg-[#FC4C02]/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#FC4C02] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div className="font-title text-[#000c34] text-lg mb-1">Connexion en cours...</div>
            <p className="text-gray-400 text-sm text-center">Redirection vers Strava pour autorisation...</p>
          </div>
        )}

        {/* step: error */}
        {step === "error" && (
          <div className="p-6 text-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-14 h-14 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="font-title text-[#000c34] text-xl mb-2">Erreur de connexion</h2>
            <p className="text-red-500 text-sm mb-5">{connectError}</p>
            <button
              onClick={onConnect}
              className="w-full bg-[#FC4C02] text-white rounded-xl py-3.5 font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
            >
              <StravaLogo size={20} />
              Reessayer
            </button>
          </div>
        )}

        {/* step: manage — connected account overview */}
        {step === "manage" && (
          <div className="p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-5 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#FC4C02] flex items-center justify-center text-white text-xs font-black shrink-0">
                {userInitials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#000c34] text-sm">{userDisplayName}</span>
                  <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full">Connecte</span>
                </div>
                <div className="text-gray-400 text-[11px]">
                  {lastSync ? `Derniere sync : ${lastSync}` : "Pret a synchroniser"}
                </div>
              </div>
              <StravaLogo size={22} />
            </div>

            <h3 className="font-title text-[#000c34] text-lg mb-2">Compte Strava lie</h3>
            <p className="text-gray-400 text-xs mb-5">
              Votre compte Strava est connecte. Synchronisez vos sorties pour participer aux defis.
            </p>

            <button
              onClick={onManage}
              className="w-full bg-[#fce500] text-[#000c34] rounded-xl py-3.5 font-black text-sm hover:bg-yellow-300 transition-colors mb-2"
            >
              Synchroniser mes sorties
            </button>

            <button
              onClick={onDisconnect}
              className="w-full mt-1 text-gray-400 text-xs hover:text-red-500 transition-colors py-2"
            >
              Deconnecter Strava
            </button>
          </div>
        )}

        {/* step: sync */}
        {step === "sync" && (
          <div className="p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-5 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#FC4C02] flex items-center justify-center text-white text-xs font-black shrink-0">
                {userInitials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[#000c34] text-sm">{userDisplayName}</span>
                  <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full">Connecte</span>
                </div>
                <div className="text-gray-400 text-[11px]">
                  {lastSync ? `Derniere sync : ${lastSync}` : "Pret a synchroniser"}
                </div>
              </div>
              <StravaLogo size={22} />
            </div>

            <h3 className="font-title text-[#000c34] text-lg mb-1">Sorties recentes a importer</h3>
            <p className="text-gray-400 text-xs mb-4">
              Selectionnez les activites a ajouter au defi
            </p>

            <div className="space-y-2 mb-5">
              {STRAVA_PENDING.map((a) => (
                <label
                  key={a.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selected.has(a.id)
                      ? "border-[#FC4C02] bg-orange-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => onToggleActivity(a.id)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected.has(a.id) ? "border-[#FC4C02] bg-[#FC4C02]" : "border-gray-300"
                  }`}>
                    {selected.has(a.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-[#000c34] text-sm truncate">{a.name}</div>
                    <div className="text-gray-400 text-[11px] flex items-center gap-2 mt-0.5">
                      <span>{a.distance} km</span>
                      <span className="text-gray-300">&middot;</span>
                      <span>+{a.elevationGain} m</span>
                      <span className="text-gray-300">&middot;</span>
                      <span>{formatTime(a.movingTime)}</span>
                      <span className="text-gray-300">&middot;</span>
                      <span>{a.averageSpeed} km/h moy.</span>
                    </div>
                  </div>
                  <span className="text-gray-300 text-[10px] shrink-0">{a.startedAt}</span>
                </label>
              ))}
            </div>

            <button
              onClick={onSync}
              disabled={selectedCount === 0}
              className={`w-full rounded-xl py-3.5 font-black text-sm transition-colors min-h-[48px] ${
                selectedCount > 0
                  ? "bg-[#fce500] text-[#000c34] hover:bg-yellow-300"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {selectedCount > 0
                ? `Synchroniser ${selectedCount} sortie${selectedCount > 1 ? "s" : ""}`
                : "Selectionnez au moins une sortie"}
            </button>

            <button
              onClick={onDisconnect}
              className="w-full mt-2 text-gray-400 text-xs hover:text-red-500 transition-colors py-2"
            >
              Deconnecter Strava
            </button>
          </div>
        )}

        {/* step: syncing */}
        {step === "syncing" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[260px]">
            <div className="w-16 h-16 bg-[#fce500]/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#000c34] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div className="font-title text-[#000c34] text-lg mb-1">Synchronisation...</div>
            <p className="text-gray-400 text-sm text-center">
              Import de {selectedCount} sortie{selectedCount > 1 ? "s" : ""} depuis Strava
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────── */
function SyncSuccessToast({ count, onDone }: { count: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#000c34] text-white px-5 py-3.5 rounded-2xl shadow-2xl">
      <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="font-semibold text-sm">
        {count} sortie{count > 1 ? "s" : ""} Strava importee{count > 1 ? "s" : ""} avec succes !
      </span>
      <StravaLogo size={18} />
    </div>
  );
}

/* ─── Disconnect confirm ─────────────────────────────────────────── */
function DisconnectConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#000c34]/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#FC4C02] rounded-xl flex items-center justify-center shrink-0">
            <StravaLogo size={24} />
          </div>
          <h3 className="font-title text-[#000c34] text-xl">Deconnecter Strava ?</h3>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Votre compte Strava sera delie. Vous ne pourrez plus synchroniser vos sorties. Vos activites deja importees seront conservees.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-3 text-sm font-black text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">
            Deconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────── */
export default function StravaSection() {
  const { user } = useAuth();
  const { isConnected, loading: stravaLoading, error: stravaError, connect, disconnect, clearError } = useStrava();
  const router = useRouter();

  const [isParticipating, setIsParticipating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("connect");
  const [selected, setSelected] = useState<Set<string>>(new Set(STRAVA_PENDING.map((a) => a.id)));
  const [feedActivities, setFeedActivities] = useState<FeedActivity[]>(INITIAL_FEED);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());
  const [toastCount, setToastCount] = useState<number | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "??";
  const userDisplayName = user
    ? `${user.firstName} ${user.lastName.charAt(0)}.`
    : "Utilisateur";

  const handleOpenModal = useCallback(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    clearError();
    if (isConnected) {
      setModalStep("manage");
    } else {
      setModalStep("connect");
    }
    setModalOpen(true);
  }, [user, isConnected, router, clearError]);

  const handleConnect = useCallback(async () => {
    setModalStep("connecting");
    try {
      await connect();
    } catch (err) {
      setModalStep("error");
    }
  }, [connect]);

  const handleToggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSync = useCallback(() => {
    const count = selected.size;
    setModalStep("syncing");

    setTimeout(() => {
      setLastSync("a l'instant");
      setIsParticipating(true);

      const newActivities: FeedActivity[] = STRAVA_PENDING.filter(
        (a) => selected.has(a.id) && !syncedIds.has(a.id)
      ).map((a) => ({
        id: a.id,
        initials: userInitials,
        avatarBg: "bg-[#FC4C02]",
        name: userDisplayName,
        when: `${a.startedAt} · Via Strava`,
        title: a.name,
        desc: `${a.sportType} · ${a.distance} km · +${a.elevationGain} m · ${a.averageSpeed} km/h moy.`,
        gradient: `bg-gradient-to-br ${a.gradient}`,
        stats: [
          { label: "DISTANCE", value: `${a.distance} km` },
          { label: "DENIVELE", value: `+${a.elevationGain} m` },
          { label: "TEMPS", value: formatTime(a.movingTime) },
        ],
        fromStrava: true,
      }));

      setSyncedIds((prev) => new Set([...prev, ...selected]));
      setFeedActivities((prev) => [...newActivities, ...prev]);
      setModalOpen(false);
      if (newActivities.length > 0) setToastCount(count);
    }, 1200);
  }, [selected, syncedIds, userInitials, userDisplayName]);

  const handleDisconnect = useCallback(() => {
    setShowDisconnectConfirm(true);
  }, []);

  const confirmDisconnect = useCallback(() => {
    disconnect();
    setIsParticipating(false);
    setLastSync(null);
    setSyncedIds(new Set());
    setSelected(new Set(STRAVA_PENDING.map((a) => a.id)));
    setFeedActivities(INITIAL_FEED);
    setModalOpen(false);
    setShowDisconnectConfirm(false);
  }, [disconnect]);

  const progressKm = Math.round(CHALLENGE.objectiveValue * MOCK_PARTICIPATION.progress);

  return (
    <>
      {/* ── Challenge hero ── */}
      <div className="rounded-2xl overflow-hidden relative bg-[#000c34] min-h-[240px] md:min-h-[320px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#000c34] via-[#0d1a5a] to-[#000c34]" />
        <div className="absolute right-0 bottom-0 w-56 h-56 md:w-80 md:h-80 opacity-15">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <ellipse cx="130" cy="22" rx="16" ry="10" fill="white" />
            <circle cx="130" cy="30" r="12" fill="white" />
            <path d="M115 48 L95 108 L60 158 M115 48 L145 98 L165 158 M95 108 L145 98"
              strokeWidth="10" stroke="white" fill="none" strokeLinecap="round" />
            <circle cx="60" cy="158" r="22" strokeWidth="8" stroke="white" fill="none" />
            <circle cx="165" cy="158" r="22" strokeWidth="8" stroke="white" fill="none" />
          </svg>
        </div>

        <div className="relative z-10 p-6 md:p-12 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block bg-[#fce500] text-[#000c34] text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest">
              {CHALLENGE.status}
            </span>
            <span className="text-white/50 text-[10px] font-semibold tracking-widest">
              {CHALLENGE.objectiveType} &middot; {CHALLENGE.objectiveValue.toLocaleString("fr-FR")} km
            </span>
          </div>

          <h2 className="font-title text-white text-3xl md:text-4xl leading-tight">
            {CHALLENGE.title}
          </h2>
          <p className="text-white/60 text-sm mt-2">
            {CHALLENGE.startDate} — {CHALLENGE.endDate}
          </p>

          {isParticipating && (
            <div className="mt-4 bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white text-xs font-semibold">Ma progression</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#fce500] font-black text-sm">
                    {progressKm} / {CHALLENGE.objectiveValue} km
                  </span>
                  <span className="text-white/50 text-xs">
                    Rang #{MOCK_PARTICIPATION.rank}
                  </span>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-[#fce500] h-2 rounded-full transition-all"
                  style={{ width: `${MOCK_PARTICIPATION.progress * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-white/40 text-[10px] mt-1">
                <span>Rejoint le {MOCK_PARTICIPATION.joinedAt}</span>
                <span>{Math.round(MOCK_PARTICIPATION.progress * 100)}% complete</span>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenModal}
              className="bg-[#fce500] text-[#000c34] rounded-xl px-6 py-3.5 text-sm font-black hover:bg-yellow-300 transition-colors inline-flex items-center gap-2 min-h-[48px]"
            >
              {isParticipating ? "Synchroniser mes sorties" : "Relevez le Defi"}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {stravaLoading ? (
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/50 text-xs font-semibold px-4 py-3 rounded-xl border border-white/10">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Chargement Strava...
              </div>
            ) : isConnected ? (
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-3 rounded-xl transition-colors border border-white/20"
              >
                <StravaLogo size={14} />
                Strava connecte
                <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/70 text-xs font-semibold px-4 py-3 rounded-xl transition-colors border border-white/10"
              >
                <StravaLogo size={14} />
                Connecter Strava
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Activity feed ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-title text-[#000c34] text-xl flex items-center gap-2">
            Flux d&apos;activites
          </h2>
          {isConnected && (
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1.5 text-[#FC4C02] text-xs font-bold hover:underline"
            >
              <StravaLogo size={14} />
              Synchroniser
            </button>
          )}
        </div>

        <div className="space-y-4">
          {feedActivities.map((a) => (
            <FeedCard key={a.id} activity={a} />
          ))}
        </div>
      </div>

      {/* Strava Modal */}
      {modalOpen && (
        <StravaModal
          step={modalStep}
          selected={selected}
          lastSync={lastSync}
          userInitials={userInitials}
          userDisplayName={userDisplayName}
          connectError={stravaError}
          onClose={() => setModalOpen(false)}
          onConnect={handleConnect}
          onToggleActivity={handleToggle}
          onSync={handleSync}
          onDisconnect={handleDisconnect}
          onManage={() => setModalStep("sync")}
        />
      )}

      {/* Disconnect confirm */}
      {showDisconnectConfirm && (
        <DisconnectConfirm
          onConfirm={confirmDisconnect}
          onCancel={() => setShowDisconnectConfirm(false)}
        />
      )}

      {/* Toast */}
      {toastCount !== null && (
        <SyncSuccessToast count={toastCount} onDone={() => setToastCount(null)} />
      )}
    </>
  );
}
