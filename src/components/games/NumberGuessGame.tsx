import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Trophy, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import useGameCooldown from '../../hooks/useGameCooldown';
import { useGameSettings } from '../../hooks/useGameSettings';
import { useGameWinners } from '../../hooks/useGameWinners';
import { useAuth } from '../../contexts/AuthContext';

interface NumberGuessGameProps {
  onBack: () => void;
}

const NumberGuessGame: React.FC<NumberGuessGameProps> = ({ onBack }) => {
  const [secretNumber, setSecretNumber] = useState<number>(0);
  const [guess, setGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<{ number: number; hint: string }[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [range, setRange] = useState({ min: 1, max: 100 });

  const MAX_ATTEMPTS = 3;
  
  const gameId = 'number_guess_game';
  const { isCoolingDown, setCooldown, CooldownMessage } = useGameCooldown(gameId);
  const { isAdmin } = useGameSettings();
  const { addWinner } = useGameWinners();
  const { authState } = useAuth();

  useEffect(() => {
    if (!isCoolingDown) {
      fetchSecretAndStart();
    }

    // Gerar um nome de canal único por instância para evitar erro de múltiplas inscrições
    const uniqueChannelName = `public:number_guess_config_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'number_guess_config' }, payload => {
        if (payload.new?.secret) {
          setSecretNumber(payload.new.secret);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isCoolingDown]);

  const fetchSecretAndStart = async () => {
    try {
      const { data, error } = await supabase
        .from('number_guess_config')
        .select('secret')
        .order('id', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      if (data) {
        setSecretNumber(data.secret);
      } else {
        toast.error('Jogo indisponível: número não configurado.');
        setSecretNumber(0);
        return;
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar número secreto.');
      setSecretNumber(0);
      return;
    }

    setAttempts([]);
    setGameStatus('playing');
    setGuess('');
    setRange({ min: 1, max: 100 });
  };

  const startNewGame = () => {
    if (isCoolingDown) return;
    fetchSecretAndStart();
  };

  const getHint = (guessNum: number, secret: number): string => {
    const diff = Math.abs(guessNum - secret);
    
    if (diff === 0) return 'Acertou!';
    if (diff <= 5) return guessNum > secret ? 'Muito próximo! Menor' : 'Muito próximo! Maior';
    if (diff <= 15) return guessNum > secret ? 'Próximo! Menor' : 'Próximo! Maior';
    if (diff <= 30) return guessNum > secret ? 'Menor' : 'Maior';
    return guessNum > secret ? 'Muito menor' : 'Muito maior';
  };

  const handleGuess = () => {
    if (isCoolingDown || gameStatus !== 'playing') return;

    const guessNum = parseInt(guess);
    
    if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) {
      toast.warning('Digite um número válido entre 1 e 100!');
      return;
    }

    if (attempts.some(attempt => attempt.number === guessNum)) {
      toast.warning('Você já tentou esse número!');
      return;
    }

    const hint = getHint(guessNum, secretNumber);
    const newAttempts = [...attempts, { number: guessNum, hint }];
    setAttempts(newAttempts);

    // Atualizar range baseado na tentativa
    let newRange = { ...range };
    if (guessNum < secretNumber) {
      newRange.min = Math.max(newRange.min, guessNum + 1);
    } else if (guessNum > secretNumber) {
      newRange.max = Math.min(newRange.max, guessNum - 1);
    }
    setRange(newRange);

    if (guessNum === secretNumber) {
      setGameStatus('won');
      toast.success(`Parabéns! Você descobriu o número em ${newAttempts.length} tentativa${newAttempts.length > 1 ? 's' : ''}!`);
      addWinner?.({
        game_id: 'number_guess',
        player_name: getPlayerName(),
        score: Math.max(0, 100 - (newAttempts.length - 1) * 30),
        time_taken: newAttempts.length,
        attempts: newAttempts.length,
        difficulty: 'normal',
        game_data: { number: secretNumber },
      });
    } else if (newAttempts.length >= MAX_ATTEMPTS) {
      setGameStatus('lost');
      setCooldown(180);
      toast.error(`Que pena! Você atingiu o limite de tentativas. Tente novamente após o cooldown.`);
    }

    setGuess('');
  };

  const getScoreStars = (attempts: number): number => {
    if (attempts <= 3) return 5;
    if (attempts <= 5) return 4;
    if (attempts <= 7) return 3;
    if (attempts <= 9) return 2;
    return 1;
  };

  const getPlayerName = () => {
    if (authState.isAuthenticated && authState.user) {
      return authState.user.user_metadata?.name || (authState.user.email ? authState.user.email.split('@')[0] : 'Usuário');
    }
    return 'Anônimo';
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

  if (!isAdmin && isCoolingDown) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 flex items-center justify-center min-h-[50vh]">
        <CooldownMessage />
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
              <Zap className="mr-2 text-primary" size={24} />
              <span className="hidden sm:inline">Adivinhe o Número</span>
              <span className="sm:hidden">Adivinhe o Número</span>
            </h1>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-primary">{range.min} - {range.max}</div>
              <div className="text-xs sm:text-sm text-gray-600">Intervalo</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-primary">{attempts.length}/{MAX_ATTEMPTS}</div>
              <div className="text-xs sm:text-sm text-gray-600">Tentativas</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {gameStatus === 'won' ? '🏆' : gameStatus === 'lost' ? '😔' : '🎯'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
          {/* Input Area - Sempre visível */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digite um número entre {range.min} e {range.max}:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && gameStatus === 'playing' && handleGuess()}
                  className="flex-1 px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                  placeholder={gameStatus === 'playing' ? "Digite um número..." : "Jogo finalizado"}
                  min={range.min}
                  max={range.max}
                  disabled={gameStatus !== 'playing' || isCoolingDown || secretNumber === 0}
                />
                <button
                  onClick={handleGuess}
                  disabled={gameStatus !== 'playing' || !guess.trim() || isCoolingDown || secretNumber === 0}
                  className={`inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors${gameStatus !== 'playing' || !guess.trim() || isCoolingDown || secretNumber === 0 ? ' opacity-50 cursor-not-allowed' : ''}`}
                >
                  {gameStatus === 'playing' ? 'Tentar' : 'Finalizado'}
                </button>
              </div>
            </div>
          </div>

          {/* Attempts Display */}
          {attempts.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Suas Tentativas:</h3>
              <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                {attempts.map((attempt, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="text-base sm:text-lg font-semibold text-gray-800">
                        {attempt.number}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {attempt.hint.includes('Maior') && <TrendingUp className="text-green-500" size={16} />}
                      {attempt.hint.includes('Menor') && <TrendingDown className="text-red-500" size={16} />}
                      {attempt.hint === 'Acertou!' && <Target className="text-green-500" size={16} />}
                      <span className="text-xs sm:text-sm text-gray-600">{attempt.hint}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Game Over / Win */}
          {(gameStatus !== 'playing' && !isCoolingDown) && (
            <div className="text-center mt-6">
              {gameStatus === 'won' ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg"
                >
                  <Trophy className="mx-auto mb-2" size={30} />
                  <p className="font-bold">Parabéns! Você venceu!</p>
                  <p className="text-sm text-gray-700">Você encontrou o número em {attempts.length} tentativa{attempts.length > 1 ? 's' : ''}.</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg"
                >
                  <AlertCircle className="mx-auto mb-2" size={30} />
                  <p className="font-bold">Que pena! Você perdeu.</p>
                  <p className="text-sm text-gray-700">Você atingiu o limite de tentativas.</p>
                </motion.div>
              )}
              <button
                onClick={startNewGame}
                disabled={isCoolingDown}
                className={`inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors${isCoolingDown ? ' opacity-50 cursor-not-allowed' : ''}`}
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
              <span className="text-sm text-gray-800">Verde: Acertou o número</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-blue-400 inline-block border border-blue-500"></span>
              <span className="text-sm text-gray-800">Azul: Dica - tente um número maior</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-red-400 inline-block border border-red-500"></span>
              <span className="text-sm text-gray-800">Vermelho: Dica - tente um número menor</span>
            </div>
          </div>
          <ul className="space-y-1 text-sm text-gray-700 mt-2">
            <li>• Você tem {MAX_ATTEMPTS} tentativas para acertar o número secreto</li>
            <li>• O intervalo de números é atualizado a cada tentativa</li>
            <li>• Use as dicas de cor para ajustar seu próximo palpite</li>
            <li>• O cronômetro limita o tempo para cada rodada</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NumberGuessGame; 