'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type BikeType = 'ROUTE' | 'VTT' | 'GRAVEL' | 'CYCLOCROSS' | 'URBAIN' | 'E-BIKE';

export const BIKE_TYPES: {
  value: BikeType;
  label: string;
  description: string;
}[] = [
  { value: 'ROUTE',     label: 'Route',       description: 'Vitesse et performance sur asphalte' },
  { value: 'VTT',       label: 'VTT',         description: 'Trails et sentiers en montagne' },
  { value: 'GRAVEL',    label: 'Gravel',       description: 'Route et chemins de terre' },
  { value: 'CYCLOCROSS',label: 'Cyclo-cross',  description: 'Polyvalence tous terrains' },
  { value: 'URBAIN',    label: 'Urbain',       description: 'Mobilité et confort en ville' },
  { value: 'E-BIKE',    label: 'E-Bike',       description: 'Assistance électrique intégrée' },
];

export interface Bike {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  type: BikeType;
  weight?: number;         // kg (float)
  purchaseDate?: string;   // ISO date
  totalDistance: number;   // km (float)
}

interface BikeContextType {
  bikes: Bike[];
  activeBike: Bike | null;
  activeBikeId: number | null;
  loaded: boolean;
  setActiveBikeId: (id: number) => void;
  addBike: (data: Omit<Bike, 'id'>) => Bike;
  updateBike: (id: number, updates: Partial<Omit<Bike, 'id'>>) => void;
  deleteBike: (id: number) => void;
}

const BikeContext = createContext<BikeContextType | null>(null);

export function BikeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [bikes, setBikes] = useState<Bike[]>([]);
  const [activeBikeId, setActiveBikeIdState] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage when user changes
  useEffect(() => {
    if (!userId) {
      setBikes([]);
      setActiveBikeIdState(null);
      setLoaded(false);
      return;
    }
    const key = `michelin_hub_bikes_${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBikes(parsed.bikes ?? []);
        setActiveBikeIdState(parsed.activeBikeId ?? null);
      } catch { /* ignore corrupted data */ }
    } else {
      setBikes([]);
      setActiveBikeIdState(null);
    }
    setLoaded(true);
  }, [userId]);

  // Persist on every change
  useEffect(() => {
    if (!userId || !loaded) return;
    const key = `michelin_hub_bikes_${userId}`;
    localStorage.setItem(key, JSON.stringify({ bikes, activeBikeId }));
  }, [bikes, activeBikeId, userId, loaded]);

  const setActiveBikeId = (id: number) => setActiveBikeIdState(id);

  const addBike = (data: Omit<Bike, 'id'>): Bike => {
    const newBike: Bike = { ...data, id: Date.now() };
    setBikes(prev => [...prev, newBike]);
    setActiveBikeIdState(newBike.id);
    return newBike;
  };

  const updateBike = (id: number, updates: Partial<Omit<Bike, 'id'>>) => {
    setBikes(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBike = (id: number) => {
    setBikes(prev => {
      const next = prev.filter(b => b.id !== id);
      if (activeBikeId === id) {
        setActiveBikeIdState(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const activeBike =
    bikes.find(b => b.id === activeBikeId) ?? bikes[0] ?? null;

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
