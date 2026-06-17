"use client";

import { useState } from "react";
import type { Tab } from "../page";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const NAV_ITEMS: { id: Tab; label: string }[] = [
  { id: "blog", label: "Blog" },
  { id: "challenge", label: "Challenge" },
  { id: "monvelo", label: "Mon Vélo" },
];

function MichelinLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-[#27509b] rounded-lg flex items-center justify-center shrink-0">
        <svg viewBox="0 0 36 36" className="w-8 h-8">
          <ellipse cx="18" cy="10" rx="7" ry="7" fill="white" />
          <ellipse cx="18" cy="22" rx="10" ry="7" fill="white" />
          <ellipse cx="18" cy="31" rx="12" ry="6" fill="white" />
          <circle cx="15" cy="8.5" r="1.8" fill="#27509b" />
          <circle cx="21" cy="8.5" r="1.8" fill="#27509b" />
          <path d="M14.5 13.5 Q18 16 21.5 13.5" stroke="#27509b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div className="font-title text-[#27509b] text-[13px] tracking-[0.08em] leading-none">MICHELIN</div>
        <div className="text-[#27509b]/60 text-[10px] font-semibold tracking-widest leading-none mt-0.5">VÉLO HUB</div>
      </div>
    </div>
  );
}

export default function Header({ activeTab, onTabChange }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNav = (tab: Tab) => {
    onTabChange(tab);
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMenuOpen(false);
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-[0_1px_12px_rgba(0,12,52,0.08)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* Left: Logo */}
          <button onClick={() => handleNav("blog")} className="shrink-0">
            <MichelinLogo />
          </button>

          {/* Center: Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`relative px-5 py-2.5 text-sm font-bold transition-colors rounded-lg ${
                  activeTab === id
                    ? "text-[#27509b]"
                    : "text-[#53565a] hover:text-[#27509b] hover:bg-[#27509b]/5"
                }`}
              >
                {label}
                {/* Lock hint on Mon Vélo when not logged in */}
                {id === "monvelo" && !user && (
                  <svg className="inline-block ml-1 w-3 h-3 text-gray-300 -mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                )}
                {activeTab === id && (
                  <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-[#fce500] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Right: auth zone */}
          <div className="flex items-center gap-2">

            {user ? (
              /* ── Logged in: user avatar + dropdown ── */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#27509b] flex items-center justify-center text-white text-xs font-black shrink-0">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-[#000c34] max-w-[120px] truncate">
                    {user.firstName}
                  </span>
                  <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="font-semibold text-[#000c34] text-sm">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5 truncate">@{user.username}</div>
                        <div className="mt-1.5 flex gap-1">
                          {user.roles.map(r => (
                            <span key={r} className="inline-block bg-[#27509b]/10 text-[#27509b] text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => { handleNav("monvelo"); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#000c34] hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <svg className="w-4 h-4 fill-[#27509b]" viewBox="0 0 24 24">
                          <path d="M12 3C6.48 3 2 6.48 2 12s4.48 9 10 9 10-4.03 10-9-4.48-9-10-9zm0 2c3.87 0 7.19 2.45 8.51 5.92H3.49C4.81 7.45 8.13 5 12 5zm0 14c-4.41 0-8-3.59-8-8 0-.34.02-.67.05-1h15.9c.03.33.05.66.05 1 0 4.41-3.59 8-8 8z" />
                        </svg>
                        Mon Vélo
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Se déconnecter
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ── Not logged in: login + signup buttons ── */
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-[#27509b] hover:bg-[#27509b]/5 rounded-xl transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-black text-[#000c34] bg-[#fce500] hover:bg-yellow-300 rounded-xl transition-colors"
                >
                  S&apos;inscrire
                </Link>
              </div>
            )}

            {/* Hamburger – mobile */}
            <button
              className="md:hidden p-2 text-[#27509b] hover:bg-[#27509b]/5 rounded-lg transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="max-w-[1280px] mx-auto px-4 py-1">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`flex items-center gap-3 w-full py-3.5 border-b border-gray-100 text-sm font-semibold transition-colors ${
                  activeTab === id ? "text-[#27509b]" : "text-gray-500"
                }`}
              >
                <span className={`w-1 h-5 rounded-full shrink-0 ${activeTab === id ? "bg-[#fce500]" : "bg-transparent"}`} />
                {label}
                {id === "monvelo" && !user && (
                  <svg className="w-3.5 h-3.5 text-gray-300 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                )}
              </button>
            ))}

            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full py-3.5 text-sm font-semibold text-red-400"
              >
                <span className="w-1 h-5 rounded-full shrink-0 bg-transparent" />
                Se déconnecter ({user.firstName})
              </button>
            ) : (
              <div className="flex gap-2 py-3">
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-[#27509b] border border-[#27509b]/30 rounded-xl">
                  Se connecter
                </Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 text-sm font-black text-[#000c34] bg-[#fce500] rounded-xl">
                  S&apos;inscrire
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
