import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Frown, Smile, RotateCcw, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { useGameWinners } from '../../hooks/useGameWinners';
import useGameCooldown from '../../hooks/useGameCooldown';
import { useGameSettings } from '../../hooks/useGameSettings';
import { useAuth } from '../../contexts/AuthContext';

interface HangmanGameProps {
  onBack?: () => void; // Se usado isolado, pode não ter botão de voltar
}

type GameStatus = 'playing' | 'won' | 'lost' | 'blocked';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const HangmanGame: React.FC<HangmanGameProps> = ({ onBack }) => {
  const { addWinner } = useGameWinners();
  const { isAdmin, isGameEnabled } = useGameSettings();
  const { authState } = useAuth();

  const [secretWord, setSecretWord] = useState<string>('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const maxWrong = 6;
  const INITIAL_TIME = 60; // segundos
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const gameId = 'hangman_game';
  const { isCoolingDown, setCooldown, CooldownMessage } = useGameCooldown(gameId);

  if (!isAdmin && !isGameEnabled('hangman_game')) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Jogo Bloqueado</h2>
          <p className="text-gray-700 mb-4">O administrador bloqueou temporariamente o acesso ao Jogo da Forca.<br/>Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  // Buscar palavra do banco ou fallback
  const fetchWord = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_words')
        .select('word')
        .eq('is_active', true)
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setSecretWord(data[0].word.toUpperCase());
        setTimeLeft(INITIAL_TIME);
        setTimerActive(true);
      } else {
        const fallback = ['DESENVOLVIMENTO', 'PROGRAMACAO', 'JAVASCRIPT', 'SUPABASE'];
        setSecretWord(fallback[Math.floor(Math.random() * fallback.length)]);
        setTimeLeft(INITIAL_TIME);
        setTimerActive(true);
      }
    } catch (err) {
      console.error(err);
      const fallback = ['HANGMAN', 'REACT', 'VITE', 'TYPESCRIPT'];
      setSecretWord(fallback[Math.floor(Math.random() * fallback.length)]);
      setTimeLeft(INITIAL_TIME);
      setTimerActive(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isCoolingDown) {
      fetchWord();
    }
  }, [isCoolingDown]);

  // Bloqueio por vitória
  useEffect(() => {
    if (secretWord) {
      const wonKey = `hangman_won_${secretWord}`;
      if (localStorage.getItem(wonKey) === 'true') {
        setGameStatus('blocked');
      }
    }
  }, [secretWord]);

  // Efetuar contagem regressiva
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && gameStatus === 'playing' && timeLeft > 0 && !isCoolingDown) {
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

    return () => clearInterval(interval);
  }, [timerActive, gameStatus, timeLeft, isCoolingDown, setCooldown]);

  // Verificar status a cada alteração
  useEffect(() => {
    if (!secretWord) return;

    if (gameStatus === 'won' || gameStatus === 'lost') return; // Evita múltiplos toasts

    const hasWon = secretWord.split('').every((l) => guessedLetters.includes(l));
    if (hasWon) {
      setGameStatus('won');
      toast.success('Parabéns! Você venceu 🎉');
      localStorage.setItem(`hangman_won_${secretWord}`, 'true');
      addWinner?.({
        game_id: 'hangman_game',
        player_name: authState.isAuthenticated && authState.user ? (authState.user.user_metadata?.name || (authState.user.email ? authState.user.email.split('@')[0] : 'Usuário')) : 'Anônimo',
        score: Math.max(0, secretWord.length * 10 - wrongGuesses * 5),
        time_taken: INITIAL_TIME - timeLeft,
        attempts: guessedLetters.length,
        difficulty: 'normal',
        game_data: { word: secretWord },
      });
    } else if (wrongGuesses >= maxWrong) {
      setGameStatus('lost');
      setCooldown(180);
      toast.error(`Você perdeu! Tente novamente após o cooldown.`);
    }
  }, [guessedLetters, wrongGuesses, secretWord, gameStatus, addWinner, setCooldown, isAdmin, authState]);

  const handleLetterClick = (letter: string) => {
    if (gameStatus !== 'playing' || guessedLetters.includes(letter) || isCoolingDown) return;

    setGuessedLetters((prev) => [...prev, letter]);
    if (!secretWord.includes(letter)) {
      setWrongGuesses((prev) => prev + 1);
    }
  };

  const resetGame = () => {
    if (isCoolingDown) return;

    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus('playing');
    setLoading(true);
    setTimeLeft(INITIAL_TIME);
    setTimerActive(false);
    fetchWord();
  };

  const renderWord = () => {
    return secretWord.split('').map((letter, idx) => (
      <span
        key={idx}
        className="inline-block w-6 sm:w-8 md:w-10 border-b-2 border-gray-500 text-center text-lg sm:text-xl font-mono mr-1"
      >
        {guessedLetters.includes(letter) || gameStatus === 'won' ? letter : ''}
      </span>
    ));
  };

  const renderHangman = () => {
    // Simple ASCII-like hangman using divs
    return (
      <div className="flex flex-col items-center">
        <div className="h-2 w-24 bg-gray-800 mb-1" />
        <div className="h-40 w-2 bg-gray-800 relative">
          {/* rope */}
          <div className="absolute top-0 left-full h-2 w-12 bg-gray-800" />
          <div className="absolute top-0 left-[calc(100%+48px)] h-8 w-1 bg-gray-800" />
          {/* head */}
          {wrongGuesses > 0 && (
            <div className="absolute top-8 left-[calc(100%+32px)] w-8 h-8 border-2 border-gray-800 rounded-full flex items-center justify-center">
              {wrongGuesses >= maxWrong && <Frown className="text-red-500" size={20} />}
            </div>
          )}
          {/* body */}
          {wrongGuesses > 1 && (
            <div className="absolute top-16 left-[calc(100%+47px)] w-1 h-12 bg-gray-800" />
          )}
          {/* arms */}
          {wrongGuesses > 2 && (
            <div className="absolute top-20 left-[calc(100%+48px)] w-12 h-1 bg-gray-800" />
          )}
          {wrongGuesses > 3 && (
            <div className="absolute top-20 left-[calc(100%+48px)] w-12 h-1 bg-gray-800 rotate-90 origin-left" />
          )}
          {/* legs */}
          {wrongGuesses > 4 && (
            <div className="absolute top-28 left-[calc(100%+48px)] w-10 h-1 bg-gray-800 rotate-45 origin-left" />
          )}
          {wrongGuesses > 5 && (
            <div className="absolute top-28 left-[calc(100%+48px)] w-10 h-1 bg-gray-800 -rotate-45 origin-left" />
          )}
        </div>
      </div>
    );
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

  if (loading) {
    return (
      <div className="text-center py-8">Carregando palavra...</div>
    );
  }

  if (gameStatus === 'blocked') {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center max-w-md">
          <h2 className="text-xl font-bold text-green-800 mb-2">Parabéns!</h2>
          <p className="text-gray-700 mb-4">Você já venceu a palavra atual.<br/> Aguarde o administrador trocar a palavra para jogar novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center text-primary hover:text-primary/80 text-sm"
          >
            <ArrowLeft size={18} className="mr-1" /> Voltar
          </button>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mx-auto">Jogo da Forca</h2>
        <div className="w-6" />
      </div>

      {/* Timer & Hangman */}
      <div className="flex flex-col items-center mb-6 gap-2">
        {/* Timer */}
        <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
          <Clock className="text-blue-600" size={18} />
          <span className="font-semibold text-blue-800">
            {timeLeft}s
          </span>
        </div>
        {/* Hangman drawing */}
        {renderHangman()}
      </div>

      {/* Word display */}
      <div className="flex justify-center mb-6 flex-wrap gap-y-2">{renderWord()}</div>

      {/* Alphabet buttons */}
      <div className="grid grid-cols-10 gap-1 sm:gap-2 justify-center mb-6">
        {alphabet.map((letter) => {
          const disabled = guessedLetters.includes(letter) || gameStatus !== 'playing' || isCoolingDown;
          return (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              disabled={disabled}
              className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-sm sm:text-base font-bold rounded-md border transition-colors duration-150 ${
                disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/80'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Status */}
      {gameStatus !== 'playing' && (
        <div className={`text-center mb-4 text-lg font-semibold ${gameStatus === 'won' ? 'text-green-600' : 'text-red-600'}`}>
          {gameStatus === 'won' ? (
            <span className="inline-flex items-center gap-1"><Smile size={20}/> Você venceu!</span>
          ) : (
            <span className="inline-flex items-center gap-1"><Frown size={20}/> Você perdeu!</span>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <button
          onClick={resetGame}
          className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <RotateCcw size={18} /> Reiniciar
        </button>
      </div>

      {/* Instruções */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mt-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-green-400 inline-block border border-green-500"></span>
            <span className="text-sm text-gray-800">Verde: Letra correta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-gray-400 inline-block border border-gray-500"></span>
            <span className="text-sm text-gray-800">Cinza: Letra já tentada/incorreta</span>
          </div>
        </div>
        <ul className="space-y-1 text-sm text-gray-700 mt-2">
          <li>• Clique nas letras para tentar adivinhar a palavra secreta</li>
          <li>• Você tem {maxWrong} chances de errar antes de perder</li>
          <li>• O cronômetro limita o tempo para cada rodada</li>
          <li>• Ganhe se acertar todas as letras antes de acabar o tempo ou as tentativas</li>
        </ul>
      </div>
    </div>
  );
};

export default HangmanGame; 