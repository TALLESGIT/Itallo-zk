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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-primary hover:text-primary/80"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar aos Jogos
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Zap className="mr-2 text-primary" size={28} />
              Adivinhe o Número
            </h1>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Game Info */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{range.min} - {range.max}</div>
              <div className="text-sm text-gray-600">Intervalo Atual</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{attempts.length}/10</div>
              <div className="text-sm text-gray-600">Tentativas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {gameStatus === 'won' ? '🏆' : gameStatus === 'lost' ? '😔' : '🎯'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Input Area */}
          {gameStatus === 'playing' && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digite um número entre {range.min} e {range.max}:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Digite um número..."
                    min={range.min}
                    max={range.max}
                  />
                  <button
                    onClick={handleGuess}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Tentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attempts Display */}
          {attempts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Suas Tentativas:</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {attempts.map((attempt, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="text-lg font-semibold text-gray-800">
                        {attempt.number}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {attempt.hint.includes('Maior') && <TrendingUp className="text-green-500" size={20} />}
                      {attempt.hint.includes('Menor') && <TrendingDown className="text-red-500" size={20} />}
                      {attempt.hint === 'Acertou!' && <Target className="text-green-500" size={20} />}
                      <span className={`text-sm font-medium ${
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
              className="text-center space-y-4"
            >
              <div className={`text-6xl ${gameStatus === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                {gameStatus === 'won' ? '🎉' : '😔'}
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {gameStatus === 'won' ? 'Parabéns!' : 'Que pena!'}
              </h3>
              <p className="text-gray-600">
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
                      className={`text-2xl ${i < getScoreStars(attempts.length) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={startNewGame}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Jogar Novamente
              </button>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <TrendingUp className="text-green-500 mr-3" size={16} />
              Seta para cima: O número secreto é maior
            </li>
            <li className="flex items-center">
              <TrendingDown className="text-red-500 mr-3" size={16} />
              Seta para baixo: O número secreto é menor
            </li>
            <li className="flex items-center">
              <Target className="text-green-500 mr-3" size={16} />
              Alvo: Você acertou!
            </li>
            <li className="mt-3 text-gray-700">
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