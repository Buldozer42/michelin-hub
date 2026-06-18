'use client';

import { useState, useEffect } from 'react';
import { Bike } from '../../context/BikeContext';
import {
  ApiUserTire, ApiTireModel,
  createUserTire, patchUserTire, destroyUserTire, getTireCatalog,
} from '../../lib/api';

export type GarageAssignMode = {
  bikeId: number;
  bikeName: string;
  position: 'front' | 'rear';
  currentTireId?: number;
  bikeKm: number;
};

/* ─── Tire card in inventory list ────────────────────────────────────── */

function TireInventoryCard({
  tire, status, bikeName,
  onUninstall, onDelete,
}: {
  tire: ApiUserTire;
  status: 'stock' | 'installed';
  bikeName: string | null;
  onUninstall: (() => void) | null;
  onDelete: () => void;
}) {
  const name = tire.customName ?? tire.tireModel?.model ?? 'Pneu';
  const pos = tire.position === 'front' ? 'AVANT' : tire.position === 'rear' ? 'ARRIÈRE' : null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 bg-[#000c34] rounded-lg flex items-center justify-center shrink-0">
        <svg className="w-6 h-6" viewBox="0 0 80 80">
          <ellipse cx="40" cy="40" rx="11" ry="28" fill="white" stroke="black" strokeWidth="3" />
          <ellipse cx="40" cy="40" rx="28" ry="11" fill="white" stroke="black" strokeWidth="3" />
          <circle cx="40" cy="40" r="5" fill="black" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[#000c34] font-black text-xs truncate">{name}</div>
        {tire.tireModel && (
          <div className="text-gray-400 text-[10px]">{tire.tireModel.etrto} · {tire.tireModel.weight}g</div>
        )}
        <div className="mt-1">
          {status === 'stock' && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">EN STOCK</span>
          )}
          {status === 'installed' && pos && (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              tire.position === 'front'
                ? 'bg-[#27509b]/10 text-[#27509b]'
                : 'bg-[#000c34]/10 text-[#000c34]'
            }`}>
              {pos} · {bikeName}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {onUninstall && (
          <button onClick={onUninstall}
            className="text-[10px] font-semibold text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
            Retirer
          </button>
        )}
        <button onClick={onDelete}
          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Add to inventory form ──────────────────────────────────────────── */

function AddTireForm({ token, catalog, onSaved, onCancel }: {
  token: string;
  catalog: ApiTireModel[];
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName]           = useState('');
  const [search, setSearch]       = useState('');
  const [modelId, setModelId]     = useState<number | null>(null);
  const [lifespan, setLifespan]   = useState<number | ''>('');
  const [showDrop, setShowDrop]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const filtered = search.trim().length >= 2
    ? catalog.filter(t =>
        t.model.toLowerCase().includes(search.toLowerCase()) ||
        t.etrto.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10)
    : [];

  function selectModel(t: ApiTireModel) {
    setModelId(t.id);
    setSearch(`${t.brand} ${t.model}`);
    if (!name) setName(t.model);
    setShowDrop(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Le nom est requis.'); return; }
    setSaving(true);
    setError(null);
    try {
      await createUserTire({
        customName: name.trim(),
        tireModel: modelId ? `/api/tires/${modelId}` : null,
        expectedLifespanKm: typeof lifespan === 'number' && lifespan > 0 ? lifespan : null,
      }, token);
      await onSaved();
    } catch {
      setError('Une erreur est survenue.');
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] text-gray-400 font-black tracking-widest">NOUVEAU PNEU</div>
        <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 text-red-600 text-xs rounded-xl">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Catalog search */}
        <div className="relative">
          <label className="block text-[10px] font-black text-gray-400 mb-1">
            MODÈLE MICHELIN <span className="font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setModelId(null); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
            placeholder="Chercher dans le catalogue…"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#27509b]"
          />
          {showDrop && filtered.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              {filtered.map(t => (
                <li key={t.id}>
                  <button type="button" onClick={() => selectModel(t)}
                    className="w-full text-left px-3 py-2 hover:bg-[#27509b]/5 text-xs">
                    <div className="font-semibold text-[#000c34]">{t.model}</div>
                    <div className="text-gray-400">{t.etrto} · {t.weight}g</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {modelId && (
            <p className="text-[11px] text-[#27509b] mt-1">✓ Modèle sélectionné</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-1">
            NOM <span className="text-red-400">*</span>
          </label>
          <input
            type="text" required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex. Mon pneu XC avant"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#27509b]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 mb-1">
            DURÉE DE VIE ESTIMÉE (km) <span className="font-normal">(optionnel)</span>
          </label>
          <input
            type="number" min="0" step="100"
            value={lifespan}
            onChange={e => setLifespan(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            placeholder="Ex. 8000"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#27509b]"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 text-sm font-black text-[#000c34] bg-[#fce500] rounded-xl hover:bg-yellow-300 disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving && <span className="w-3.5 h-3.5 border-2 border-[#000c34]/30 border-t-[#000c34] rounded-full animate-spin" />}
            Ajouter à l&apos;inventaire
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Main GarageDrawer component ────────────────────────────────────── */

export default function GarageDrawer({
  userTires, bikes, token,
  onRefresh, onClose,
  assignMode,
}: {
  userTires: ApiUserTire[];
  bikes: Bike[];
  token: string;
  onRefresh: () => Promise<void>;
  onClose: () => void;
  assignMode?: GarageAssignMode;
}) {
  const [catalog, setCatalog]         = useState<ApiTireModel[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [pickingTire, setPickingTire] = useState<ApiUserTire | null>(null);
  const [installKm, setInstallKm]     = useState(assignMode?.bikeKm ?? 0);
  const [assigning, setAssigning]     = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<ApiUserTire | null>(null);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    if (!showAddForm || catalog.length > 0) return;
    getTireCatalog().then(setCatalog).catch(() => {});
  }, [showAddForm, catalog.length]);

  function getBikeName(bikeIri: string | null): string {
    if (!bikeIri) return '';
    const id = parseInt(bikeIri.split('/').pop() ?? '0');
    return bikes.find(b => b.id === id)?.name ?? 'Vélo inconnu';
  }

  const stockTires     = userTires.filter(t => !t.bike && t.removedAtKm == null);
  const installedTires = userTires.filter(t => t.bike && t.removedAtKm == null);

  async function handleAssign() {
    if (!pickingTire || !assignMode || !token) return;
    setAssigning(true);
    try {
      if (assignMode.currentTireId) {
        await patchUserTire(assignMode.currentTireId, {
          bike: null, position: null, removedAtKm: assignMode.bikeKm,
        }, token);
      }
      await patchUserTire(pickingTire.id, {
        bike: `/api/bikes/${assignMode.bikeId}`,
        position: assignMode.position,
        installedAtKm: installKm,
        removedAtKm: null,
      }, token);
      await onRefresh();
      onClose();
    } catch {
      setAssigning(false);
    }
  }

  async function handleUninstall(tire: ApiUserTire) {
    if (!token) return;
    const bikeId = tire.bike ? parseInt(tire.bike.split('/').pop() ?? '0') : 0;
    const bike = bikes.find(b => b.id === bikeId);
    await patchUserTire(tire.id, {
      bike: null, position: null, removedAtKm: bike?.totalDistance ?? 0,
    }, token);
    await onRefresh();
  }

  async function handleDelete() {
    if (!token || !confirmDelete) return;
    setDeleting(true);
    await destroyUserTire(confirmDelete.id, token);
    await onRefresh();
    setConfirmDelete(null);
    setDeleting(false);
  }

  const posLabel = assignMode?.position === 'front' ? 'AVANT' : 'ARRIÈRE';
  const posColor = assignMode?.position === 'front'
    ? 'bg-[#27509b] text-white'
    : 'bg-[#000c34] text-[#fce500]';

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[#000c34]/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto bg-gray-50 w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
          {assignMode ? (
            <>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest shrink-0 ${posColor}`}>
                {posLabel}
              </span>
              <div className="min-w-0">
                <div className="font-title text-[#000c34] text-lg leading-none">Choisir un pneu</div>
                <div className="text-gray-400 text-xs truncate">{assignMode.bikeName}</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-[#000c34] rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M20 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 7c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                </svg>
              </div>
              <div className="font-title text-[#000c34] text-xl">Mon Garage</div>
            </>
          )}
          <button onClick={onClose} className="ml-auto text-gray-300 hover:text-gray-500 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-5 space-y-4">

          {/* ── Assign mode ── */}
          {assignMode && (
            <>
              {pickingTire ? (
                /* Step 2: confirm km */
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="text-[10px] text-gray-400 font-black tracking-widest mb-3">CONFIRMATION D&apos;INSTALLATION</div>
                  <p className="text-[#000c34] font-black text-sm mb-0.5">
                    {pickingTire.customName ?? pickingTire.tireModel?.model ?? 'Pneu'}
                  </p>
                  {pickingTire.tireModel && (
                    <p className="text-gray-400 text-xs mb-4">{pickingTire.tireModel.etrto} · {pickingTire.tireModel.weight}g</p>
                  )}
                  {!pickingTire.tireModel && <div className="mb-4" />}
                  <label className="block text-xs font-black text-gray-500 mb-1.5">
                    Km du vélo à l&apos;installation
                  </label>
                  <input
                    type="number" min="0" step="0.1"
                    value={installKm}
                    onChange={e => setInstallKm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#27509b] mb-4"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setPickingTire(null)}
                      className="flex-1 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                      Retour
                    </button>
                    <button onClick={handleAssign} disabled={assigning}
                      className="flex-1 py-2.5 text-sm font-black text-[#000c34] bg-[#fce500] rounded-xl hover:bg-yellow-300 disabled:opacity-50 flex items-center justify-center gap-2">
                      {assigning && <span className="w-4 h-4 border-2 border-[#000c34]/30 border-t-[#000c34] rounded-full animate-spin" />}
                      Installer
                    </button>
                  </div>
                </div>
              ) : stockTires.length === 0 ? (
                /* Empty stock */
                <>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-semibold">Aucun pneu en stock</p>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed max-w-xs mx-auto">
                      Ajoutez un pneu à votre inventaire pour pouvoir l&apos;installer sur ce vélo.
                    </p>
                  </div>
                  {showAddForm ? (
                    <AddTireForm
                      token={token} catalog={catalog}
                      onSaved={async () => { await onRefresh(); setShowAddForm(false); }}
                      onCancel={() => setShowAddForm(false)}
                    />
                  ) : (
                    <button onClick={() => setShowAddForm(true)}
                      className="w-full py-3 bg-[#fce500] text-[#000c34] font-black text-sm rounded-xl hover:bg-yellow-300 transition-colors">
                      Ajouter un pneu
                    </button>
                  )}
                </>
              ) : (
                /* Step 1: pick from stock */
                <>
                  <div className="text-[10px] font-black text-gray-400 tracking-widest">
                    PNEUS DISPONIBLES ({stockTires.length})
                  </div>
                  <div className="space-y-2">
                    {stockTires.map(t => (
                      <button key={t.id}
                        onClick={() => { setPickingTire(t); setInstallKm(assignMode.bikeKm); }}
                        className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#27509b]/30 transition-all text-left flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-[#000c34] rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-7 h-7" viewBox="0 0 80 80">
                            <ellipse cx="40" cy="40" rx="11" ry="28" fill="white" stroke="black" strokeWidth="3" />
                            <ellipse cx="40" cy="40" rx="28" ry="11" fill="white" stroke="black" strokeWidth="3" />
                            <circle cx="40" cy="40" r="5" fill="black" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[#000c34] font-black text-sm truncate">
                            {t.customName ?? t.tireModel?.model ?? 'Pneu'}
                          </div>
                          {t.tireModel && (
                            <div className="text-gray-400 text-xs mt-0.5">
                              {t.tireModel.etrto} · {t.tireModel.weight}g
                            </div>
                          )}
                          <span className="inline-block mt-1.5 text-[9px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            EN STOCK
                          </span>
                        </div>
                        <div className="text-[#27509b] text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          Choisir →
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    {showAddForm ? (
                      <AddTireForm
                        token={token} catalog={catalog}
                        onSaved={async () => { await onRefresh(); setShowAddForm(false); }}
                        onCancel={() => setShowAddForm(false)}
                      />
                    ) : (
                      <button onClick={() => setShowAddForm(true)}
                        className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-[#27509b] hover:text-[#27509b] transition-all text-sm font-semibold flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Ajouter un nouveau pneu
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Browse mode ── */}
          {!assignMode && (
            <>
              {!showAddForm && (
                <button onClick={() => setShowAddForm(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:border-[#27509b] hover:text-[#27509b] transition-all flex items-center justify-center gap-2 font-semibold text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un pneu à l&apos;inventaire
                </button>
              )}
              {showAddForm && (
                <AddTireForm
                  token={token} catalog={catalog}
                  onSaved={async () => { await onRefresh(); setShowAddForm(false); }}
                  onCancel={() => setShowAddForm(false)}
                />
              )}

              {stockTires.length === 0 && installedTires.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">Votre garage est vide.</p>
                  <p className="text-gray-300 text-xs mt-1">Ajoutez vos premiers pneus ci-dessus.</p>
                </div>
              )}

              {stockTires.length > 0 && (
                <div>
                  <div className="text-[10px] font-black text-gray-400 tracking-widest mb-2">
                    EN STOCK ({stockTires.length})
                  </div>
                  <div className="space-y-2">
                    {stockTires.map(t => (
                      <TireInventoryCard
                        key={t.id} tire={t} status="stock" bikeName={null}
                        onUninstall={null}
                        onDelete={() => setConfirmDelete(t)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {installedTires.length > 0 && (
                <div>
                  <div className="text-[10px] font-black text-gray-400 tracking-widest mb-2">
                    INSTALLÉS ({installedTires.length})
                  </div>
                  <div className="space-y-2">
                    {installedTires.map(t => (
                      <TireInventoryCard
                        key={t.id} tire={t} status="installed" bikeName={getBikeName(t.bike)}
                        onUninstall={() => handleUninstall(t)}
                        onDelete={() => setConfirmDelete(t)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto">
            <h3 className="font-title text-[#000c34] text-xl mb-2">Supprimer ce pneu ?</h3>
            <p className="text-gray-500 text-sm mb-6">
              <strong>{confirmDelete.customName ?? confirmDelete.tireModel?.model ?? 'Ce pneu'}</strong>{' '}
              sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 text-sm font-black text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
