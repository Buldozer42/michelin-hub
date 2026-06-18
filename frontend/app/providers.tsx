'use client';

import { AuthProvider } from './context/AuthContext';
import { BikeProvider } from './context/BikeContext';
import { StravaProvider } from './context/StravaContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BikeProvider>
        <StravaProvider>
          {children}
        </StravaProvider>
      </BikeProvider>
    </AuthProvider>
  );
}
