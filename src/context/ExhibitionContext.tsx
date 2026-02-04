'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of our cache
interface CacheData {
  exhibitions: any[];
  timestamp: number;
}

interface ExhibitionContextType {
  dashboardCache: CacheData | null;
  exploreCache: CacheData | null;
  setDashboardCache: (data: any[] | null) => void;
  setExploreCache: (data: any[] | null) => void;
  invalidateCache: () => void;
}

const ExhibitionContext = createContext<ExhibitionContextType | undefined>(undefined);

export function ExhibitionProvider({ children }: { children: ReactNode }) {
  const [dashboardCache, setDashboardState] = useState<CacheData | null>(null);
  const [exploreCache, setExploreState] = useState<CacheData | null>(null);

  const setDashboardCache = (data: any[] | null) => {
    if (data === null) {
      setDashboardState(null);
    } else {
      setDashboardState({
        exhibitions: data,
        timestamp: Date.now()
      });
    }
  };

  const setExploreCache = (data: any[] | null) => {
    if (data === null) {
      setExploreState(null);
    } else {
      setExploreState({
        exhibitions: data,
        timestamp: Date.now()
      });
    }
  };

  const invalidateCache = () => {
    setDashboardState(null);
    setExploreState(null);
  };

  return (
    <ExhibitionContext.Provider value={{ 
      dashboardCache, 
      exploreCache, 
      setDashboardCache, 
      setExploreCache,
      invalidateCache 
    }}>
      {children}
    </ExhibitionContext.Provider>
  );
}

export function useExhibitionCache() {
  const context = useContext(ExhibitionContext);
  if (context === undefined) {
    throw new Error('useExhibitionCache must be used within an ExhibitionProvider');
  }
  return context;
}
