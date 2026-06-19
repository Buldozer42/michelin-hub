"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useStrava } from "../../context/StravaContext";
import { useRouter } from "next/navigation";
import type { SyncedActivity } from "../../lib/api";

/* ─── Entity types ──────────────────────────────────────────────── */

type ObjectiveType = "DISTANCE" | "ELEVATION" | "FREQUENCY" | "DURATION";
type ChallengeStatus = "DRAFT" | "ACTIVE" | "FINISHED" | "ARCHIVED";
type ModalStep = "connect" | "connecting" | "sync" | "syncing" | "error" | "manage";

interface FeedActivity {
  id: string;
  initials: string;
  avatarBg: string;
  name: string;
  when: string;
  title: string;
  desc: string;
  image: string;
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

const INITIAL_FEED: FeedActivity[] = [
  {
    id: "c1", initials: "JD", avatarBg: "bg-[#27509b]",
    name: "Jean Dupont", when: "Il y a 2 heures · Paris, France",
    title: "Matinee Puissance sur les Quais",
    desc: "Test des nouveaux pneus Michelin Power Cup. Grip exceptionnel sur sol humide.",
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop&q=80",
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
    image: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&h=400&fit=crop&q=80",
    tireName: "Michelin Lithion 2",
    stats: [
      { label: "DISTANCE", value: "38.0 km" },
      { label: "DENIVELE", value: "120 m" },
      { label: "TEMPS", value: "1h 10m" },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────────────────── */

function formatDistance(m: number): string {
  return (m / 1000).toFixed(1) + " km";
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${min.toString().padStart(2, "0")}m` : `${min}m`;
}

function formatElevation(m: number): string {
  return Math.round(m) + " m";
}

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Hier";
  if (d < 7) return `Il y a ${d} jours`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const STRAVA_FEED_IMAGES = [
  "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop&q=80",
  "https://images.unsplash.com/photo-1571188654248-7a89013e5f26?w=800&h=400&fit=crop&q=80",
];

function syncedToFeed(
  a: SyncedActivity,
  userName: string,
  userInitials: string,
  index: number,
): FeedActivity {
  const loc = [a.locationCity, a.locationCountry].filter(Boolean).join(", ");
  return {
    id: `strava-${a.activityId}`,
    initials: userInitials,
    avatarBg: "bg-[#FC4C02]",
    name: userName,
    when: `${timeAgoShort(a.startedAt)}${loc ? ` · ${loc}` : ""}`,
    title: a.name,
    desc: `Activite ${a.sportType.toLowerCase()} importee depuis Strava.`,
    image: STRAVA_FEED_IMAGES[index % STRAVA_FEED_IMAGES.length],
    fromStrava: true,
    stats: [
      { label: "DISTANCE", value: formatDistance(a.distance) },
      { label: "DENIVELE", value: formatElevation(a.totalElevationGain) },
      { label: "TEMPS", value: formatDuration(a.movingTime) },
    ],
  };
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

/* ─── Feed interactions (localStorage) ─────────────────────────── */

const FEED_INTERACTIONS_KEY = "michelin_feed_interactions";

interface FeedComment {
  id: string;
  author: string;
  initials: string;
  content: string;
  createdAt: string;
}

interface FeedInteractions {
  [activityId: string]: {
    kudos: string[];
    comments: FeedComment[];
  };
}

function loadInteractions(): FeedInteractions {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(FEED_INTERACTIONS_KEY) || "{}"); } catch { return {}; }
}

function saveInteractions(data: FeedInteractions) {
  localStorage.setItem(FEED_INTERACTIONS_KEY, JSON.stringify(data));
}

/* ─── Feed card ──────────────────────────────────────────────────── */
function FeedCard({ activity, userName, userInitials, isLoggedIn, interactions, onToggleKudo, onAddComment, onDeleteComment }: {
  activity: FeedActivity;
  userName: string;
  userInitials: string;
  isLoggedIn: boolean;
  interactions: { kudos: string[]; comments: FeedComment[] };
  onToggleKudo: () => void;
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const hasKudoed = interactions.kudos.includes(userName);
  const kudoCount = interactions.kudos.length;
  const commentCount = interactions.comments.length;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText("");
  };

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

      <div className="mx-4 rounded-xl h-36 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
      </div>

      <div className="px-4 pt-3 pb-4">
        <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-3">
          {activity.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-gray-400 text-[9px] font-black tracking-widest">{s.label}</div>
              <div className="text-[#000c34] font-black text-base">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Kudo names */}
        {kudoCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2 mb-1">
            <svg className="w-3.5 h-3.5 text-[#27509b]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905C11 8.102 9.5 9.5 7 10m7 0H7m0 0H5a2 2 0 00-2 2v6a2 2 0 002 2h2" />
            </svg>
            <span className="text-gray-500 text-[11px]">
              {interactions.kudos.slice(0, 3).join(", ")}{kudoCount > 3 ? ` et ${kudoCount - 3} autre${kudoCount - 3 > 1 ? "s" : ""}` : ""}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={isLoggedIn ? onToggleKudo : undefined}
            className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
              hasKudoed
                ? "text-[#27509b] font-black"
                : isLoggedIn
                  ? "text-gray-400 hover:text-[#27509b]"
                  : "text-gray-300 cursor-default"
            }`}
            title={isLoggedIn ? (hasKudoed ? "Retirer le kudo" : "Donner un kudo") : "Connectez-vous pour kudoer"}
          >
            <svg className={`w-4 h-4 transition-transform ${hasKudoed ? "scale-110" : ""}`} fill={hasKudoed ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905C11 8.102 9.5 9.5 7 10m7 0H7m0 0H5a2 2 0 00-2 2v6a2 2 0 002 2h2" />
            </svg>
            {kudoCount > 0 ? kudoCount : "Kudo"}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              showComments ? "text-[#27509b] font-bold" : "text-gray-400 hover:text-[#27509b]"
            }`}
          >
            <svg className="w-4 h-4" fill={showComments ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {commentCount > 0 ? commentCount : "Commenter"}
          </button>
          {activity.tireName && (
            <button className="ml-auto bg-[#fce500] text-[#000c34] text-[11px] font-black px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors">
              Acheter ce pneu
            </button>
          )}
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {/* Comment list */}
            {interactions.comments.length > 0 && (
              <div className="space-y-2.5 mb-3">
                {interactions.comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-black shrink-0">
                      {c.initials}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#000c34] text-[11px]">{c.author}</span>
                        <span className="text-gray-400 text-[10px]">{timeAgoShort(c.createdAt)}</span>
                        {c.author === userName && (
                          <button
                            onClick={() => onDeleteComment(c.id)}
                            className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-xs leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            {isLoggedIn ? (
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#27509b] flex items-center justify-center text-white text-[10px] font-black shrink-0">
                  {userInitials}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ecrire un commentaire..."
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#27509b]/30 focus:border-[#27509b] bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-3 py-1.5 bg-[#27509b] text-white text-[11px] font-black rounded-lg hover:bg-[#1a3d7c] transition-colors disabled:opacity-40"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-400 text-[11px] text-center py-2">
                Connectez-vous pour commenter.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Strava Modal ───────────────────────────────────────────────── */
interface ModalProps {
  step: ModalStep;
  lastSync: string | null;
  userInitials: string;
  userDisplayName: string;
  connectError: string | null;
  onClose: () => void;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  onManage: () => void;
}

function StravaModal({
  step, lastSync, userInitials, userDisplayName, connectError,
  onClose, onConnect, onSync, onDisconnect, onManage,
}: ModalProps) {

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

        {/* step: sync — one-click full sync via /api/activity/sync */}
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

            <h3 className="font-title text-[#000c34] text-lg mb-1">Synchroniser vos activites</h3>
            <p className="text-gray-400 text-xs mb-5">
              Importez toutes vos sorties velo depuis Strava d&apos;un seul clic.
              Le backend recupere, deduplique et enregistre automatiquement vos activites.
            </p>

            <button
              onClick={onSync}
              className="w-full bg-[#fce500] text-[#000c34] rounded-xl py-3.5 font-black text-sm hover:bg-yellow-300 transition-colors min-h-[48px] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Synchroniser maintenant
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
              Import des activites depuis Strava en cours
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
  const { isConnected, loading: stravaLoading, error: stravaError, connect, syncActivities, disconnect, clearError, activities: stravaActivities, sharedActivityIds } = useStrava();
  const router = useRouter();

  const [isParticipating, setIsParticipating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("connect");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [toastCount, setToastCount] = useState<number | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "??";
  const userDisplayName = user
    ? `${user.firstName} ${user.lastName.charAt(0)}.`
    : "Utilisateur";

  const feedActivities = useMemo<FeedActivity[]>(() => {
    const sharedFeed = stravaActivities
      .filter((a) => sharedActivityIds.includes(a.activityId))
      .map((a, i) => syncedToFeed(a, userDisplayName, userInitials, i));
    return [...sharedFeed, ...INITIAL_FEED];
  }, [stravaActivities, sharedActivityIds, userDisplayName, userInitials]);

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

  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = useCallback(async () => {
    setModalStep("syncing");
    setSyncError(null);
    try {
      const result = await syncActivities();
      setLastSync("a l'instant");
      setIsParticipating(true);
      setModalOpen(false);
      if (result.synced > 0) {
        setToastCount(result.synced);
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Erreur lors de la synchronisation");
      setModalStep("error");
    }
  }, [syncActivities]);

  const handleDisconnect = useCallback(() => {
    setShowDisconnectConfirm(true);
  }, []);

  const confirmDisconnect = useCallback(async () => {
    await disconnect();
    setIsParticipating(false);
    setLastSync(null);
    setModalOpen(false);
    setShowDisconnectConfirm(false);
  }, [disconnect]);

  const [feedInteractions, setFeedInteractions] = useState<FeedInteractions>(loadInteractions);

  const handleToggleKudo = useCallback((activityId: string) => {
    setFeedInteractions((prev) => {
      const entry = prev[activityId] || { kudos: [], comments: [] };
      const hasKudo = entry.kudos.includes(userDisplayName);
      const updated: FeedInteractions = {
        ...prev,
        [activityId]: {
          ...entry,
          kudos: hasKudo
            ? entry.kudos.filter((n) => n !== userDisplayName)
            : [...entry.kudos, userDisplayName],
        },
      };
      saveInteractions(updated);
      return updated;
    });
  }, [userDisplayName]);

  const handleAddComment = useCallback((activityId: string, content: string) => {
    setFeedInteractions((prev) => {
      const entry = prev[activityId] || { kudos: [], comments: [] };
      const newComment: FeedComment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        author: userDisplayName,
        initials: userInitials,
        content,
        createdAt: new Date().toISOString(),
      };
      const updated: FeedInteractions = {
        ...prev,
        [activityId]: {
          ...entry,
          comments: [...entry.comments, newComment],
        },
      };
      saveInteractions(updated);
      return updated;
    });
  }, [userDisplayName, userInitials]);

  const handleDeleteComment = useCallback((activityId: string, commentId: string) => {
    setFeedInteractions((prev) => {
      const entry = prev[activityId] || { kudos: [], comments: [] };
      const updated: FeedInteractions = {
        ...prev,
        [activityId]: {
          ...entry,
          comments: entry.comments.filter((c) => c.id !== commentId),
        },
      };
      saveInteractions(updated);
      return updated;
    });
  }, []);

  const progressKm = Math.round(CHALLENGE.objectiveValue * MOCK_PARTICIPATION.progress);

  return (
    <>
      {/* ── Challenge hero ── */}
      <div className="rounded-2xl overflow-hidden relative bg-[#000c34] min-h-[240px] md:min-h-[320px]">
        <img
          src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1400&h=700&fit=crop&q=80"
          alt="Peloton de cyclistes sur route"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#000c34]/90 via-[#000c34]/60 to-[#000c34]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000c34]/70 via-transparent to-transparent" />

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
            <FeedCard
              key={a.id}
              activity={a}
              userName={userDisplayName}
              userInitials={userInitials}
              isLoggedIn={!!user}
              interactions={feedInteractions[a.id] || { kudos: [], comments: [] }}
              onToggleKudo={() => handleToggleKudo(a.id)}
              onAddComment={(content) => handleAddComment(a.id, content)}
              onDeleteComment={(commentId) => handleDeleteComment(a.id, commentId)}
            />
          ))}
        </div>
      </div>

      {/* Strava Modal */}
      {modalOpen && (
        <StravaModal
          step={modalStep}
          lastSync={lastSync}
          userInitials={userInitials}
          userDisplayName={userDisplayName}
          connectError={stravaError || syncError}
          onClose={() => setModalOpen(false)}
          onConnect={handleConnect}
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
