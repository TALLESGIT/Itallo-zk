import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Trophy, RotateCcw, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import useGameCooldown from '../../hooks/useGameCooldown';
import { useGameSettings } from '../../hooks/useGameSettings';
import { useGameWinners } from '../../hooks/useGameWinners';
import { useAuth } from '../../contexts/AuthContext';

interface MemoryGameProps {
  onBack: () => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

type GameStatus = 'playing' | 'won' | 'lost';

const emojis = ['🎮', '🎯', '🏆', '⭐', '🎲', '🎪', '🎨', '🎭'];
const MAX_GAME_TIME = 180;

const MemoryGame: React.FC<MemoryGameProps> = ({ onBack }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const gameId = 'memory_game';
  const { isCoolingDown, setCooldown, CooldownMessage } = useGameCooldown(gameId);
  const { isAdmin } = useGameSettings();
  const { addWinner } = useGameWinners();
  const { authState } = useAuth();

  useEffect(() => {
    if (!isCoolingDown) {
      initializeGame();
    }
  }, [isCoolingDown]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && gameStatus === 'playing' && timeElapsed < MAX_GAME_TIME && !isCoolingDown) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => {
          if (prev + 1 >= MAX_GAME_TIME) {
            setGameStatus('lost');
            setCooldown(180);
            toast.error(`Tempo esgotado! Tente novamente após o cooldown.`);
            return MAX_GAME_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (timeElapsed >= MAX_GAME_TIME && gameStatus === 'playing') {
      setGameStatus('lost');
      setCooldown(180);
      toast.error(`Tempo esgotado! Tente novamente após o cooldown.`);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameStatus, timeElapsed, isCoolingDown, setCooldown]);

  const initializeGame = () => {
    if (isCoolingDown) return;

    const shuffledEmojis = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    
    setCards(shuffledEmojis);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStatus('playing');
    setTimeElapsed(0);
    setGameStarted(false);
  };

  const handleCardClick = (cardId: number) => {
    if (isCoolingDown || gameStatus !== 'playing') return;

    if (!gameStarted) {
      setGameStarted(true);
    }

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Flip the card
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isMatched: true }
              : c
          ));
          setMatches(prev => {
            const newMatches = prev + 1;
            // Check if game is won
            if (newMatches === emojis.length && gameStatus === 'playing') {
              setGameStatus('won');
              toast.success(`Parabéns! Você completou o jogo em ${moves + 1} movimentos!`);
              addWinner?.({
                game_id: 'memory_game',
                player_name: getPlayerName(),
                score: Math.max(10, 200 - ((moves + 1 - 8) * 6) - Math.floor((timeElapsed + 1) / 2)),
                time_taken: timeElapsed + 1,
                attempts: moves + 1,
                difficulty: 'normal',
                game_data: { moves: moves + 1 },
              });
            }
            return newMatches;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreStars = (moves: number): number => {
    if (moves <= 12) return 5;
    if (moves <= 16) return 4;
    if (moves <= 20) return 3;
    if (moves <= 25) return 2;
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center justify-center">
              <Star className="mr-2 text-primary" size={24} />
              <span className="hidden sm:inline">Jogo da Memória</span>
              <span className="sm:hidden">Memória</span>
            </h1>
          </div>
          <div className="h-6 mb-2" />
        </div>

        {/* Game Info */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-primary">{moves}</div>
              <div className="text-xs sm:text-sm text-gray-600">Movimentos</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-primary">{matches}/{emojis.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Pares</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-lg sm:text-2xl font-bold text-primary flex items-center justify-center">
                <Clock size={16} className="mr-1" />
                {formatTime(timeElapsed)} / {formatTime(MAX_GAME_TIME)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Tempo</div>
            </div>
            <div className="hidden sm:block">
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {gameStatus === 'won' ? '🏆' : gameStatus === 'lost' ? '😔' : '🎯'}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-2xl mx-auto">
            {cards.map((card) => (
              <motion.div
                key={card.id}
                className={`aspect-square rounded-lg sm:rounded-xl cursor-pointer transition-all duration-300 ${
                  card.isMatched 
                    ? 'bg-green-100 border-2 border-green-300' 
                    : card.isFlipped 
                      ? 'bg-blue-100 border-2 border-blue-300' 
                      : 'bg-gray-100 border-2 border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => handleCardClick(card.id)}
                whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
                initial={{ rotateY: 0 }}
                animate={{ 
                  rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                  scale: card.isMatched ? 1.1 : 1
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl md:text-4xl">
                  {card.isFlipped || card.isMatched ? (
                    <span style={{ transform: 'rotateY(180deg)' }}>
                      {card.emoji}
                    </span>
                  ) : (
                    <span className="text-gray-400">?</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Game Over / Lost Messages */}
          {gameStatus !== 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3 sm:space-y-4 mt-6 sm:mt-8"
            >
              {gameStatus === 'won' ? (
                <>
                  <div className="text-4xl sm:text-6xl">🎉</div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                    Parabéns! Você completou o jogo!
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 px-2">
                    Você encontrou todos os pares em {moves} movimentos e {formatTime(timeElapsed)}!
                  </p>
                  <div className="flex justify-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-xl sm:text-2xl ${i < getScoreStars(moves) ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl sm:text-6xl">😔</div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                    Que pena! O tempo esgotou.
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 px-2">
                    Tente novamente após o cooldown.
                  </p>
                </>
              )}
              <button
                onClick={initializeGame}
                disabled={isCoolingDown}
                className={`inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors${isCoolingDown ? ' opacity-50 cursor-not-allowed' : ''}`}
              >
                Jogar Novamente
              </button>
            </motion.div>
          )}
        </div>

        {/* Instruções */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
          <ul className="space-y-1 text-sm text-gray-700 mt-2">
            <li>• Clique nas cartas para virá-las e revelar os emojis</li>
            <li>• Encontre todos os pares de cartas iguais</li>
            <li>• Complete o jogo antes do tempo acabar</li>
            <li>• Quanto menos movimentos, mais estrelas você ganha!</li>
            <li>• O cronômetro limita o tempo para cada rodada</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MemoryGame; 