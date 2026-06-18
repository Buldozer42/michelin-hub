'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  ApiBike,
  BikeTypeValue,
  getBikes,
  createBike,
  patchBike,
  destroyBike,
  BikeCreatePayload,
} from '../lib/api';

export type BikeType = BikeTypeValue;

export const BIKE_TYPES: { value: BikeType; label: string; description: string }[] = [
  { value: 'road',      label: 'Route',     description: 'Vitesse et performance sur asphalte' },
  { value: 'mountain',  label: 'VTT',       description: 'Trails et sentiers en montagne' },
  { value: 'gravel',    label: 'Gravel',    description: 'Route et chemins de terre' },
  { value: 'urban',     label: 'Urbain',    description: 'Mobilité et confort en ville' },
  { value: 'electric',  label: 'E-Bike',    description: 'Assistance électrique intégrée' },
  { value: 'bmx',       label: 'BMX',       description: 'Figures, freestyle et pump track' },
  { value: 'triathlon', label: 'Triathlon', description: 'Performance aérodynamique race' },
];

export interface Bike {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  bikeType: BikeType;
  weight?: number;
  purchaseDate?: string;
  totalDistance: number;
  imageUrl?: string;
}

interface BikeContextType {
  bikes: Bike[];
  activeBike: Bike | null;
  activeBikeId: number | null;
  loaded: boolean;
  setActiveBikeId: (id: number) => void;
  addBike: (data: Omit<Bike, 'id'>) => Promise<Bike>;
  updateBike: (id: number, updates: Partial<Omit<Bike, 'id'>>) => Promise<void>;
  deleteBike: (id: number) => Promise<void>;
}

const BikeContext = createContext<BikeContextType | null>(null);

function fromApi(b: ApiBike): Bike {
  return {
    id: b.id,
    name: b.name,
    brand: b.brand ?? undefined,
    model: b.model ?? undefined,
    bikeType: b.bikeType,
    weight: b.weight ?? undefined,
    purchaseDate: b.purchaseDate ? b.purchaseDate.slice(0, 10) : undefined,
    totalDistance: b.totalDistance,
    imageUrl: b.imageUrl ?? undefined,
  };
}

export function BikeProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [activeBikeId, setActiveBikeIdState] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) {
      setBikes([]);
      setActiveBikeIdState(null);
      setLoaded(false);
      return;
    }
    setLoaded(false);
    getBikes(token)
      .then(list => {
        const local = list.map(fromApi);
        setBikes(local);
        setActiveBikeIdState(prev => local.find(b => b.id === prev)?.id ?? local[0]?.id ?? null);
      })
      .catch(() => setBikes([]))
      .finally(() => setLoaded(true));
  }, [token]);

  const setActiveBikeId = (id: number) => setActiveBikeIdState(id);

  const addBike = async (data: Omit<Bike, 'id'>): Promise<Bike> => {
    if (!token) throw new Error('Non authentifié');
    const payload: BikeCreatePayload = {
      name: data.name,
      brand: data.brand ?? null,
      model: data.model ?? null,
      bikeType: data.bikeType,
      weight: data.weight ?? null,
      purchaseDate: data.purchaseDate ?? null,
      totalDistance: data.totalDistance,
    };
    const created = await createBike(payload, token);
    const local = fromApi(created);
    setBikes(prev => [...prev, local]);
    setActiveBikeIdState(local.id);
    return local;
  };

  const updateBike = async (id: number, updates: Partial<Omit<Bike, 'id'>>): Promise<void> => {
    if (!token) throw new Error('Non authentifié');
    const payload: Partial<BikeCreatePayload> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if ('brand' in updates) payload.brand = updates.brand ?? null;
    if ('model' in updates) payload.model = updates.model ?? null;
    if (updates.bikeType !== undefined) payload.bikeType = updates.bikeType;
    if ('weight' in updates) payload.weight = updates.weight ?? null;
    if ('purchaseDate' in updates) payload.purchaseDate = updates.purchaseDate ?? null;
    if (updates.totalDistance !== undefined) payload.totalDistance = updates.totalDistance;
    const updated = await patchBike(id, payload, token);
    setBikes(prev => prev.map(b => (b.id === id ? fromApi(updated) : b)));
  };

  const deleteBike = async (id: number): Promise<void> => {
    if (!token) throw new Error('Non authentifié');
    await destroyBike(id, token);
    setBikes(prev => {
      const next = prev.filter(b => b.id !== id);
      if (activeBikeId === id) setActiveBikeIdState(next[0]?.id ?? null);
      return next;
    });
  };

  const activeBike = bikes.find(b => b.id === activeBikeId) ?? bikes[0] ?? null;

  return (
    <BikeContext.Provider
      value={{ bikes, activeBike, activeBikeId, loaded, setActiveBikeId, addBike, updateBike, deleteBike }}
    >
      {children}
    </BikeContext.Provider>
  );
}

export function useBikes() {
  const ctx = useContext(BikeContext);
  if (!ctx) throw new Error('useBikes must be used within BikeProvider');
  return ctx;
}
