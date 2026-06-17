'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const { user, loading, signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '', lastName: '', username: '', email: '', password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signup(form);
      router.replace('/onboarding');
    } catch {
      setError('Une erreur est survenue. Réessayez.');
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
        {/* Tire silhouette */}
        <div className="absolute right-[-20px] bottom-10 w-72 h-72 opacity-[0.07]">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <ellipse cx="40" cy="40" rx="11" ry="34" fill="white" stroke="white" strokeWidth="2.5" />
            <ellipse cx="40" cy="40" rx="34" ry="11" fill="white" stroke="white" strokeWidth="2.5" />
            <circle cx="40" cy="40" r="6" fill="white" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line key={deg} x1="40" y1="40"
                x2={40 + 28 * Math.cos((deg * Math.PI) / 180)}
                y2={40 + 28 * Math.sin((deg * Math.PI) / 180)}
                stroke="white" strokeWidth="1.5" />
            ))}
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
            Prêt pour<br />aller plus<br />loin ?
          </h2>
          <p className="text-white/50 text-sm mt-4 leading-relaxed max-w-xs">
            Créez votre profil en 30 secondes et rejoignez des milliers de cyclistes
            qui font confiance à la performance Michelin.
          </p>
        </div>

        {/* Benefits */}
        <div className="relative z-10 space-y-3">
          {[
            'Suivi kilométrique de vos vélos',
            'Défis communauté & classements',
            'Recommandations pneus personnalisées',
          ].map(b => (
            <div key={b} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#fce500] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3" fill="none" stroke="#000c34" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white/70 text-sm">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-[#f4f4f6] overflow-y-auto">
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

        <div className="w-full max-w-md py-4">
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,12,52,0.08)] p-8">
            <h1 className="font-title text-[#000c34] text-3xl mb-1">Créer un compte</h1>
            <p className="text-[#53565a] text-sm mb-8">Rejoignez la communauté Michelin Vélo Hub</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#000c34] mb-1.5">Prénom</label>
                  <input type="text" value={form.firstName} onChange={set('firstName')}
                    placeholder="Thomas" required autoComplete="given-name"
                    className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#000c34] mb-1.5">Nom</label>
                  <input type="text" value={form.lastName} onChange={set('lastName')}
                    placeholder="Mercier" required autoComplete="family-name"
                    className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#000c34] mb-1.5">
                  Nom d&apos;utilisateur
                </label>
                <input type="text" value={form.username} onChange={set('username')}
                  placeholder="thomas_velo" required autoComplete="username"
                  className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#000c34] mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="votre@email.com" required autoComplete="email"
                  className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#000c34] mb-1.5">Mot de passe</label>
                <input type="password" value={form.password} onChange={set('password')}
                  placeholder="••••••••" required minLength={6} autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
                <p className="text-[#53565a] text-xs mt-1">Minimum 6 caractères</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#fce500] text-[#000c34] rounded-xl font-black text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60 mt-2 flex items-center justify-center gap-2 min-h-[48px]"
              >
                {submitting && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {submitting ? 'Création…' : 'Créer mon compte'}
              </button>
            </form>

            <p className="text-center text-sm text-[#53565a] mt-6">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-[#27509b] font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
