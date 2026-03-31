"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SearchContextType {
  lastResult: any | null;
  lastArea: string;
  setLastResult: (result: any | null) => void;
  setLastArea: (area: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [lastArea, setLastArea] = useState<string>("");

  const clearSearch = () => {
    setLastResult(null);
    setLastArea("");
  };

  return (
    <SearchContext.Provider value={{ 
      lastResult, 
      lastArea, 
      setLastResult, 
      setLastArea, 
      clearSearch 
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
