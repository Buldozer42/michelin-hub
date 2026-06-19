'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBikes, Bike, BIKE_TYPES } from '../../context/BikeContext';
import { useAuth } from '../../context/AuthContext';
import {
  ApiUserTire, ApiTireModel,
  getUserTires, patchUserTire, destroyUserTire,
  getTireCatalog, UserTirePayload,
} from '../../lib/api';
import BikeForm from './BikeForm';
import SiteFooter from '../Footer';
import GarageDrawer, { GarageAssignMode } from './GarageDrawer';

/* ─── Static chart data ──────────────────────────────────────────────── */

const BAR_DATA   = [35, 55, 45, 70, 60, 85, 100];
const BAR_MONTHS = ['Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct'];

/* ─── SVG helpers ────────────────────────────────────────────────────── */

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

/* ─── Tire display card ──────────────────────────────────────────────── */

function TireCard({
  tire, bikeKm,
  onEdit, onUninstall, onDelete,
}: {
  tire: ApiUserTire;
  bikeKm: number;
  onEdit: () => void;
  onUninstall: () => void;
  onDelete: () => void;
}) {
  const pos = tire.position;
  const displayName = tire.customName ?? tire.tireModel?.model ?? 'Pneu';
  const brand = tire.tireModel?.brand ?? 'Michelin';
  const etrto = tire.tireModel?.etrto;
  const weight = tire.tireModel?.weight;
  const tpi = tire.tireModel?.tpi;
  const pMax = tire.tireModel?.maxPressureBar;

  const currentKm = Math.max(0, bikeKm - tire.installedAtKm);
  const lifespan = tire.expectedLifespanKm ?? 0;
  const lifespanPct = lifespan > 0 ? Math.min(100, Math.round((currentKm / lifespan) * 100)) : 0;
  const remaining = lifespan > 0 ? lifespan - currentKm : null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
          pos === 'front' ? 'bg-[#27509b] text-white' : 'bg-[#000c34] text-[#fce500]'
        }`}>
          {pos === 'front' ? 'AVANT' : 'ARRIÈRE'}
        </span>
        <div className="flex gap-1">
          <button onClick={onEdit}
            className="px-2.5 py-1 text-[11px] font-semibold text-[#27509b] bg-[#27509b]/10 rounded-lg hover:bg-[#27509b]/20 transition-colors">
            Modifier
          </button>
          <button onClick={onUninstall}
            title="Retirer du vélo (retour en stock)"
            className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Retirer
          </button>
          <button onClick={onDelete}
            title="Supprimer définitivement"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 bg-[#000c34] rounded-xl flex items-center justify-center shrink-0">
          <InMotionTire size={64} />
        </div>
        <div className="min-w-0">
          {tire.tireModel && (
            <div className="text-[10px] text-gray-400 font-semibold">{brand}</div>
          )}
          <div className="font-title text-[#000c34] text-sm leading-tight truncate">{displayName}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {etrto && <span className="bg-[#27509b]/10 text-[#27509b] text-[9px] font-black px-2 py-0.5 rounded-full">{etrto}</span>}
            {tpi   && <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full">{tpi} TPI</span>}
            {weight && <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full">{weight}g</span>}
            {pMax  && <span className="bg-[#fce500]/20 text-[#000c34] text-[9px] font-black px-2 py-0.5 rounded-full">pMax {pMax} bar</span>}
          </div>
        </div>
      </div>

      {lifespan > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-gray-400 text-xs">Kilométrage</span>
            <span className="text-[#000c34] font-black text-xs">{Math.round(currentKm)} / {lifespan} km</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full" style={{
              width: `${lifespanPct}%`,
              backgroundColor: lifespanPct < 50 ? '#22c55e' : lifespanPct < 80 ? '#fce500' : '#f97316',
            }} />
          </div>
          <p className="text-gray-400 text-[10px] mt-1.5">
            {remaining !== null && remaining > 0 ? `${Math.round(remaining)} km restants · ` : ''}
            Installé à {Math.round(tire.installedAtKm)} km
          </p>
        </div>
      ) : (
        <p className="text-gray-400 text-[10px]">Installé à {Math.round(tire.installedAtKm)} km</p>
      )}
    </div>
  );
}

/* ─── Empty tire slot ────────────────────────────────────────────────── */

function TireSlotEmpty({ position, onChoose }: { position: 'front' | 'rear'; onChoose: () => void }) {
  return (
    <button onClick={onChoose}
      className="w-full bg-white rounded-2xl p-5 shadow-sm border-2 border-dashed border-gray-200 hover:border-[#27509b] hover:bg-[#27509b]/5 transition-all group text-left">
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
          position === 'front' ? 'bg-[#27509b]/10 text-[#27509b]' : 'bg-gray-100 text-gray-400'
        }`}>
          {position === 'front' ? 'AVANT' : 'ARRIÈRE'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#27509b]/10 transition-colors">
          <svg className="w-8 h-8 text-gray-300 group-hover:text-[#27509b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
          </svg>
        </div>
        <div>
          <div className="text-[#000c34] font-black text-sm group-hover:text-[#27509b] transition-colors">
            Choisir depuis le garage
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            {position === 'front' ? 'Roue avant' : 'Roue arrière'} · aucun pneu installé
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Tire form modal ────────────────────────────────────────────────── */

type TireFormData = {
  customName: string;
  installedAtKm: number;
  expectedLifespanKm: number;
  tireModelId: number | null;
};

function TireFormModal({
  position, existingTire, bikeKm, catalog,
  onSave, onClose,
}: {
  position: 'front' | 'rear';
  existingTire?: ApiUserTire;
  bikeKm: number;
  catalog: ApiTireModel[];
  onSave: (data: TireFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [customName, setCustomName]       = useState(existingTire?.customName ?? '');
  const [installedAtKm, setInstalledAtKm] = useState(existingTire?.installedAtKm ?? bikeKm);
  const [lifespanKm, setLifespanKm]       = useState<number | ''>(existingTire?.expectedLifespanKm ?? '');
  const [tireModelId, setTireModelId]     = useState<number | null>(existingTire?.tireModel?.id ?? null);
  const [search, setSearch]               = useState(
    existingTire?.tireModel
      ? `${existingTire.tireModel.brand} ${existingTire.tireModel.model}`
      : ''
  );
  const [showDropdown, setShowDropdown]   = useState(false);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const filtered = search.trim().length >= 2
    ? catalog.filter(t =>
        t.model.toLowerCase().includes(search.toLowerCase()) ||
        t.etrto.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 12)
    : [];

  function selectModel(t: ApiTireModel) {
    setTireModelId(t.id);
    setSearch(`${t.brand} ${t.model}`);
    if (!customName) setCustomName(t.model);
    if (!lifespanKm) {
      const guess = t.model.includes('RACING') ? 4000 : t.model.includes('COMPETITION') ? 6000 : t.model.includes('PERFORMANCE') ? 8000 : 10000;
      setLifespanKm(guess);
    }
    setShowDropdown(false);
  }

  function clearModel() {
    setTireModelId(null);
    setSearch('');
    setShowDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customName.trim()) { setError('Le nom est requis.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        customName: customName.trim(),
        installedAtKm,
        expectedLifespanKm: typeof lifespanKm === 'number' && lifespanKm > 0 ? lifespanKm : 0,
        tireModelId,
      });
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  const posLabel = position === 'front' ? 'AVANT' : 'ARRIÈRE';
  const posColor = position === 'front' ? 'bg-[#27509b] text-white' : 'bg-[#000c34] text-[#fce500]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#000c34]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${posColor}`}>{posLabel}</span>
          <h2 className="font-title text-[#000c34] text-xl">
            {existingTire ? 'Modifier le pneu' : 'Ajouter un pneu'}
          </h2>
          <button onClick={onClose} className="ml-auto text-gray-300 hover:text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Modèle Michelin */}
          <div>
            <label className="block text-xs font-black text-gray-500 mb-1.5">
              Modèle Michelin <span className="font-normal text-gray-300">(optionnel)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setTireModelId(null); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Chercher un pneu du catalogue…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#27509b] pr-8"
              />
              {tireModelId && (
                <button type="button" onClick={clearModel}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {showDropdown && filtered.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                  {filtered.map(t => (
                    <li key={t.id}>
                      <button type="button" onClick={() => selectModel(t)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#27509b]/5 transition-colors">
                        <div className="text-xs font-semibold text-[#000c34] leading-tight">{t.model}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {t.etrto} · {t.weight}g · {t.tpi} TPI
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {tireModelId && (
              <p className="text-[11px] text-[#27509b] mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Modèle sélectionné du catalogue Michelin
              </p>
            )}
          </div>

          {/* Nom personnalisé */}
          <div>
            <label className="block text-xs font-black text-gray-500 mb-1.5">
              Nom personnalisé <span className="text-red-400">*</span>
            </label>
            <input
              type="text" required
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Ex. Mon pneu avant XC"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#27509b]"
            />
          </div>

          {/* Kilométrage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-500 mb-1.5">Installé à (km)</label>
              <input
                type="number" min="0" step="0.1"
                value={installedAtKm}
                onChange={e => setInstalledAtKm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#27509b]"
              />
              <p className="text-[10px] text-gray-400 mt-1">Km du vélo à l&apos;installation</p>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 mb-1.5">Durée de vie (km)</label>
              <input
                type="number" min="0" step="100"
                value={lifespanKm}
                onChange={e => setLifespanKm(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                placeholder="Optionnel"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#27509b]"
              />
              <p className="text-[10px] text-gray-400 mt-1">Kilométrage estimé</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-3 text-sm font-black text-[#000c34] bg-[#fce500] rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-[#000c34]/30 border-t-[#000c34] rounded-full animate-spin" />}
              {existingTire ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete tire confirm ────────────────────────────────────────────── */

function DeleteTireConfirm({ tire, onConfirm, onCancel }: {
  tire: ApiUserTire; onConfirm: () => void; onCancel: () => void;
}) {
  const name = tire.customName ?? tire.tireModel?.model ?? 'ce pneu';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#000c34]/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-title text-[#000c34] text-xl mb-2">Supprimer ce pneu ?</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          <strong>{name}</strong> sera définitivement supprimé. Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-3 text-sm font-black text-white bg-red-500 rounded-xl hover:bg-red-600">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rating bar ─────────────────────────────────────────────────────── */

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

/* ─── Bike selector pill ─────────────────────────────────────────────── */

function BikePill({ bike, active, onClick }: { bike: Bike; active: boolean; onClick: () => void }) {
  const typeLabel = BIKE_TYPES.find(t => t.value === bike.bikeType)?.label ?? bike.bikeType;
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

/* ─── Empty state ────────────────────────────────────────────────────── */

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

/* ─── Confirm delete bike ────────────────────────────────────────────── */

function DeleteBikeConfirm({ bike, onConfirm, onCancel }: {
  bike: Bike; onConfirm: () => void; onCancel: () => void;
}) {
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

/* ─── Main page ──────────────────────────────────────────────────────── */

export default function MonVeloPage() {
  const { bikes, activeBike, activeBikeId, loaded, setActiveBikeId, addBike, updateBike, deleteBike } = useBikes();
  const { token } = useAuth();

  const [showAddForm,   setShowAddForm]   = useState(false);
  const [editingBike,   setEditingBike]   = useState<Bike | null>(null);
  const [deletingBike,  setDeletingBike]  = useState<Bike | null>(null);

  /* ── Tires state ── */
  const [userTires,    setUserTires]    = useState<ApiUserTire[]>([]);
  const [tiresLoaded,  setTiresLoaded]  = useState(false);
  const [tireCatalog,  setTireCatalog]  = useState<ApiTireModel[]>([]);
  const [tireForm, setTireForm] = useState<ApiUserTire | null>(null);
  const [deletingTire, setDeletingTire] = useState<ApiUserTire | null>(null);
  const [garage, setGarage] = useState<null | 'browse' | GarageAssignMode>(null);

  const refreshTires = useCallback(async () => {
    if (!token) { setTiresLoaded(true); return; }
    try {
      const all = await getUserTires(token);
      setUserTires(all);
    } catch { /* ignore */ }
    setTiresLoaded(true);
  }, [token]);

  useEffect(() => {
    setTiresLoaded(false);
    setUserTires([]);
    refreshTires();
  }, [refreshTires]);

  /* Load catalog lazily when edit form opens */
  useEffect(() => {
    if (!tireForm || tireCatalog.length > 0) return;
    getTireCatalog().then(setTireCatalog).catch(() => {});
  }, [tireForm, tireCatalog.length]);

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
      </div>
    );
  }

  const bike = activeBike!;
  const typeLabel = BIKE_TYPES.find(t => t.value === bike.bikeType)?.label ?? bike.bikeType;
  const isEbike   = bike.bikeType === 'electric';

  const bikeIri = `/api/bikes/${bike.id}`;
  const bikeTires  = userTires.filter(t => t.bike === bikeIri && t.removedAtKm == null && !t.retiredAt);
  const frontTire  = bikeTires.find(t => t.position === 'front');
  const rearTire   = bikeTires.find(t => t.position === 'rear');

  const ecoImpact = {
    co2SavedKg:      Math.round(bike.totalDistance * 0.21 * 10) / 10,
    caloriesBurned:  Math.round(bike.totalDistance * 35),
    equivalentCarKm: Math.round(bike.totalDistance),
    moneySaved:      Math.round(bike.totalDistance * 0.15),
  };

  async function handleSaveTire(formData: TireFormData) {
    if (!token || !tireForm) return;
    const patchPayload: UserTirePayload = {
      customName: formData.customName || null,
      installedAtKm: formData.installedAtKm,
      expectedLifespanKm: formData.expectedLifespanKm > 0 ? formData.expectedLifespanKm : null,
      tireModel: formData.tireModelId ? `/api/tires/${formData.tireModelId}` : null,
    };
    await patchUserTire(tireForm.id, patchPayload, token);
    setTireForm(null);
    await refreshTires();
  }

  async function handleUninstallTire(tire: ApiUserTire) {
    if (!token) return;
    await patchUserTire(tire.id, {
      bike: null, position: null, removedAtKm: bike.totalDistance,
    }, token);
    await refreshTires();
  }

  async function handleDeleteTire() {
    if (!token || !deletingTire) return;
    await destroyUserTire(deletingTire.id, token);
    setDeletingTire(null);
    await refreshTires();
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Bike selector row ── */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
        {bikes.map(b => (
          <BikePill key={b.id} bike={b} active={b.id === activeBikeId} onClick={() => setActiveBikeId(b.id)} />
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-title text-[#000c34] text-lg flex items-center gap-2">
            <span className="w-6 h-6 bg-[#000c34] rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <ellipse cx="12" cy="12" rx="4" ry="10" />
                <ellipse cx="12" cy="12" rx="10" ry="4" />
              </svg>
            </span>
            Pneus actuels
          </h2>
          <div className="flex items-center gap-2">
            {!tiresLoaded && (
              <span className="w-4 h-4 border-2 border-gray-200 border-t-[#27509b] rounded-full animate-spin" />
            )}
            <button
              onClick={() => setGarage('browse')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-[#000c34] text-xs font-black rounded-xl hover:border-[#27509b] hover:text-[#27509b] transition-all shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
              </svg>
              Mon Garage
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AVANT */}
          {frontTire ? (
            <TireCard
              tire={frontTire}
              bikeKm={bike.totalDistance}
              onEdit={() => setTireForm(frontTire)}
              onUninstall={() => handleUninstallTire(frontTire)}
              onDelete={() => setDeletingTire(frontTire)}
            />
          ) : (
            <TireSlotEmpty position="front" onChoose={() => setGarage({
              bikeId: bike.id, bikeName: bike.name,
              position: 'front', bikeKm: bike.totalDistance,
            })} />
          )}
          {/* ARRIÈRE */}
          {rearTire ? (
            <TireCard
              tire={rearTire}
              bikeKm={bike.totalDistance}
              onEdit={() => setTireForm(rearTire)}
              onUninstall={() => handleUninstallTire(rearTire)}
              onDelete={() => setDeletingTire(rearTire)}
            />
          ) : (
            <TireSlotEmpty position="rear" onChoose={() => setGarage({
              bikeId: bike.id, bikeName: bike.name,
              position: 'rear', bikeKm: bike.totalDistance,
            })} />
          )}
        </div>
      </div>

      {/* ── Ambition 2050 ── */}
      <div className="mt-4">
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

      {/* ── Bike modals ── */}
      {showAddForm && (
        <BikeForm
          onSave={async (data) => { await addBike(data); setShowAddForm(false); }}
          onClose={() => setShowAddForm(false)}
          asModal
        />
      )}
      {editingBike && (
        <BikeForm
          bike={editingBike}
          onSave={async (data) => { await updateBike(editingBike.id, data); setEditingBike(null); }}
          onClose={() => setEditingBike(null)}
          asModal
        />
      )}
      {deletingBike && (
        <DeleteBikeConfirm
          bike={deletingBike}
          onConfirm={async () => { await deleteBike(deletingBike.id); setDeletingBike(null); }}
          onCancel={() => setDeletingBike(null)}
        />
      )}

      {/* ── Tire modals ── */}
      {tireForm && (
        <TireFormModal
          position={tireForm.position ?? 'front'}
          existingTire={tireForm}
          bikeKm={bike.totalDistance}
          catalog={tireCatalog}
          onSave={handleSaveTire}
          onClose={() => setTireForm(null)}
        />
      )}
      {deletingTire && (
        <DeleteTireConfirm
          tire={deletingTire}
          onConfirm={handleDeleteTire}
          onCancel={() => setDeletingTire(null)}
        />
      )}

      {/* ── Garage drawer ── */}
      {garage && token && (
        <GarageDrawer
          userTires={userTires}
          bikes={bikes}
          token={token}
          onRefresh={refreshTires}
          onClose={() => setGarage(null)}
          assignMode={garage === 'browse' ? undefined : garage}
        />
      )}

    </div>
  );
}
