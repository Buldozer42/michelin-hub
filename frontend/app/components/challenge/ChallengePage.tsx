"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import StravaSection from "./StravaSection";
import ActivitiesTab from "./ActivitiesTab";
import {
  getChallenges,
  getMyParticipations,
  participateChallenge,
  getChallengeActivities,
  type ApiChallenge,
  type ApiParticipation,
  type ChallengeActivity,
} from "../../lib/api";

/* ── Icons ──────────────────────────────────────────────────────── */

function TrophyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function FeedIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

function BikeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

/* ── Tab config ──────────────────────────────────────────────────── */

const TABS = [
  { id: "defis" as const, label: "Defis", Icon: TrophyIcon, locked: false },
  { id: "feed" as const, label: "Fil d'activite", Icon: FeedIcon, locked: false },
  { id: "courses" as const, label: "Mes courses", Icon: BikeIcon, locked: true },
];

type TabId = (typeof TABS)[number]["id"];

/* ── Helpers ─────────────────────────────────────────────────────── */

const OBJ_LABELS: Record<string, string> = { distance: "km", elevation: "m D+", frenquency: "sorties", duration: "min" };
const OBJ_ICONS: Record<string, string> = { distance: "🛣️", elevation: "⛰️", frenquency: "📅", duration: "⏱️" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function daysLeft(endDate: string) {
  const d = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (d < 0) return null;
  if (d === 0) return "Dernier jour !";
  return `${d}j restants`;
}

type ChallengeStatusType = "active" | "upcoming" | "ended";

function challengeStatusType(c: ApiChallenge): ChallengeStatusType {
  const now = Date.now();
  if (now < new Date(c.startDate).getTime()) return "upcoming";
  if (now > new Date(c.endDate).getTime()) return "ended";
  return "active";
}

function statusBadge(s: ChallengeStatusType) {
  if (s === "active") return { label: "EN COURS", cls: "bg-green-500 text-white" };
  if (s === "upcoming") return { label: "A VENIR", cls: "bg-blue-500 text-white" };
  return { label: "TERMINE", cls: "bg-gray-300 text-gray-600" };
}

function fmtDist(m: number) { return (m / 1000).toFixed(1); }
function fmtTime(s: number) { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m}min`; }
function fmtSpeed(ms: number) { return (ms * 3.6).toFixed(1); }
function fmtActivityDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

/* ── Progress Ring ───────────────────────────────────────────────── */

function ProgressRing({ pct, size = 56, stroke = 4, color = "#27509b", bg = "#e5e7eb", children }: {
  pct: number; size?: number; stroke?: number; color?: string; bg?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ── Challenge Detail View ───────────────────────────────────────── */

function ChallengeDetail({ challenge, part, onBack, onJoin, joining }: {
  challenge: ApiChallenge; part?: ApiParticipation; onBack: () => void;
  onJoin: (id: number) => void; joining: number | null;
}) {
  const { token } = useAuth();
  const [activities, setActivities] = useState<ChallengeActivity[]>([]);
  const [loadingActs, setLoadingActs] = useState(false);
  const pct = part ? Math.min(part.progress, 100) : 0;
  const status = challengeStatusType(challenge);
  const badge = statusBadge(status);
  const dl = daysLeft(challenge.endDate);

  useEffect(() => {
    if (!token || !part) return;
    setLoadingActs(true);
    getChallengeActivities(challenge.id, token)
      .then(setActivities)
      .catch(() => {})
      .finally(() => setLoadingActs(false));
  }, [challenge.id, token, part]);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#27509b] hover:underline">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        Tous les defis
      </button>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-[#000c34]">
        {challenge.reward?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={challenge.reward.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#000c34] via-[#000c34]/85 to-[#000c34]/40" />

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Left */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                {dl && <span className="text-[#fce500] text-xs font-bold">{dl}</span>}
              </div>
              <h2 className="font-title text-white text-2xl md:text-3xl leading-tight">{challenge.title}</h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-lg">{challenge.description}</p>
              <div className="text-white/30 text-xs">{fmtDate(challenge.startDate)} — {fmtDate(challenge.endDate)}</div>
            </div>

            {/* Right: ring */}
            {part && (
              <div className="shrink-0 flex flex-col items-center gap-2">
                <ProgressRing pct={pct} size={130} stroke={8}
                  color={part.completed ? "#22c55e" : "#fce500"}
                  bg="rgba(255,255,255,0.08)"
                >
                  <div className="text-center">
                    <div className="text-white font-black text-3xl leading-none">{Math.round(pct)}%</div>
                    <div className="text-white/40 text-[9px] font-bold mt-1">
                      {part.completed ? "TERMINE" : "EN COURS"}
                    </div>
                  </div>
                </ProgressRing>
              </div>
            )}
          </div>

          {/* Objectives row */}
          <div className="flex flex-wrap gap-3 mt-6">
            {challenge.objectives.map((obj) => (
              <div key={obj.id} className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-xl">{OBJ_ICONS[obj.type] ?? "🎯"}</span>
                <div>
                  <div className="text-white font-black text-lg leading-none">{obj.value.toLocaleString("fr-FR")}</div>
                  <div className="text-white/40 text-[10px] font-semibold">{OBJ_LABELS[obj.type] ?? ""}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Reward + CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6">
            {challenge.reward && (
              <div className="flex items-center gap-3 bg-[#fce500]/10 border border-[#fce500]/20 rounded-2xl px-5 py-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#fce500] flex items-center justify-center shrink-0">
                  <span className="text-xl">🏆</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[#fce500] text-[10px] font-black uppercase tracking-widest">Recompense</div>
                  <div className="text-white text-sm font-bold truncate">{challenge.reward.name}</div>
                  {challenge.reward.description && <div className="text-white/40 text-[10px] truncate">{challenge.reward.description}</div>}
                </div>
              </div>
            )}

            {!part && status !== "ended" && (
              <button
                onClick={() => onJoin(challenge.id)}
                disabled={joining === challenge.id}
                className="inline-flex items-center gap-2 bg-[#fce500] text-[#000c34] rounded-xl px-8 py-4 text-sm font-black hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20 shrink-0"
              >
                {joining === challenge.id ? (
                  <span className="w-4 h-4 border-2 border-[#000c34] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <TrophyIcon className="w-5 h-5" />
                )}
                Relever ce defi
              </button>
            )}
            {part?.completed && (
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl px-5 py-3 text-sm font-black shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Defi remporte !
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Activities list ────────────────────────────────────── */}
      {part && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-[#000c34] text-base flex items-center gap-2">
              <svg className="w-4 h-4 text-[#27509b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Activites comptabilisees
              {activities.length > 0 && (
                <span className="bg-[#27509b] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{activities.length}</span>
              )}
            </h3>
            {activities.length > 0 && (
              <div className="text-xs text-gray-400">
                {fmtDist(activities.reduce((s, a) => s + a.distance, 0))} km total
              </div>
            )}
          </div>

          {loadingActs ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#27509b] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                <BikeIcon className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm font-semibold">Aucune activite pour ce defi</p>
              <p className="text-gray-300 text-xs mt-1">Synchronisez vos sorties Strava pour voir votre progression ici.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((a, i) => (
                <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
                  <div className="flex items-center gap-4">
                    {/* Number */}
                    <div className="w-8 h-8 rounded-lg bg-[#27509b]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#27509b] text-xs font-black">{i + 1}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#000c34] text-sm truncate">{a.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span>{fmtActivityDate(a.startedAt)}</span>
                        {a.locationCity && (
                          <>
                            <span className="text-gray-200">&middot;</span>
                            <span>{a.locationCity}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-[#000c34] font-black text-sm">{fmtDist(a.distance)} km</div>
                        <div className="text-gray-300 text-[9px] font-bold">DISTANCE</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#000c34] font-black text-sm">+{Math.round(a.totalElevationGain)} m</div>
                        <div className="text-gray-300 text-[9px] font-bold">D+</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#000c34] font-black text-sm">{fmtTime(a.movingTime)}</div>
                        <div className="text-gray-300 text-[9px] font-bold">TEMPS</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#000c34] font-black text-sm">{fmtSpeed(a.averageSpeed)}</div>
                        <div className="text-gray-300 text-[9px] font-bold">KM/H</div>
                      </div>
                    </div>

                    {/* Mobile stats */}
                    <div className="flex sm:hidden items-center gap-2 shrink-0 text-[10px] text-gray-500 font-bold">
                      <span>{fmtDist(a.distance)}km</span>
                      <span className="text-gray-200">&middot;</span>
                      <span>{fmtTime(a.movingTime)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary bar */}
              <div className="bg-[#000c34] rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 mt-2">
                <div className="text-white text-xs font-bold">Total sur ce defi</div>
                <div className="flex items-center gap-5">
                  <div className="text-center">
                    <div className="text-[#fce500] font-black text-sm">{fmtDist(activities.reduce((s, a) => s + a.distance, 0))} km</div>
                    <div className="text-white/30 text-[9px] font-bold">DISTANCE</div>
                  </div>
                  <div className="text-center">
                    <div className="text-emerald-400 font-black text-sm">+{Math.round(activities.reduce((s, a) => s + a.totalElevationGain, 0)).toLocaleString("fr-FR")} m</div>
                    <div className="text-white/30 text-[9px] font-bold">DENIVELE</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-black text-sm">{fmtTime(activities.reduce((s, a) => s + a.movingTime, 0))}</div>
                    <div className="text-white/30 text-[9px] font-bold">TEMPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-black text-sm">{activities.length}</div>
                    <div className="text-white/30 text-[9px] font-bold">SORTIES</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Skill Tree Node ──────────────────────────────────────────────── */

type NodeState = "completed" | "active" | "locked";

function SkillTreeNode({ c, state, part, onClick }: {
  c: ApiChallenge; state: NodeState; part?: ApiParticipation; onClick: () => void;
}) {
  const pct = part ? Math.min(part.progress, 100) : 0;

  const ringColor = state === "completed" ? "#22c55e" : state === "active" ? "#fce500" : "#374151";
  const ringBg = state === "locked" ? "#1e293b" : "rgba(255,255,255,0.08)";

  return (
    <button
      onClick={onClick}
      disabled={state === "locked"}
      className={`group relative flex flex-col items-center transition-all duration-300 ${
        state === "locked" ? "opacity-40 cursor-not-allowed" : "hover:scale-105 active:scale-95 cursor-pointer"
      }`}
    >
      {/* Glow effect */}
      {state === "active" && (
        <div className="absolute -inset-4 bg-[#fce500]/15 rounded-3xl blur-2xl animate-pulse" />
      )}
      {state === "completed" && (
        <div className="absolute -inset-4 bg-green-500/15 rounded-3xl blur-2xl" />
      )}

      {/* Node circle */}
      <div className="relative z-10">
        <ProgressRing
          pct={state === "completed" ? 100 : state === "active" ? pct : 0}
          size={84} stroke={5} color={ringColor} bg={ringBg}
        >
          <div className={`w-[66px] h-[66px] rounded-full flex items-center justify-center shadow-lg ${
            state === "completed" ? "bg-green-900/60 shadow-green-500/20" :
            state === "active" ? "bg-[#1a2d5a] shadow-[#27509b]/30" :
            "bg-[#111827] shadow-none"
          }`}>
            {state === "completed" ? (
              <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : state === "locked" ? (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <span className="text-2xl">{OBJ_ICONS[c.objectives[0]?.type] ?? "🎯"}</span>
            )}
          </div>
        </ProgressRing>

        {/* Pct badge */}
        {state === "active" && part && !part.completed && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#fce500] text-[#000c34] text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-md shadow-yellow-500/30">
            {Math.round(pct)}%
          </div>
        )}
      </div>

      {/* Label card */}
      <div className={`mt-3 w-48 rounded-2xl p-3.5 text-center transition-all ${
        state === "completed" ? "bg-green-900/30 border-2 border-green-500/30 shadow-lg shadow-green-500/5" :
        state === "active" ? "bg-[#0f1f45] border-2 border-[#27509b]/40 shadow-lg shadow-[#27509b]/10 group-hover:border-[#fce500]/50 group-hover:shadow-yellow-500/10" :
        "bg-[#0a0f1f] border border-gray-700/40"
      }`}>
        <h4 className={`font-black text-sm leading-tight ${
          state === "locked" ? "text-gray-500" :
          state === "completed" ? "text-green-300" :
          "text-white"
        }`}>
          {c.title}
        </h4>

        {/* Objectives mini */}
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          {c.objectives.slice(0, 2).map((obj) => (
            <span key={obj.id} className={`text-[10px] font-bold ${
              state === "locked" ? "text-gray-600" :
              state === "completed" ? "text-green-400/60" :
              "text-white/50"
            }`}>
              {OBJ_ICONS[obj.type]} {obj.value.toLocaleString("fr-FR")}
            </span>
          ))}
        </div>

        {/* Reward */}
        {c.reward && state !== "locked" && (
          <div className={`flex items-center justify-center gap-1 mt-2.5 pt-2.5 border-t ${
            state === "completed" ? "border-green-500/20" : "border-white/10"
          }`}>
            <span className="text-[10px]">🏆</span>
            <span className={`text-[10px] font-bold truncate ${
              state === "completed" ? "text-green-400" : "text-[#fce500]/80"
            }`}>
              {c.reward.name}
            </span>
          </div>
        )}

        {state === "locked" && (
          <div className="text-[9px] text-gray-600 font-semibold mt-2 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Defi precedent requis
          </div>
        )}
      </div>
    </button>
  );
}

/* ── Connector Line ──────────────────────────────────────────────── */

function TreeConnector({ fromState }: { fromState: NodeState }) {
  return (
    <div className="flex items-center justify-center h-12 relative">
      <div className={`w-0.5 h-full ${
        fromState === "completed" ? "bg-green-500/40" : "bg-white/10"
      }`} />
      {fromState === "completed" && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-500/60" />
      )}
    </div>
  );
}

function TreeFork({ fromState }: { fromState: NodeState }) {
  const color = fromState === "completed" ? "border-green-500/40" : "border-white/10";
  return (
    <div className="flex items-center justify-center h-10 relative w-full max-w-md mx-auto">
      <div className={`absolute top-0 left-1/2 w-0.5 h-1/2 ${fromState === "completed" ? "bg-green-500/40" : "bg-white/10"}`} />
      <div className={`absolute bottom-0 left-1/4 right-1/4 h-0 border-b-2 ${color}`} style={{ top: "50%" }} />
      <div className={`absolute left-1/4 w-0.5 h-1/2 ${fromState === "completed" ? "bg-green-500/40" : "bg-white/10"}`} style={{ top: "50%" }} />
      <div className={`absolute right-1/4 w-0.5 h-1/2 ${fromState === "completed" ? "bg-green-500/40" : "bg-white/10"}`} style={{ top: "50%" }} />
    </div>
  );
}

/* ── Défis Tab (Skill Tree) ──────────────────────────────────────── */

function DefisTab() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<ApiChallenge[]>([]);
  const [participations, setParticipations] = useState<ApiParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [selected, setSelected] = useState<ApiChallenge | null>(null);

  const load = useCallback(async () => {
    try {
      const challs = await getChallenges();
      setChallenges(challs);
      if (token) {
        const parts = await getMyParticipations(token);
        setParticipations(parts);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleJoin = async (challengeId: number) => {
    if (!user || !token) { router.push("/login"); return; }
    setJoining(challengeId);
    try {
      await participateChallenge(challengeId, token);
      const parts = await getMyParticipations(token);
      setParticipations(parts);
    } catch { /* ignore */ }
    setJoining(null);
  };

  const getPart = (cId: number) => participations.find((p) => p.challengeId === cId);

  const getNodeState = (c: ApiChallenge): NodeState => {
    const part = getPart(c.id);
    if (part?.completed) return "completed";
    if (c.prerequisiteId) {
      const prereqPart = getPart(c.prerequisiteId);
      if (!prereqPart?.completed) return "locked";
    }
    return "active";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-[#27509b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selected) {
    return (
      <ChallengeDetail
        challenge={selected}
        part={getPart(selected.id)}
        onBack={() => setSelected(null)}
        onJoin={handleJoin}
        joining={joining}
      />
    );
  }

  // Build tree tiers
  const roots = challenges.filter((c) => !c.prerequisiteId);
  const byPrereq = (pid: number) => challenges.filter((c) => c.prerequisiteId === pid);

  // Build tiers from roots
  type Tier = { items: ApiChallenge[]; fork?: boolean };
  const tiers: Tier[] = [];
  let currentLevel = roots;
  while (currentLevel.length > 0) {
    tiers.push({ items: currentLevel, fork: false });
    const nextLevel: ApiChallenge[] = [];
    for (const c of currentLevel) {
      nextLevel.push(...byPrereq(c.id));
    }
    if (nextLevel.length > currentLevel.length) {
      tiers[tiers.length - 1].fork = true;
    }
    currentLevel = nextLevel;
  }

  const completed = participations.filter((p) => p.completed).length;
  const total = challenges.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#000c34] text-white rounded-full pl-3 pr-5 py-2">
          <div className="w-8 h-8 rounded-full bg-[#fce500] flex items-center justify-center">
            <span className="text-[#000c34] text-sm font-black">{completed}</span>
          </div>
          <span className="text-sm font-bold">{completed}/{total} defis completes</span>
        </div>
        {/* Overall progress bar */}
        <div className="max-w-xs mx-auto">
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#27509b] via-[#fce500] to-green-500 transition-all duration-700"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Skill Tree */}
      <div className="relative bg-gradient-to-b from-[#020617] via-[#000c34] to-[#020617] rounded-3xl p-8 md:p-12 overflow-hidden border border-white/5">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }} />
        </div>
        {/* Vertical glow line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#27509b]/20 to-transparent" />

        <div className="relative z-10 flex flex-col items-center">
          {tiers.map((tier, tierIdx) => (
            <div key={tierIdx}>
              {/* Connector from previous tier */}
              {tierIdx > 0 && (
                tiers[tierIdx - 1].fork && tiers[tierIdx - 1].items.length === 1 ? (
                  <TreeFork fromState={getNodeState(tiers[tierIdx - 1].items[0])} />
                ) : (
                  <TreeConnector fromState={
                    tiers[tierIdx - 1].items.some((c) => getNodeState(c) === "completed") ? "completed" : "active"
                  } />
                )
              )}

              {/* Tier row */}
              <div className={`flex items-start justify-center gap-8 md:gap-16 ${
                tier.items.length > 1 ? "flex-row" : ""
              }`}>
                {tier.items.map((c) => (
                  <SkillTreeNode
                    key={c.id}
                    c={c}
                    state={getNodeState(c)}
                    part={getPart(c.id)}
                    onClick={() => {
                      if (getNodeState(c) !== "locked") setSelected(c);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Boss label for last tier */}
          {tiers.length > 0 && tiers[tiers.length - 1].items.length === 1 && (
            <div className="mt-2 text-center">
              <span className="inline-block bg-[#fce500]/10 border border-[#fce500]/20 text-[#fce500] text-[9px] font-black px-3 py-1 rounded-full tracking-widest">
                BOSS FINAL
              </span>
            </div>
          )}
        </div>
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <TrophyIcon className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">Aucun defi disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
}

/* ── Feed Tab ────────────────────────────────────────────────────── */

function FeedTab() {
  return <StravaSection />;
}

/* ── Locked Overlay ──────────────────────────────────────────────── */

function LockedOverlay() {
  const router = useRouter();
  return (
    <div className="relative">
      <div className="blur-sm opacity-30 pointer-events-none select-none" aria-hidden="true">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md">
                <div className="h-2 bg-gradient-to-r from-orange-500 to-red-600" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="space-y-1">
                        <div className="h-2 bg-gray-100 rounded w-full" />
                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200 p-10 max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#000c34] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#fce500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="font-title text-[#000c34] text-2xl mb-2">Contenu reserve</h3>
          <p className="text-[#53565a] text-sm leading-relaxed mb-6">
            Connectez-vous pour acceder a vos courses, suivre vos performances et participer aux defis.
          </p>
          <button onClick={() => router.push("/login")} className="w-full bg-[#fce500] text-[#000c34] rounded-xl py-4 text-sm font-black hover:bg-yellow-300 transition-colors mb-3">
            Se connecter
          </button>
          <button onClick={() => router.push("/signup")} className="w-full border-2 border-[#000c34] text-[#000c34] rounded-xl py-3.5 text-sm font-black hover:bg-[#000c34] hover:text-white transition-colors">
            Creer un compte
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function ChallengePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("defis");

  return (
    <div className="bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Pill tabs */}
        <div className="flex items-center gap-1 bg-[#f4f4f6] rounded-2xl p-1.5 mb-8 w-fit">
          {TABS.map((tab) => {
            const locked = tab.locked && !user;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-[#000c34] text-white shadow-lg"
                    : "text-[#53565a] hover:text-[#000c34]"
                }`}
              >
                <tab.Icon className="w-4 h-4" />
                {tab.label}
                {locked && (
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "defis" && <DefisTab />}
        {activeTab === "feed" && <FeedTab />}
        {activeTab === "courses" && (user ? <ActivitiesTab /> : <LockedOverlay />)}
      </div>
    </div>
  );
}
