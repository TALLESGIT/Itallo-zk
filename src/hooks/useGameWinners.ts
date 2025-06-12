import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface GameWinner {
  id: number;
  game_id: string;
  player_name: string;
  score: number;
  time_taken: number;
  attempts: number;
  difficulty: string;
  game_data: any;
  created_at: string;
}

export const useGameWinners = () => {
  const [winners, setWinners] = useState<GameWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('game_winners')
        .select('*')
        .order('score', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setWinners(data || []);
    } catch (err) {
      console.error('Erro ao buscar ganhadores:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getWinnersByGame = (gameId: string, limit: number = 5) => {
    return winners
      .filter(winner => winner.game_id === gameId)
      .slice(0, limit);
  };

  const addWinner = async (winnerData: Omit<GameWinner, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('game_winners')
        .insert([winnerData])
        .select()
        .single();

      if (error) throw error;

      // Atualizar a lista local
      setWinners(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Erro ao adicionar ganhador:', err);
      throw err;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) {
      return '--';
    }
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getGameStats = (gameId: string) => {
    const gameWinners = winners.filter(w => w.game_id === gameId);
    
    if (gameWinners.length === 0) {
      return {
        totalPlayers: 0,
        averageScore: 0,
        bestScore: 0,
        averageTime: 0,
        bestTime: 0
      };
    }

    const scores = gameWinners.map(w => w.score).filter(s => s !== null);
    const times = gameWinners.map(w => w.time_taken).filter(t => t !== null);

    return {
      totalPlayers: gameWinners.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      averageTime: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      bestTime: times.length > 0 ? Math.min(...times) : 0
    };
  };

  useEffect(() => {
    fetchWinners();

    // Escutar alterações em tempo real na tabela game_winners
    const channel = supabase
      .channel('public:game_winners')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_winners' },
        (payload: any) => {
          // Atualizar localmente sem esperar nova consulta
          setWinners(prev => {
            switch (payload.eventType) {
              case 'INSERT':
                return [payload.new, ...prev];
              case 'UPDATE':
                return prev.map(w => w.id === payload.new.id ? payload.new : w);
              case 'DELETE':
                return prev.filter(w => w.id !== payload.old.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    // Fallback: polling a cada 30s para garantir sincronização
    const poll = setInterval(() => {
      fetchWinners();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, []);

  return {
    winners,
    loading,
    error,
    getWinnersByGame,
    addWinner,
    formatTime,
    getGameStats,
    refetch: fetchWinners
  };
}; 