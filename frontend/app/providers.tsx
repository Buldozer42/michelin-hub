'use client';

import { AuthProvider } from './context/AuthContext';
import { BikeProvider } from './context/BikeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BikeProvider>
        {children}
      </BikeProvider>
    </AuthProvider>
  );
}
