import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface GameSetting {
  id: string;
  game_name: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useGameSettings = () => {
  const [gameSettings, setGameSettings] = useState<GameSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();

  const defaultSettings = [
    { game_name: 'word_guess', is_enabled: false },
    { game_name: 'number_guess', is_enabled: false },
    { game_name: 'memory_game', is_enabled: false },
    { game_name: 'quiz_game', is_enabled: false },
    { game_name: 'rock_paper_scissors', is_enabled: false },
  ];

  const fetchGameSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from Supabase first
      const { data, error: supabaseError } = await supabase
        .from('game_settings')
        .select('*')
        .order('game_name');

      if (supabaseError) {
        console.warn('Supabase not available, using localStorage:', supabaseError.message);
        // Fallback to localStorage
        const stored = localStorage.getItem('gameSettings');
        if (stored) {
          setGameSettings(JSON.parse(stored));
        } else {
          // Initialize with default settings
          const initialSettings = defaultSettings.map((setting, index) => ({
            id: `local-${index}`,
            ...setting,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          setGameSettings(initialSettings);
          localStorage.setItem('gameSettings', JSON.stringify(initialSettings));
        }
      } else {
        setGameSettings(data || []);
      }
    } catch (err) {
      console.error('Error fetching game settings:', err);
      setError('Erro ao carregar configurações dos jogos');
    } finally {
      setLoading(false);
    }
  };

  const updateGameSetting = async (gameName: string, isEnabled: boolean) => {
    try {
      setError(null);
      console.log('Tentando atualizar jogo:', gameName, 'para:', isEnabled);

      // Try to update in Supabase first
      const { data, error: supabaseError } = await supabase
        .from('game_settings')
        .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
        .eq('game_name', gameName)
        .select();

      if (supabaseError) {
        console.error('Erro do Supabase:', supabaseError);
        console.warn('Supabase not available, using localStorage:', supabaseError.message);
        // Fallback to localStorage
        const updatedSettings = gameSettings.map(setting =>
          setting.game_name === gameName
            ? { ...setting, is_enabled: isEnabled, updated_at: new Date().toISOString() }
            : setting
        );
        setGameSettings(updatedSettings);
        localStorage.setItem('gameSettings', JSON.stringify(updatedSettings));
      } else {
        console.log('Atualização bem-sucedida:', data);
        // Refresh from Supabase
        await fetchGameSettings();
      }
    } catch (err) {
      console.error('Error updating game setting:', err);
      setError('Erro ao atualizar configuração do jogo');
    }
  };

  const isGameEnabled = (gameName: string): boolean => {
    const setting = gameSettings.find(s => s.game_name === gameName);
    return setting?.is_enabled || false;
  };

  const isAdmin = authState.user?.user_metadata?.role === 'admin';

  useEffect(() => {
    fetchGameSettings();
  }, []);

  return {
    gameSettings,
    loading,
    error,
    updateGameSetting,
    isGameEnabled,
    isAdmin,
    refetch: fetchGameSettings,
  };
}; 