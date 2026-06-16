'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useBikes, Bike } from '../context/BikeContext';
import BikeForm from '../components/monvelo/BikeForm';

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const { bikes, loaded: bikesLoaded, addBike } = useBikes();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // Skip onboarding if user already has bikes
  useEffect(() => {
    if (bikesLoaded && bikes.length > 0) router.replace('/');
  }, [bikes, bikesLoaded, router]);

  function handleSave(data: Omit<Bike, 'id'>) {
    addBike(data);
    router.replace('/');
  }

  if (authLoading || !user || (bikesLoaded && bikes.length > 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f6]">
        <div className="w-10 h-10 rounded-full border-4 border-[#27509b] border-t-[#fce500] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f6] flex flex-col">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#27509b] rounded-lg flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-7 h-7">
                <ellipse cx="18" cy="10" rx="7" ry="7" fill="white" />
                <ellipse cx="18" cy="22" rx="10" ry="7" fill="white" />
                <ellipse cx="18" cy="31" rx="12" ry="6" fill="white" />
              </svg>
            </div>
            <span className="font-title text-[#27509b] text-sm tracking-wide">MICHELIN VÉLO HUB</span>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-semibold text-green-600">Compte créé</span>
            <div className="w-8 h-px bg-gray-300" />
            <div className="w-5 h-5 rounded-full bg-[#27509b] flex items-center justify-center text-white font-black text-[10px]">2</div>
            <span className="font-semibold text-[#020e39]">Mon vélo</span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-4">
        <div className="w-full max-w-xl">

          {/* Welcome header */}
          <div className="mb-6">
            <h1 className="font-title text-[#020e39] text-3xl leading-tight">
              Bienvenue, {user.firstName}&nbsp;! 👋
            </h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Avant de commencer, dites-nous quel vélo vous utilisez. Vous pourrez en ajouter d&apos;autres plus tard depuis &ldquo;Mon Vélo&rdquo;.
            </p>
          </div>

          {/* ── Bike form (embedded, not modal) ── */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <BikeForm
              onSave={handleSave}
              onClose={() => router.replace('/')}
              asModal={false}
            />
          </div>

          {/* Skip link */}
          <button
            onClick={() => router.replace('/')}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4 py-2 transition-colors"
          >
            Passer cette étape — ajouter mon vélo plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
