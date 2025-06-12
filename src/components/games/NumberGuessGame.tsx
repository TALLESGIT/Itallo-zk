import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Trophy, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { toast } from 'react-toastify';

interface NumberGuessGameProps {
  onBack: () => void;
}

const NumberGuessGame: React.FC<NumberGuessGameProps> = ({ onBack }) => {
  const [secretNumber, setSecretNumber] = useState<number>(0);
  const [guess, setGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<{ number: number; hint: string }[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [range, setRange] = useState({ min: 1, max: 100 });

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const newNumber = Math.floor(Math.random() * 100) + 1;
    setSecretNumber(newNumber);
    setAttempts([]);
    setGameStatus('playing');
    setGuess('');
    setRange({ min: 1, max: 100 });
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
    } else if (newAttempts.length >= 10) {
      setGameStatus('lost');
      toast.error(`Que pena! O número era ${secretNumber}.`);
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

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={onBack}
              className="inline-flex items-center text-primary hover:text-primary/80 text-sm sm:text-base"
            >
              <ArrowLeft size={18} className="mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Voltar aos Jogos</span>
              <span className="xs:hidden">Voltar</span>
            </button>
            <div className="w-16 sm:w-24"></div>
          </div>
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
              <div className="text-lg sm:text-2xl font-bold text-primary">{attempts.length}/10</div>
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
                  disabled={gameStatus !== 'playing'}
                />
                <button
                  onClick={handleGuess}
                  disabled={gameStatus !== 'playing' || !guess.trim()}
                  className={`w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg transition-colors duration-200 font-medium ${
                    gameStatus === 'playing' && guess.trim()
                      ? 'bg-primary text-white hover:bg-primary/80'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
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
                      <span className={`text-xs sm:text-sm font-medium ${
                        attempt.hint === 'Acertou!' ? 'text-green-600' :
                        attempt.hint.includes('próximo') ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {attempt.hint}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Game Over */}
          {gameStatus !== 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3 sm:space-y-4"
            >
              <div className={`text-4xl sm:text-6xl ${gameStatus === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                {gameStatus === 'won' ? '🎉' : '😔'}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {gameStatus === 'won' ? 'Parabéns!' : 'Que pena!'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                {gameStatus === 'won' 
                  ? `Você descobriu o número ${secretNumber} em ${attempts.length} tentativa${attempts.length > 1 ? 's' : ''}!`
                  : `O número era ${secretNumber}. Tente novamente!`
                }
              </p>
              {gameStatus === 'won' && (
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`text-xl sm:text-2xl ${i < getScoreStars(attempts.length) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={startNewGame}
                className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
              >
                Jogar Novamente
              </button>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
            <li className="flex items-center">
              <TrendingUp className="text-green-500 mr-2 sm:mr-3 flex-shrink-0" size={14} />
              <span className="text-gray-700">Seta para cima: O número secreto é maior</span>
            </li>
            <li className="flex items-center">
              <TrendingDown className="text-red-500 mr-2 sm:mr-3 flex-shrink-0" size={14} />
              <span className="text-gray-700">Seta para baixo: O número secreto é menor</span>
            </li>
            <li className="flex items-center">
              <Target className="text-green-500 mr-2 sm:mr-3 flex-shrink-0" size={14} />
              <span className="text-gray-700">Alvo: Você acertou!</span>
            </li>
            <li className="mt-2 sm:mt-3 text-gray-700">
              • Você tem 10 tentativas para descobrir o número
            </li>
            <li className="text-gray-700">
              • Use as dicas para estreitar o intervalo de busca
            </li>
            <li className="text-gray-700">
              • Quanto menos tentativas, mais estrelas você ganha!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NumberGuessGame; 