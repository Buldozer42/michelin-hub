"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/blog",        label: "Blog" },
  { href: "/challenge",   label: "Challenge" },
  { href: "/revendeurs",  label: "Revendeurs" },
  { href: "/velo",        label: "Mon Vélo",  protected: true },
] as const;

const ADMIN_NAV_ITEM = { href: "/edit", label: "Edition" } as const;

function MichelinLogo() {
  return (
    <div className="flex items-center gap-0 shrink-0 select-none">
      <div className="w-9 h-9 mr-2.5 shrink-0">
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <defs>
            <linearGradient id="tireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3468b2" />
              <stop offset="100%" stopColor="#1a3a78" />
            </linearGradient>
          </defs>
          {/* Outer tire */}
          <circle cx="24" cy="24" r="21" fill="url(#tireGrad)" />
          {/* Tread grooves */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 24 + 15 * Math.cos(rad);
            const y1 = 24 + 15 * Math.sin(rad);
            const x2 = 24 + 21 * Math.cos(rad);
            const y2 = 24 + 21 * Math.sin(rad);
            return (
              <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#27509b" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
            );
          })}
          {/* Inner rubber ring */}
          <circle cx="24" cy="24" r="14" fill="#000c34" />
          {/* Rim */}
          <circle cx="24" cy="24" r="11" fill="none" stroke="#27509b" strokeWidth="1.5" opacity="0.6" />
          {/* Spokes */}
          {[0, 72, 144, 216, 288].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x2 = 24 + 10.5 * Math.cos(rad);
            const y2 = 24 + 10.5 * Math.sin(rad);
            return (
              <line key={angle} x1="24" y1="24" x2={x2} y2={y2}
                stroke="#fce500" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            );
          })}
          {/* Hub */}
          <circle cx="24" cy="24" r="3.5" fill="#27509b" />
          <circle cx="24" cy="24" r="1.8" fill="#fce500" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-title text-[#000c34] text-[17px] tracking-[0.1em] leading-none">MICHELIN</span>
        <div className="h-[3px] bg-[#fce500] rounded-full mt-[3px]" />
        <span className="text-[#53565a] text-[9px] font-semibold tracking-[0.25em] mt-[3px] leading-none">VELO HUB</span>
      </div>
    </div>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isAdmin = user?.roles.includes("ROLE_ADMIN") ?? false;
  const visibleNavItems = isAdmin
    ? [...NAV_ITEMS.slice(0, 3), ADMIN_NAV_ITEM, NAV_ITEMS[3]]
    : NAV_ITEMS;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMenuOpen(false);
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-[0_1px_16px_rgba(0,12,52,0.06)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          <Link href="/blog" className="shrink-0" aria-label="Accueil Michelin Vélo Hub">
            <MichelinLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
            {visibleNavItems.map(({ href, label, ...rest }) => {
              const locked = "protected" in rest && rest.protected && !user;
              return (
                <Link
                  key={href}
                  href={locked ? "/login" : href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`relative px-5 py-2.5 text-sm font-bold transition-all rounded-lg ${
                    isActive(href)
                      ? "text-[#27509b]"
                      : "text-[#53565a] hover:text-[#27509b] hover:bg-[#27509b]/5"
                  }`}
                >
                  {label}
                  {locked && (
                    <svg className="inline-block ml-1 w-3 h-3 text-gray-300 -mt-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  )}
                  {isActive(href) && (
                    <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-[#fce500] rounded-full" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#27509b] flex items-center justify-center text-white text-xs font-black shrink-0">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-[#000c34] max-w-[120px] truncate">
                    {user.firstName}
                  </span>
                  <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,12,52,0.12)] border border-gray-100 overflow-hidden z-20">
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
                      <Link
                        href="/profil"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#000c34] hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <svg className="w-4 h-4 fill-[#27509b]" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        Mon Profil
                      </Link>
                      <Link
                        href="/velo"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#000c34] hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <svg className="w-4 h-4 fill-[#27509b]" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 3C6.48 3 2 6.48 2 12s4.48 9 10 9 10-4.03 10-9-4.48-9-10-9zm0 2c3.87 0 7.19 2.45 8.51 5.92H3.49C4.81 7.45 8.13 5 12 5zm0 14c-4.41 0-8-3.59-8-8 0-.34.02-.67.05-1h15.9c.03.33.05.66.05 1 0 4.41-3.59 8-8 8z" />
                        </svg>
                        Mon Vélo
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Se déconnecter
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-semibold text-[#27509b] hover:bg-[#27509b]/5 rounded-xl transition-colors">
                  Se connecter
                </Link>
                <Link href="/signup" className="px-5 py-2.5 text-sm font-black text-[#000c34] bg-[#fce500] hover:bg-yellow-300 rounded-xl transition-colors min-h-[40px] inline-flex items-center">
                  S&apos;inscrire
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 text-[#27509b] hover:bg-[#27509b]/5 rounded-lg transition-colors"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
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

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <nav className="max-w-[1280px] mx-auto px-4 py-1" aria-label="Navigation mobile">
            {visibleNavItems.map(({ href, label, ...rest }) => {
              const locked = "protected" in rest && rest.protected && !user;
              return (
                <Link
                  key={href}
                  href={locked ? "/login" : href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 w-full py-3.5 border-b border-gray-100 text-sm font-semibold transition-colors ${
                    isActive(href) ? "text-[#27509b]" : "text-[#53565a]"
                  }`}
                >
                  <span className={`w-1 h-5 rounded-full shrink-0 ${isActive(href) ? "bg-[#fce500]" : "bg-transparent"}`} />
                  {label}
                  {locked && (
                    <svg className="w-3.5 h-3.5 text-gray-300 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  )}
                </Link>
              );
            })}

            {user ? (
              <>
                <Link href="/profil" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 w-full py-3.5 border-b border-gray-100 text-sm font-semibold text-[#53565a]">
                  <span className={`w-1 h-5 rounded-full shrink-0 ${isActive("/profil") ? "bg-[#fce500]" : "bg-transparent"}`} />
                  Mon Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full py-3.5 text-sm font-semibold text-red-400"
                >
                  <span className="w-1 h-5 rounded-full shrink-0 bg-transparent" />
                  Se déconnecter ({user.firstName})
                </button>
              </>
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
