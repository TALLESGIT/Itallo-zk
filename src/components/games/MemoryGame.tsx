import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Trophy, RotateCcw, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

interface MemoryGameProps {
  onBack: () => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryGame: React.FC<MemoryGameProps> = ({ onBack }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const emojis = ['🎮', '🎯', '🏆', '⭐', '🎲', '🎪', '🎨', '🎭'];

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameStatus]);

  const initializeGame = () => {
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
          setMatches(prev => prev + 1);
          setFlippedCards([]);
          
          // Check if game is won
          if (matches + 1 === emojis.length) {
            setGameStatus('won');
            toast.success(`Parabéns! Você completou o jogo em ${moves + 1} movimentos!`);
          }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
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
              <Star className="mr-2 text-primary" size={28} />
              Jogo da Memória
            </h1>
          </div>
          <button
            onClick={initializeGame}
            className="inline-flex items-center text-primary hover:text-primary/80"
            title="Reiniciar Jogo"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Game Info */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{moves}</div>
              <div className="text-sm text-gray-600">Movimentos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{matches}/{emojis.length}</div>
              <div className="text-sm text-gray-600">Pares</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary flex items-center justify-center">
                <Clock size={20} className="mr-1" />
                {formatTime(timeElapsed)}
              </div>
              <div className="text-sm text-gray-600">Tempo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {gameStatus === 'won' ? '🏆' : '🎯'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-2xl mx-auto">
            {cards.map((card) => (
              <motion.div
                key={card.id}
                className={`aspect-square rounded-xl cursor-pointer transition-all duration-300 ${
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
                <div className="w-full h-full flex items-center justify-center text-3xl md:text-4xl">
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

          {/* Game Over */}
          {gameStatus === 'won' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4 mt-8"
            >
              <div className="text-6xl">🎉</div>
              <h3 className="text-xl font-bold text-gray-800">
                Parabéns! Você completou o jogo!
              </h3>
              <p className="text-gray-600">
                Você encontrou todos os pares em {moves} movimentos e {formatTime(timeElapsed)}!
              </p>
              <div className="flex justify-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`text-2xl ${i < getScoreStars(moves) ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <button
                onClick={initializeGame}
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
            <li className="text-gray-700">
              • Clique nas cartas para virá-las e revelar os emojis
            </li>
            <li className="text-gray-700">
              • Encontre os pares de cartas com o mesmo emoji
            </li>
            <li className="text-gray-700">
              • Quando encontrar um par, as cartas permanecerão viradas
            </li>
            <li className="text-gray-700">
              • Complete o jogo encontrando todos os {emojis.length} pares
            </li>
            <li className="text-gray-700">
              • Quanto menos movimentos, mais estrelas você ganha!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MemoryGame; 