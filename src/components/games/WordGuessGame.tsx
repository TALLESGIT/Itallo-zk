import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Trophy, AlertCircle, CheckCircle, X, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import useGameCooldown from '../../hooks/useGameCooldown';
import { useGameSettings } from '../../hooks/useGameSettings';
import { useGameWinners } from '../../hooks/useGameWinners';
import { useAuth } from '../../contexts/AuthContext';

interface WordGuessGameProps {
  onBack: () => void;
}

const WordGuessGame: React.FC<WordGuessGameProps> = ({ onBack }) => {
  const [secretWord, setSecretWord] = useState<string>('');
  const [guess, setGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost' | 'blocked'>('playing');
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(59);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const gameId = 'word_guess_game';
  const { isCoolingDown, setCooldown, CooldownMessage } = useGameCooldown(gameId);
  const { isAdmin } = useGameSettings();
  const { addWinner } = useGameWinners();
  const { authState } = useAuth();

  useEffect(() => {
    if (!isCoolingDown) {
      fetchSecretWord();
    }
  }, [isCoolingDown]);

  // Bloqueio por vitória
  useEffect(() => {
    if (secretWord) {
      const wonKey = `word_guess_won_${secretWord}`;
      if (localStorage.getItem(wonKey) === 'true') {
        setGameStatus('blocked');
      }
    }
  }, [secretWord]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeLeft > 0 && gameStatus === 'playing' && !isCoolingDown) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameStatus('lost');
            setTimerActive(false);
            setCooldown(180);
            toast.error(`Tempo esgotado! Tente novamente após o cooldown.`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && gameStatus === 'playing') {
        setGameStatus('lost');
        setTimerActive(false);
        setCooldown(180);
        toast.error(`Tempo esgotado! Tente novamente após o cooldown.`);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft, gameStatus, isCoolingDown, setCooldown]);

  const fetchSecretWord = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_words')
        .select('word, hint')
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Erro ao buscar palavra:', error);
        toast.error('Erro ao carregar o jogo. Tente novamente.');
        return;
      }

      if (data && data.length > 0) {
        setSecretWord(data[0].word.toUpperCase());
        setHint(data[0].hint || '');
        setTimeLeft(59);
        setTimerActive(true);
      } else {
        console.log('Nenhuma palavra ativa encontrada');
        setSecretWord('');
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro ao carregar o jogo.');
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = () => {
    if (authState.isAuthenticated && authState.user) {
      return authState.user.user_metadata?.name || (authState.user.email ? authState.user.email.split('@')[0] : 'Usuário');
    }
    return 'Anônimo';
  };

  const handleGuess = () => {
    if (isCoolingDown || gameStatus !== 'playing') return;

    if (!guess.trim() || guess.length < 2) {
      toast.warning('Digite uma palavra válida (mínimo 2 letras).');
      return;
    }

    const normalizedGuess = guess.toUpperCase().trim();
    
    if (attempts.includes(normalizedGuess)) {
      toast.warning('Você já tentou essa palavra!');
      return;
    }

    const newAttempts = [...attempts, normalizedGuess];
    setAttempts(newAttempts);

    if (normalizedGuess === secretWord) {
      setTimerActive(false);
      toast.success('Parabéns! Você descobriu a palavra!');
      localStorage.setItem(`word_guess_won_${secretWord}`, 'true');
      setGameStatus('blocked');
      addWinner?.({
        game_id: 'word_guess',
        player_name: getPlayerName(),
        score: Math.max(0, 100 - (newAttempts.length - 1) * 20),
        time_taken: 59 - timeLeft,
        attempts: newAttempts.length,
        difficulty: 'normal',
        game_data: { word: secretWord },
      });
    } else if (newAttempts.length >= 3) {
      setGameStatus('lost');
      setTimerActive(false);
      setCooldown(180);
      toast.error(`Que pena! Tente novamente após o cooldown.`);
    } else {
      toast.info(`Tentativa ${newAttempts.length}/3. Continue tentando!`);
    }

    setGuess('');
  };

  const resetGame = () => {
    if (isCoolingDown) return;

    setAttempts([]);
    setGameStatus('playing');
    setGuess('');
    setTimeLeft(59);
    setTimerActive(false);
    fetchSecretWord();
  };

  const getLetterStatus = (letter: string, position: number, word: string) => {
    if (secretWord[position] === letter) {
      return 'correct';
    } else if (secretWord.includes(letter)) {
      return 'present';
    } else {
      return 'absent';
    }
  };

  if (!isAdmin && typeof window !== 'undefined' && localStorage.getItem('hasSelectedNumber') !== 'true') {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center max-w-md">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">Acesso restrito</h2>
          <p className="text-gray-700 mb-4">Apenas usuários cadastrados podem participar das brincadeiras.<br/>Escolha seu número e faça o cadastro para liberar o acesso!</p>
          <a href="/" className="btn btn-primary">Ir para Cadastro</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && isCoolingDown) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 flex items-center justify-center min-h-[50vh]">
        <CooldownMessage />
      </div>
    );
  }

  if (!secretWord) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
            <AlertCircle className="mx-auto mb-3 sm:mb-4 text-yellow-600" size={40} />
            <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mb-2">Jogo Indisponível</h3>
            <p className="text-sm sm:text-base text-yellow-700">
              Nenhuma palavra foi configurada pelo administrador ainda. Volte mais tarde!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (gameStatus === 'blocked') {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center max-w-md">
          <h2 className="text-xl font-bold text-green-800 mb-2">Parabéns!</h2>
          <p className="text-gray-700 mb-4">Você já descobriu a palavra atual.<br/> Aguarde o administrador trocar a palavra para jogar novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center justify-center">
              <Brain className="mr-2 text-primary" size={24} />
              <span className="hidden sm:inline">Descubra a Palavra</span>
              <span className="sm:hidden">Descubra a Palavra</span>
            </h1>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-primary">{secretWord.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Letras</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-primary">{attempts.length}/3</div>
              <div className="text-xs sm:text-sm text-gray-600">Tentativas</div>
            </div>
            <div>
              <div className={`text-xl sm:text-2xl font-bold flex items-center justify-center ${
                timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'
              }`}>
                <Clock size={16} className="mr-1" />
                {timeLeft}s
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Tempo</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {gameStatus === 'won' ? '🏆' : gameStatus === 'lost' ? '😔' : '🎯'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Status</div>
            </div>
          </div>
          {hint && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-white/50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-700">
                <strong>Dica:</strong> {hint}
              </p>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
          {/* Attempts Display */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Suas Tentativas:</h3>
            <div className="space-y-2 overflow-x-auto">
              {attempts.map((attempt, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-1 sm:gap-2 min-w-fit"
                >
                  {attempt.split('').map((letter, letterIndex) => {
                    const status = getLetterStatus(letter, letterIndex, attempt);
                    return (
                      <div
                        key={letterIndex}
                        className={`w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg font-bold text-white text-sm sm:text-base ${
                          status === 'correct' ? 'bg-green-500' :
                          status === 'present' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                  <div className="flex items-center ml-2 sm:ml-4">
                    {attempt === secretWord ? (
                      <CheckCircle className="text-green-500" size={16} />
                    ) : (
                      <X className="text-red-500" size={16} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Input and Button */}
          {(gameStatus === 'playing' && !isCoolingDown) && (
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleGuess();
                  }
                }}
                placeholder="Digite sua palavra..."
                className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-800"
                maxLength={secretWord.length}
                  disabled={gameStatus !== 'playing'}
                />
                <button
                  onClick={handleGuess}
                className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                disabled={gameStatus !== 'playing'}
              >
                <Trophy className="mr-2" size={20} />
                Adivinhar
                </button>
            </div>
          )}

          {/* Game Over / Win */}
          {(gameStatus === 'lost' && !isCoolingDown) && (
            <div className="text-center mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg"
              >
                <X className="mx-auto mb-2" size={30} />
                <p className="font-bold">Que pena! Você perdeu.</p>
              </motion.div>
              <button
                onClick={resetGame}
                className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors mt-4"
              >
                Jogar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-green-400 inline-block border border-green-500"></span>
              <span className="text-sm text-gray-800">Verde: Letra correta na posição certa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-yellow-400 inline-block border border-yellow-500"></span>
              <span className="text-sm text-gray-800">Amarelo: Letra existe mas na posição errada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-gray-400 inline-block border border-gray-500"></span>
              <span className="text-sm text-gray-800">Cinza: Letra não existe na palavra</span>
            </div>
          </div>
          <ul className="space-y-1 text-sm text-gray-700 mt-2">
            <li>• Você tem 3 tentativas e 59 segundos para descobrir a palavra</li>
            <li>• Use as dicas de cores para ajudar nas próximas tentativas</li>
            <li>• O cronômetro impede consultas externas para manter o desafio justo</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame; 