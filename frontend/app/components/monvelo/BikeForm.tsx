'use client';

import { useState } from 'react';
import { BIKE_TYPES, Bike, BikeType } from '../../context/BikeContext';

/* ─── Bike type icons ────────────────────────────────────────── */
function BikeTypeIcon({ type, size = 32 }: { type: BikeType; size?: number }) {
  const s = size;
  if (type === 'road') return (
    <svg width={s} height={s} viewBox="0 0 48 32" fill="none">
      <circle cx="8" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="40" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 24 L18 8 L32 8 M20 8 L28 24 M20 8 L24 14 L40 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="8" r="2.5" fill="currentColor" />
    </svg>
  );
  if (type === 'mountain') return (
    <svg width={s} height={s} viewBox="0 0 48 32" fill="none">
      <circle cx="8" cy="24" r="7" stroke="currentColor" strokeWidth="3" />
      <circle cx="40" cy="24" r="7" stroke="currentColor" strokeWidth="3" />
      <path d="M8 24 L18 8 L30 8 M20 9 L28 24 M20 9 L24 14 L40 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8 Q18 4 22 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (type === 'gravel') return (
    <svg width={s} height={s} viewBox="0 0 48 32" fill="none">
      <circle cx="8" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 2" />
      <circle cx="40" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 2" />
      <path d="M8 24 L18 8 L32 8 M20 8 L28 24 M20 8 L24 14 L40 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="8" r="2.5" fill="currentColor" />
    </svg>
  );
  if (type === 'urban') return (
    <svg width={s} height={s} viewBox="0 0 48 32" fill="none">
      <circle cx="8" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="40" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 24 L16 12 L30 12 L38 24 M16 12 L24 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 12 L26 6 L32 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (type === 'electric') return (
    <svg width={s} height={s} viewBox="0 0 48 32" fill="none">
      <circle cx="8" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="40" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 24 L18 8 L32 8 M20 8 L28 24 M20 8 L24 14 L40 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 2 L23 9 L27 9 L23 16" stroke="#fce500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === 'bmx') return (
    <svg width={s} height={s} viewBox="0 0 48 32" fill="none">
      <circle cx="10" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="38" cy="24" r="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 24 L20 10 L30 10 M22 10 L28 24 M22 10 L24 16 L38 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 10 L16 5 L22 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  // triathlon — aero bars distinguishing feature
  return (
    <svg width={s} height={s} viewBox="0 0 48 32" fill="none">
      <circle cx="8" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="40" cy="24" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 24 L18 8 L32 8 M20 8 L28 24 M20 8 L24 14 L40 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 8 L30 8 L34 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Form data ───────────────────────────────────────────────── */
export interface BikeFormData {
  name: string;
  brand: string;
  model: string;
  bikeType: BikeType | '';
  weight: string;
  purchaseDate: string;
  totalDistance: string;
}

function emptyForm(initial?: Bike): BikeFormData {
  return {
    name:          initial?.name               ?? '',
    brand:         initial?.brand              ?? '',
    model:         initial?.model              ?? '',
    bikeType:      initial?.bikeType           ?? '',
    weight:        initial?.weight?.toString() ?? '',
    purchaseDate:  initial?.purchaseDate       ?? '',
    totalDistance: initial?.totalDistance?.toString() ?? '0',
  };
}

/* ─── Props ───────────────────────────────────────────────────── */
interface Props {
  bike?: Bike;
  onSave: (data: Omit<Bike, 'id'>) => Promise<void>;
  onClose: () => void;
  asModal?: boolean;
}

export default function BikeForm({ bike, onSave, onClose, asModal = true }: Props) {
  const [form, setForm]             = useState<BikeFormData>(emptyForm(bike));
  const [error, setError]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set =
    <K extends keyof BikeFormData>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bikeType) { setError('Veuillez choisir un type de vélo.'); return; }
    if (!form.name.trim()) { setError('Le nom du vélo est requis.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await onSave({
        name:          form.name.trim(),
        brand:         form.brand.trim()  || undefined,
        model:         form.model.trim()  || undefined,
        bikeType:      form.bikeType as BikeType,
        weight:        form.weight ? parseFloat(form.weight) : undefined,
        purchaseDate:  form.purchaseDate  || undefined,
        totalDistance: parseFloat(form.totalDistance) || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  }

  const body = (
    <div className={asModal ? 'p-6' : ''}>
      {/* Header */}
      {asModal && (
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-title text-[#000c34] text-xl">
            {bike ? 'Modifier le vélo' : 'Ajouter un vélo'}
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Type selector ── */}
        <div>
          <label className="block text-sm font-semibold text-[#000c34] mb-3">
            Type de vélo <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {BIKE_TYPES.map(bt => {
              const active = form.bikeType === bt.value;
              return (
                <button
                  key={bt.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, bikeType: bt.value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                    active
                      ? 'border-[#27509b] bg-[#27509b]/5 text-[#27509b]'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                  }`}
                >
                  <BikeTypeIcon type={bt.value} size={28} />
                  <span className="text-[10px] font-black tracking-wide leading-tight">{bt.label}</span>
                </button>
              );
            })}
          </div>
          {form.bikeType && (
            <p className="text-gray-400 text-xs mt-2">
              {BIKE_TYPES.find(b => b.value === form.bikeType)?.description}
            </p>
          )}
        </div>

        {/* ── Nom ── */}
        <div>
          <label className="block text-sm font-semibold text-[#000c34] mb-1.5">
            Nom du vélo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="ex. Mon Trek Émonda"
            required
            className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        {/* ── Marque + Modèle ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-[#000c34] mb-1.5">Marque</label>
            <input
              type="text"
              value={form.brand}
              onChange={set('brand')}
              placeholder="Trek, Canyon…"
              className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#000c34] mb-1.5">Modèle</label>
            <input
              type="text"
              value={form.model}
              onChange={set('model')}
              placeholder="Émonda SL 6"
              className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* ── Poids + Date d'achat ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-[#000c34] mb-1.5">
              Poids <span className="text-gray-400 font-normal">(kg)</span>
            </label>
            <input
              type="number"
              value={form.weight}
              onChange={set('weight')}
              placeholder="7.5"
              min="1" max="50" step="0.1"
              className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#000c34] mb-1.5">Date d&apos;achat</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={set('purchaseDate')}
              className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* ── Kilométrage actuel ── */}
        <div>
          <label className="block text-sm font-semibold text-[#000c34] mb-1.5">
            Kilométrage actuel <span className="text-gray-400 font-normal">(km)</span>
          </label>
          <input
            type="number"
            value={form.totalDistance}
            onChange={set('totalDistance')}
            placeholder="0"
            min="0" step="1"
            className="w-full rounded-xl px-4 py-3 text-sm border border-gray-200 outline-none focus:border-[#27509b] bg-gray-50 focus:bg-white transition-colors"
          />
          <p className="text-gray-400 text-xs mt-1">
            Entrez vos kilomètres déjà parcourus avec ce vélo.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {asModal && (
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-3.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[48px] disabled:opacity-50"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#fce500] text-[#000c34] rounded-xl py-3.5 font-black text-sm hover:bg-yellow-300 transition-colors min-h-[48px] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {bike ? 'Enregistrer' : 'Ajouter ce vélo'}
          </button>
        </div>
      </form>
    </div>
  );

  if (!asModal) return body;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#000c34]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
        {body}
      </div>
    </div>
  );
}
