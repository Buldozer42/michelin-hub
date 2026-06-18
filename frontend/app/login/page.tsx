'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace('/blog');
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      router.replace('/blog');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#000c34] flex-col items-start justify-between p-12 relative overflow-hidden">
        {/* Decorative speed lines */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute h-px bg-white"
              style={{ top: `${15 + i * 15}%`, left: '-5%', right: '-5%', transform: `rotate(-${2 + i * 0.5}deg)` }} />
          ))}
        </div>
        {/* Cyclist silhouette */}
        <div className="absolute right-0 bottom-0 w-72 h-72 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <ellipse cx="130" cy="22" rx="16" ry="10" fill="white" />
            <circle cx="130" cy="30" r="12" fill="white" />
            <path d="M115 48 L95 108 L60 158 M115 48 L145 98 L165 158 M95 108 L145 98"
              strokeWidth="10" stroke="white" fill="none" strokeLinecap="round" />
            <circle cx="60" cy="158" r="22" strokeWidth="8" stroke="white" fill="none" />
            <circle cx="165" cy="158" r="22" strokeWidth="8" stroke="white" fill="none" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#27509b] rounded-xl flex items-center justify-center shrink-0">
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
            <div className="font-title text-[#fce500] text-base tracking-wide leading-none">MICHELIN</div>
            <div className="text-white/40 text-[10px] font-semibold tracking-widest leading-none mt-0.5">VÉLO HUB</div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h2 className="font-title text-white text-5xl leading-tight">
            Chaque<br />kilomètre<br />compte.
          </h2>
          <p className="text-white/50 text-sm mt-4 leading-relaxed max-w-xs">
            Suivez vos performances, gérez votre équipement,
            et rejoignez des défis réservés aux cyclistes exigeants.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex gap-8">
          {[
            { value: '1 000+', label: 'cyclistes actifs' },
            { value: '850k', label: 'km parcourus' },
            { value: '3', label: 'défis actifs' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="font-title text-[#fce500] text-xl">{value}</div>
              <div className="text-white/40 text-[10px] tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-[#f4f4f6]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#27509b] rounded-xl flex items-center justify-center shrink-0">
            <svg viewBox="0 0 36 36" className="w-8 h-8">
              <ellipse cx="18" cy="10" rx="7" ry="7" fill="white" />
              <ellipse cx="18" cy="22" rx="10" ry="7" fill="white" />
              <ellipse cx="18" cy="31" rx="12" ry="6" fill="white" />
            </svg>
          </div>
          <div>
            <div className="font-title text-[#27509b] text-base tracking-wide leading-none">MICHELIN</div>
            <div className="text-[#27509b]/40 text-[10px] font-semibold tracking-widest leading-none mt-0.5">VÉLO HUB</div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,12,52,0.08)] p-8">
            <h1 className="font-title text-[#000c34] text-3xl mb-1">Connexion</h1>
            <p className="text-[#53565a] text-sm mb-8">Bienvenue sur votre espace Michelin Vélo</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#000c34] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl px-4 py-3.5 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-[#000c34]">Mot de passe</label>
                  <a href="#" className="text-[#27509b] text-xs hover:underline">Mot de passe oublié ?</a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 py-3.5 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#fce500] text-[#000c34] rounded-xl py-3.5 font-black text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 min-h-[48px]"
              >
                {submitting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {submitting ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            <p className="text-center text-sm text-[#53565a] mt-6">
              Pas encore de compte ?{' '}
              <Link href="/signup" className="text-[#27509b] font-semibold hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
            Connectez-vous avec votre compte Michelin Velo Hub.
          </p>
        </div>
      </div>
    </div>
  );
}
