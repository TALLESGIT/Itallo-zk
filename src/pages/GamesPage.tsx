import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Gamepad2, 
  Hash, 
  Brain, 
  HelpCircle, 
  Search,
  Lock,
  Unlock,
  BookOpen
} from 'lucide-react';
import WordGuessGame from '../components/games/WordGuessGame';
import NumberGuessGame from '../components/games/NumberGuessGame';
import MemoryGame from '../components/games/MemoryGame';
import QuizGame from '../components/games/QuizGame';
import WordSearchGame from '../components/games/WordSearchGame';
import HangmanGame from '../components/games/HangmanGame';

import { useGameSettings } from '../hooks/useGameSettings';

const GamesPage: React.FC = () => {
  const [selectedGame, setSelectedGame] = React.useState<string | null>(null);
  const { isGameEnabled, loading, isAdmin } = useGameSettings();

  const games = [
    {
      id: 'word_guess',
      name: 'Descubra a Palavra',
      description: 'Adivinhe a palavra secreta com dicas coloridas!',
      icon: Gamepad2,
      color: 'from-blue-500 to-purple-600',
      component: WordGuessGame,
    },
    {
      id: 'number_guess',
      name: 'Adivinhe o Número',
      description: 'Descubra o número secreto entre 1 e 100!',
      icon: Hash,
      color: 'from-green-500 to-teal-600',
      component: NumberGuessGame,
    },
    {
      id: 'memory_game',
      name: 'Jogo da Memória',
      description: 'Encontre todos os pares de cartas!',
      icon: Brain,
      color: 'from-pink-500 to-rose-600',
      component: MemoryGame,
    },
    {
      id: 'quiz_game',
      name: 'Quiz Conhecimentos',
      description: 'Teste seus conhecimentos gerais!',
      icon: HelpCircle,
      color: 'from-orange-500 to-red-600',
      component: QuizGame,
    },
    {
      id: 'word_search',
      name: 'Caça Palavras',
      description: 'Encontre palavras escondidas no grid!',
      icon: Search,
      color: 'from-purple-500 to-indigo-600',
      component: WordSearchGame,
    },
    {
      id: 'hangman_game',
      name: 'Jogo da Forca',
      description: 'Adivinhe a palavra antes que o boneco caia!',
      icon: BookOpen,
      color: 'from-yellow-500 to-amber-600',
      component: HangmanGame,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  if (selectedGame) {
    const game = games.find(g => g.id === selectedGame);
    if (!game) return null;

    const GameComponent = game.component;
    
    // Garantir que a página role para o topo ao abrir o jogo
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => setSelectedGame(null)}
              className="flex items-center text-primary hover:text-primary/80 transition-colors mb-4"
            >
              ← Voltar aos Jogos
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {game.name}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {game.description}
            </p>
          </div>
          
          <GameComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="text-center mb-8 sm:mb-12">
          <motion.h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            🎮 Brincadeiras
          </motion.h1>
          <motion.p 
            className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Divirta-se com nossa coleção de jogos interativos!
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {games.map((game, index) => {
            const Icon = game.icon;
            const enabled = isGameEnabled(game.id);
            const canAccess = enabled || isAdmin;
            
            return (
              <motion.div
                key={game.id}
                className={`relative group ${canAccess ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => canAccess && setSelectedGame(game.id)}
              >
                <div className={`
                  relative overflow-hidden rounded-xl sm:rounded-2xl p-6 sm:p-8 h-48 sm:h-56
                  bg-gradient-to-br ${game.color} text-white
                  transform transition-all duration-300
                  ${canAccess ? 'hover:scale-105 hover:shadow-2xl' : 'opacity-60'}
                  ${!enabled ? 'grayscale' : ''}
                `}>
                  {/* Lock/Unlock Icon */}
                  <div className="absolute top-4 right-4">
                    {enabled ? (
                      <Unlock className="w-5 h-5 text-white/80" />
                    ) : (
                      <Lock className="w-5 h-5 text-white/80" />
                    )}
                  </div>

                  {/* Game Icon */}
                  <div className="mb-4">
                    <Icon className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>

                  {/* Game Info */}
                  <h3 className="text-lg sm:text-xl font-bold mb-2 leading-tight">
                    {game.name}
                  </h3>
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed">
                    {game.description}
                  </p>

                  {/* Status Badge */}
                  {!enabled && (
                    <div className="absolute bottom-4 left-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                        <Lock className="w-3 h-3 mr-1" />
                        Bloqueado
                      </span>
                    </div>
                  )}

                  {/* Admin Badge */}
                  {isAdmin && !enabled && (
                    <div className="absolute bottom-4 right-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-white">
                        Admin
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Disabled Overlay */}
                {!canAccess && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <Lock className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Jogo Bloqueado</p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>



        {/* Admin Notice */}
        {isAdmin && (
          <motion.div
            className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <p className="text-blue-800 text-sm text-center">
              <strong>Admin:</strong> Você pode acessar todos os jogos. 
              Configure quais jogos estão liberados para os usuários nas configurações.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GamesPage; 