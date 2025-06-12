import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Trophy, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

interface WordGuessGameProps {
  onBack: () => void;
}

const WordGuessGame: React.FC<WordGuessGameProps> = ({ onBack }) => {
  const [secretWord, setSecretWord] = useState<string>('');
  const [guess, setGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [loading, setLoading] = useState(true);
  const [hint, setHint] = useState<string>('');

  useEffect(() => {
    fetchSecretWord();
  }, []);

  const fetchSecretWord = async () => {
    try {
      const { data, error } = await supabase
        .from('game_words')
        .select('word, hint')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Erro ao buscar palavra:', error);
        toast.error('Erro ao carregar o jogo. Tente novamente.');
        return;
      }

      if (data) {
        setSecretWord(data.word.toUpperCase());
        setHint(data.hint || '');
      } else {
        toast.info('Nenhuma palavra ativa encontrada. Aguarde o administrador configurar uma nova palavra.');
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro ao carregar o jogo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = () => {
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
      setGameStatus('won');
      toast.success('Parabéns! Você descobriu a palavra!');
    } else if (newAttempts.length >= 5) {
      setGameStatus('lost');
      toast.error(`Que pena! A palavra era: ${secretWord}`);
    } else {
      toast.info(`Tentativa ${newAttempts.length}/5. Continue tentando!`);
    }

    setGuess('');
  };

  const resetGame = () => {
    setAttempts([]);
    setGameStatus('playing');
    setGuess('');
    fetchSecretWord();
  };

  const getLetterStatus = (letter: string, position: number, word: string) => {
    if (secretWord[position] === letter) {
      return 'correct'; // Posição correta
    } else if (secretWord.includes(letter)) {
      return 'present'; // Letra existe mas posição errada
    } else {
      return 'absent'; // Letra não existe
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  if (!secretWord) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <button
            onClick={onBack}
            className="inline-flex items-center text-primary hover:text-primary/80 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar aos Jogos
          </button>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <AlertCircle className="mx-auto mb-4 text-yellow-600" size={48} />
            <h3 className="text-xl font-bold text-yellow-800 mb-2">Jogo Indisponível</h3>
            <p className="text-yellow-700">
              Nenhuma palavra foi configurada pelo administrador ainda. Volte mais tarde!
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              <Brain className="mr-2 text-primary" size={28} />
              Descubra a Palavra
            </h1>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Game Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{secretWord.length}</div>
              <div className="text-sm text-gray-600">Letras</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{attempts.length}/5</div>
              <div className="text-sm text-gray-600">Tentativas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {gameStatus === 'won' ? '🏆' : gameStatus === 'lost' ? '😔' : '🎯'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
          {hint && (
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Dica:</strong> {hint}
              </p>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Attempts Display */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Suas Tentativas:</h3>
            <div className="space-y-2">
              {attempts.map((attempt, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-1"
                >
                  {attempt.split('').map((letter, letterIndex) => {
                    const status = getLetterStatus(letter, letterIndex, attempt);
                    return (
                      <div
                        key={letterIndex}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-white ${
                          status === 'correct' ? 'bg-green-500' :
                          status === 'present' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                  <div className="flex items-center ml-4">
                    {attempt === secretWord ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <X className="text-red-500" size={20} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          {gameStatus === 'playing' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digite sua tentativa:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Digite uma palavra..."
                    maxLength={20}
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
                  ? `Você descobriu a palavra "${secretWord}" em ${attempts.length} tentativa${attempts.length > 1 ? 's' : ''}!`
                  : `A palavra era "${secretWord}". Tente novamente!`
                }
              </p>
              <button
                onClick={resetGame}
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
              <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
              Verde: Letra correta na posição certa
            </li>
            <li className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
              Amarelo: Letra existe mas na posição errada
            </li>
            <li className="flex items-center">
              <div className="w-4 h-4 bg-gray-400 rounded mr-3"></div>
              Cinza: Letra não existe na palavra
            </li>
            <li className="mt-3 text-gray-700">
              • Você tem 5 tentativas para descobrir a palavra
            </li>
            <li className="text-gray-700">
              • Use as dicas de cores para ajudar nas próximas tentativas
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame; 