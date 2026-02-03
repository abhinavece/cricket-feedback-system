import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Tournament } from '../types';
import { tournamentApi } from '../services/api';

interface TournamentContextType {
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament | null) => void;
  refreshTournament: () => Promise<void>;
  loading: boolean;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshTournament = useCallback(async () => {
    if (!currentTournament?._id) return;
    
    setLoading(true);
    try {
      const response = await tournamentApi.get(currentTournament._id);
      if (response.success && response.data) {
        setCurrentTournament(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh tournament:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTournament?._id]);

  return (
    <TournamentContext.Provider
      value={{
        currentTournament,
        setCurrentTournament,
        refreshTournament,
        loading,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
