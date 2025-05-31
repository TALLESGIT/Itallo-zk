import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Participant } from '../types';
import { getParticipants, saveParticipant, getDrawStatus, saveDrawStatus, resetSystem } from '../services/dataService';
import { toast } from 'react-toastify';

interface AppContextType {
  appState: AppState;
  addParticipant: (participant: Omit<Participant, 'id' | 'registrationDate'>) => Promise<boolean>;
  isNumberTaken: (number: number) => boolean;
  performDraw: () => Promise<Participant | null>;
  resetSystem: () => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>({
    participants: [],
    selectedNumbers: [],
    isDrawComplete: false,
    winner: null,
  });

  const refreshData = async () => {
    const participants = await getParticipants();
    const selectedNumbers = participants.map((p) => p.number);
    const drawStatus = await getDrawStatus();

    setAppState({
      participants,
      selectedNumbers,
      isDrawComplete: drawStatus.isComplete,
      winner: drawStatus.winner,
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addParticipant = async (
    participant: Omit<Participant, 'id' | 'registrationDate'>
  ): Promise<boolean> => {
    try {
      if (isNumberTaken(participant.number)) {
        toast.error('Este número já está reservado. Por favor, escolha outro.');
        return false;
      }

      if (participant.name.trim().split(' ').filter(Boolean).length < 2) {
        toast.error('Por favor, insira seu nome completo (nome e sobrenome).');
        return false;
      }

      const whatsappRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
      if (!whatsappRegex.test(participant.whatsapp)) {
        toast.error('Formato de WhatsApp inválido. Use: (XX) XXXXX-XXXX');
        return false;
      }

      const saved = await saveParticipant(participant);
      if (saved) {
        await refreshData();
        toast.success('Número reservado com sucesso!');
        return true;
      } else {
        toast.error('Erro ao reservar número. Tente novamente.');
        return false;
      }
    } catch (error) {
      toast.error('Ocorreu um erro. Por favor, tente novamente.');
      return false;
    }
  };

  const isNumberTaken = (number: number): boolean => {
    return appState.selectedNumbers.includes(number);
  };

  const performDraw = async (): Promise<Participant | null> => {
    try {
      if (appState.participants.length === 0) {
        toast.error('Não há participantes para realizar o sorteio.');
        return null;
      }

      if (appState.isDrawComplete) {
        toast.info('O sorteio já foi realizado. Reinicie o sistema para um novo sorteio.');
        return appState.winner;
      }

      const randomIndex = Math.floor(Math.random() * appState.participants.length);
      const winner = appState.participants[randomIndex];

      await saveDrawStatus({
        isComplete: true,
        drawDate: new Date().toISOString(),
        winner,
      });

      await refreshData();

      toast.success(`Sorteio realizado! O vencedor é ${winner.name} com o número ${winner.number}.`);
      return winner;
    } catch (error) {
      toast.error('Erro ao realizar o sorteio. Tente novamente.');
      return null;
    }
  };

  const handleResetSystem = async (): Promise<boolean> => {
    try {
      const success = await resetSystem();
      if (success) {
        await refreshData();
        window.location.reload();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error resetting system:', error);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        appState,
        addParticipant,
        isNumberTaken,
        performDraw,
        resetSystem: handleResetSystem,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};