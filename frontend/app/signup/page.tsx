'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function BibendumMark() {
  return (
    <div className="w-11 h-11 bg-[#27509b] rounded-xl flex items-center justify-center shrink-0">
      <svg viewBox="0 0 36 36" className="w-9 h-9">
        <ellipse cx="18" cy="10" rx="7" ry="7" fill="white" />
        <ellipse cx="18" cy="22" rx="10" ry="7" fill="white" />
        <ellipse cx="18" cy="31" rx="12" ry="6" fill="white" />
        <circle cx="15" cy="8.5" r="1.8" fill="#27509b" />
        <circle cx="21" cy="8.5" r="1.8" fill="#27509b" />
        <path d="M14.5 13.5 Q18 16 21.5 13.5" stroke="#27509b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

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
    <div className="min-h-screen bg-[#f4f4f6] flex flex-col items-center justify-center p-4 py-10">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <BibendumMark />
        <div>
          <div className="font-title text-[#27509b] text-xl tracking-wide leading-none">MICHELIN</div>
          <div className="text-[#27509b]/50 text-[10px] font-semibold tracking-widest leading-none mt-0.5">VÉLO HUB</div>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="font-title text-[#020e39] text-2xl mb-1">Créer un compte</h1>
          <p className="text-gray-400 text-sm mb-6">Rejoignez la communauté Michelin Vélo Hub</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#020e39] mb-1.5">Prénom</label>
                <input type="text" value={form.firstName} onChange={set('firstName')}
                  placeholder="Thomas" required autoComplete="given-name"
                  className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#020e39] mb-1.5">Nom</label>
                <input type="text" value={form.lastName} onChange={set('lastName')}
                  placeholder="Mercier" required autoComplete="family-name"
                  className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#020e39] mb-1.5">
                Nom d&apos;utilisateur
              </label>
              <input type="text" value={form.username} onChange={set('username')}
                placeholder="thomas_velo" required autoComplete="username"
                className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#020e39] mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="votre@email.com" required autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#020e39] mb-1.5">Mot de passe</label>
              <input type="password" value={form.password} onChange={set('password')}
                placeholder="••••••••" required minLength={6} autoComplete="new-password"
                className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors" />
              <p className="text-gray-400 text-xs mt-1">Minimum 6 caractères</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#fce500] text-[#020e39] rounded-xl py-3.5 font-black text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
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

          <p className="text-center text-sm text-gray-400 mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-[#27509b] font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
