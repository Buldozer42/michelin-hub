'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBikes, Bike, BIKE_TYPES } from '../../context/BikeContext';
import BikeForm from './BikeForm';
import SiteFooter from '../Footer';

/* ─── Static reference data (no backend entity yet) ─────────────── */

const TIRE_RATING = { rollingEfficiency: 94, punctureResistance: 72, grip: 90, durability: 78 };

const TIRE_FRONT = {
  brand: 'Michelin', model: 'Power Cup Competition', position: 'AVANT',
  tpi: 150, weight: 185, pMax: 8.0, installedAtKm: 2840, expectedLifespanKm: 5000, currentKm: 400,
};
const TIRE_REAR = {
  brand: 'Michelin', model: 'Power Cup Competition', position: 'ARRIÈRE',
  tpi: 150, weight: 200, pMax: 7.5, installedAtKm: 2840, expectedLifespanKm: 4500, currentKm: 400,
};

const BAR_DATA   = [35, 55, 45, 70, 60, 85, 100];
const BAR_MONTHS = ['Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct'];

/* ─── Helpers ─────────────────────────────────────────────────── */

function InMotionTire({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size}>
      <ellipse cx="40" cy="40" rx="11" ry="34" fill="white" stroke="black" strokeWidth="2.5" />
      <ellipse cx="40" cy="40" rx="34" ry="11" fill="white" stroke="black" strokeWidth="2.5" />
      <circle cx="40" cy="40" r="6" fill="black" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line key={deg} x1="40" y1="40"
          x2={40 + 28 * Math.cos((deg * Math.PI) / 180)}
          y2={40 + 28 * Math.sin((deg * Math.PI) / 180)}
          stroke="black" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function BikeIcon3D() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12">
      <defs>
        <radialGradient id="g3d" cx="40%" cy="35%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="#b0c0e0" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="34" r="9" fill="none" stroke="url(#g3d)" strokeWidth="3" />
      <circle cx="36" cy="34" r="9" fill="none" stroke="url(#g3d)" strokeWidth="3" />
      <path d="M12 34 L20 16 L32 16 M20 16 L28 34 M20 16 L24 22 L36 34"
        stroke="url(#g3d)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="16" r="3" fill="url(#g3d)" />
    </svg>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const color = value >= 85 ? '#22c55e' : value >= 70 ? '#fce500' : '#f97316';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-500 text-xs">{label}</span>
        <span className="text-[#000c34] font-black text-sm">{value}/100</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function TireCard({ tire }: { tire: typeof TIRE_FRONT }) {
  const lifespanPercent = Math.round((tire.currentKm / tire.expectedLifespanKm) * 100);
  const remaining = tire.expectedLifespanKm - tire.currentKm;
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
          tire.position === 'AVANT' ? 'bg-[#27509b] text-white' : 'bg-[#000c34] text-[#fce500]'
        }`}>
          {tire.position}
        </span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 bg-[#000c34] rounded-xl flex items-center justify-center shrink-0">
          <InMotionTire size={64} />
        </div>
        <div>
          <div className="text-[10px] text-gray-400 font-semibold">{tire.brand}</div>
          <div className="font-title text-[#000c34] text-base leading-tight">{tire.model}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full">{tire.tpi} TPI</span>
            <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full">{tire.weight}g</span>
            <span className="bg-[#fce500]/20 text-[#000c34] text-[9px] font-black px-2 py-0.5 rounded-full">pMax {tire.pMax} bar</span>
          </div>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-gray-400 text-xs">Kilométrage</span>
          <span className="text-[#000c34] font-black text-xs">{tire.currentKm} / {tire.expectedLifespanKm} km</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full" style={{
            width: `${lifespanPercent}%`,
            backgroundColor: lifespanPercent < 50 ? '#22c55e' : lifespanPercent < 80 ? '#fce500' : '#f97316',
          }} />
        </div>
        <p className="text-gray-400 text-[10px] mt-1.5">{remaining} km restants · Installé à {tire.installedAtKm} km</p>
      </div>
    </div>
  );
}

/* ─── Bike selector pill ─────────────────────────────────────── */
function BikePill({ bike, active, onClick }: { bike: Bike; active: boolean; onClick: () => void }) {
  const typeLabel = BIKE_TYPES.find(t => t.value === bike.type)?.label ?? bike.type;
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-left ${
        active
          ? 'border-[#27509b] bg-[#27509b] text-white'
          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
      }`}
    >
      <div className="flex flex-col">
        <span className={`text-xs font-black leading-none ${active ? 'text-white' : 'text-[#000c34]'}`}>
          {bike.name}
        </span>
        <span className={`text-[10px] mt-0.5 ${active ? 'text-white/70' : 'text-gray-400'}`}>
          {bike.brand ? `${bike.brand} · ` : ''}{typeLabel}
        </span>
      </div>
    </button>
  );
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyBikes() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 bg-[#000c34] rounded-2xl flex items-center justify-center mb-5">
        <BikeIcon3D />
      </div>
      <h2 className="font-title text-[#000c34] text-2xl mb-2">Aucun vélo enregistré</h2>
      <p className="text-gray-400 text-sm text-center max-w-xs leading-relaxed mb-6">
        Ajoutez votre premier vélo pour suivre vos performances, votre kilométrage et l&apos;état de vos pneus.
      </p>
      <button
        onClick={() => router.push('/onboarding')}
        className="bg-[#fce500] text-[#000c34] font-black text-sm px-6 py-3.5 rounded-xl hover:bg-yellow-300 transition-colors inline-flex items-center gap-2 min-h-[48px]"
      >
        Ajouter mon premier vélo
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Confirm delete dialog ──────────────────────────────────── */
function DeleteConfirm({ bike, onConfirm, onCancel }: { bike: Bike; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#000c34]/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-title text-[#000c34] text-xl mb-2">Supprimer ce vélo ?</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          <strong>{bike.name}</strong> sera définitivement supprimé. Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-3 text-sm font-black text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function MonVeloPage() {
  const { bikes, activeBike, activeBikeId, loaded, setActiveBikeId, addBike, updateBike, deleteBike } = useBikes();
  const [showAddForm, setShowAddForm]   = useState(false);
  const [editingBike, setEditingBike]   = useState<Bike | null>(null);
  const [deletingBike, setDeletingBike] = useState<Bike | null>(null);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 rounded-full border-4 border-[#27509b] border-t-[#fce500] animate-spin" />
      </div>
    );
  }

  if (bikes.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyBikes />
        <SiteFooter />
      </div>
    );
  }

  const bike = activeBike!;
  const typeLabel = BIKE_TYPES.find(t => t.value === bike.type)?.label ?? bike.type;
  const isEbike = bike.type === 'E-BIKE';

  /* ── Eco impact calculated from the bike's real total distance ── */
  const ecoImpact = {
    co2SavedKg:      Math.round(bike.totalDistance * 0.21 * 10) / 10,
    caloriesBurned:  Math.round(bike.totalDistance * 35),
    equivalentCarKm: Math.round(bike.totalDistance),
    moneySaved:      Math.round(bike.totalDistance * 0.15),
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Bike selector row ── */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
        {bikes.map(b => (
          <BikePill
            key={b.id}
            bike={b}
            active={b.id === activeBikeId}
            onClick={() => setActiveBikeId(b.id)}
          />
        ))}
        <button
          onClick={() => setShowAddForm(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#27509b] hover:text-[#27509b] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs font-black">Ajouter</span>
        </button>
      </div>

      {/* ── Active bike header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-[#000c34] rounded-2xl flex items-center justify-center shrink-0">
            <BikeIcon3D />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#27509b]/10 text-[#27509b] text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-widest">
                {typeLabel.toUpperCase()}
              </span>
              {bike.brand && <span className="text-gray-400 text-xs">{bike.brand}</span>}
            </div>
            <h1 className="font-title text-[#000c34] text-3xl md:text-4xl leading-none">{bike.name}</h1>
            {bike.model && <p className="text-gray-400 text-sm mt-0.5">{bike.model}</p>}
            <p className="text-gray-500 text-sm mt-1">
              Distance totale :{' '}
              <strong className="text-[#000c34]">{bike.totalDistance.toLocaleString('fr-FR')} km</strong>
              {bike.weight && <> · <strong className="text-[#000c34]">{bike.weight} kg</strong></>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isEbike && (
            <span className="inline-flex items-center gap-1.5 bg-[#fce500] text-[#000c34] text-xs font-black px-3 py-2 rounded-full">
              <svg className="w-3.5 h-3.5 fill-[#000c34]" viewBox="0 0 24 24">
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
              E-BIKE READY E-25
            </span>
          )}
          <button
            onClick={() => setEditingBike(bike)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-[#000c34] text-sm font-semibold rounded-xl hover:border-[#27509b] hover:text-[#27509b] transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Modifier
          </button>
          <button
            onClick={() => setDeletingBike(bike)}
            className="p-2 bg-white border border-gray-200 text-gray-400 rounded-xl hover:border-red-300 hover:text-red-400 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Distance chart + Eco impact ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-[#000c34] rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-white/50 text-[10px] font-black tracking-[0.2em]">DISTANCE TOTALE</div>
              <div className="font-title text-white text-5xl md:text-6xl mt-1 leading-none">
                {Math.floor(bike.totalDistance).toLocaleString('fr-FR')}{' '}
                <span className="text-3xl text-white/60">km</span>
              </div>
            </div>
            {bike.purchaseDate && (
              <span className="text-white/30 text-xs">
                Depuis le {new Date(bike.purchaseDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <div className="mt-6">
            <div className="flex items-end gap-1.5 h-16">
              {BAR_DATA.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm" style={{
                    height: `${h * 0.56}px`,
                    backgroundColor: i === BAR_DATA.length - 1 ? '#fce500' : 'rgba(252,229,0,0.3)',
                  }} />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-1">
              {BAR_MONTHS.map((m, i) => (
                <div key={i} className="flex-1 text-center text-[9px] text-white/30">{m}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 fill-green-600" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c6 0 9-8 9-8 0 0-1 5-5 7A10 10 0 0 0 22 12c0-1.88-.56-3.63-1.5-5.12A12.85 12.85 0 0 0 17 8z" />
            </svg>
          </div>
          <div className="text-gray-400 text-[10px] font-black tracking-[0.15em]">CO2 ÉCONOMISÉ</div>
          <div className="font-title text-[#000c34] text-4xl mt-1">
            {ecoImpact.co2SavedKg} <span className="text-2xl text-[#000c34]/50">kg</span>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            ≈ <strong className="text-[#000c34]">{ecoImpact.equivalentCarKm} km</strong> en voiture évités
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-green-50 rounded-xl p-2.5">
              <div className="text-green-700 font-black text-sm">{(ecoImpact.caloriesBurned / 1000).toFixed(1)}k</div>
              <div className="text-green-600 text-[10px]">kcal brûlées</div>
            </div>
            <div className="bg-[#fce500]/10 rounded-xl p-2.5">
              <div className="text-[#000c34] font-black text-sm">{ecoImpact.moneySaved} €</div>
              <div className="text-[#000c34]/50 text-[10px]">économisés</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tires ── */}
      <div className="mt-4">
        <h2 className="font-title text-[#000c34] text-lg mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-[#000c34] rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <ellipse cx="12" cy="12" rx="4" ry="10" />
              <ellipse cx="12" cy="12" rx="10" ry="4" />
            </svg>
          </span>
          Pneus actuels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TireCard tire={TIRE_FRONT} />
          <TireCard tire={TIRE_REAR} />
        </div>
      </div>

      {/* ── TireRating + Ambition 2050 ── */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-title text-[#000c34] text-base">Performances Pneu</span>
            <span className="text-gray-300 text-xs">TireRating</span>
          </div>
          <div className="space-y-3.5">
            <RatingBar label="Efficacité de roulement" value={TIRE_RATING.rollingEfficiency} />
            <RatingBar label="Résistance crevaison"    value={TIRE_RATING.punctureResistance} />
            <RatingBar label="Adhérence (grip)"        value={TIRE_RATING.grip} />
            <RatingBar label="Durabilité"              value={TIRE_RATING.durability} />
          </div>
          <p className="text-gray-300 text-[10px] mt-4 italic">
            Scores Michelin — basés sur tests laboratoire &amp; terrain.
          </p>
        </div>

        <div className="bg-[#000c34] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#fce500] text-[#000c34] text-[10px] font-black px-3 py-1 rounded-full tracking-widest">
              AMBITION 2050
            </span>
            <span className="text-white/70 text-sm font-semibold">Tout Durable</span>
          </div>
          <h3 className="font-title text-white text-2xl md:text-3xl leading-snug">
            Innover pour un futur en mouvement.
          </h3>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">
            Chez Michelin, nous nous engageons à ce que nos pneus soient{' '}
            <strong className="text-[#fce500]">100% biosourcés ou recyclés </strong> d&apos;ici 2050.
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/40 mb-1.5">
              <span>2024</span>
              <span className="text-[#fce500] font-semibold">45% recyclé</span>
              <span>2050</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-[#fce500] h-2 rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
          <button className="mt-5 bg-[#fce500] text-[#000c34] rounded-xl px-5 py-2.5 text-sm font-black hover:bg-yellow-300 transition-colors">
            Découvrir nos engagements
          </button>
        </div>
      </div>

      <SiteFooter />

      {showAddForm && (
        <BikeForm
          onSave={(data) => { addBike(data); setShowAddForm(false); }}
          onClose={() => setShowAddForm(false)}
          asModal
        />
      )}

      {editingBike && (
        <BikeForm
          bike={editingBike}
          onSave={(data) => { updateBike(editingBike.id, data); setEditingBike(null); }}
          onClose={() => setEditingBike(null)}
          asModal
        />
      )}

      {deletingBike && (
        <DeleteConfirm
          bike={deletingBike}
          onConfirm={() => { deleteBike(deletingBike.id); setDeletingBike(null); }}
          onCancel={() => setDeletingBike(null)}
        />
      )}
    </div>
  );
}
