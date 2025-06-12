import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Award, Gamepad2, Hash, Brain, HelpCircle, Scissors } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import GameWinners from '../components/games/GameWinners';

const WinnersPage: React.FC = () => {
  const { appState } = useApp();

  const games = [
    {
      id: 'word_guess',
      name: 'Descubra a Palavra',
      icon: Gamepad2,
      color: 'from-blue-500 to-purple-600',
    },
    {
      id: 'number_guess',
      name: 'Adivinhe o Número',
      icon: Hash,
      color: 'from-green-500 to-teal-600',
    },
    {
      id: 'memory_game',
      name: 'Jogo da Memória',
      icon: Brain,
      color: 'from-pink-500 to-rose-600',
    },
    {
      id: 'quiz_game',
      name: 'Quiz Conhecimentos',
      icon: HelpCircle,
      color: 'from-orange-500 to-red-600',
    },
    {
      id: 'rock_paper_scissors',
      name: 'Pedra, Papel, Tesoura',
      icon: Scissors,
      color: 'from-indigo-500 to-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 pt-20">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-yellow-500" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800">
              🏆 Ganhadores
            </h1>
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-yellow-500" />
          </div>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg xl:text-xl max-w-3xl mx-auto px-2">
            Conheça os campeões do sorteio e os melhores jogadores de cada modalidade!
          </p>
        </motion.div>

        {/* Sorteio Winner Section */}
        {appState.isDrawComplete && appState.winner && (
          <motion.div
            className="mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
                  🎁 Ganhador do Sorteio
                </h2>
              </div>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg px-2">
                O grande vencedor do nosso sorteio principal!
              </p>
            </div>

            <div className="max-w-2xl mx-auto px-2">
              <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Crown className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-2 break-words">{appState.winner.name}</h3>
                  <div className="space-y-2 sm:space-y-3 text-yellow-100">
                    <p className="text-base sm:text-lg lg:text-xl">
                      <strong>Número:</strong> {appState.winner.number}
                    </p>
                    <p className="text-sm sm:text-base lg:text-lg break-all">
                      <strong>WhatsApp:</strong> {appState.winner.whatsapp}
                    </p>
                    <p className="text-sm sm:text-base lg:text-lg">
                      <strong>Data:</strong> {' '}
                      {new Date(appState.drawDate || '').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Games Winners Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
                🎮 Hall da Fama
              </h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto px-2">
              Os melhores jogadores de cada modalidade com suas conquistas e recordes!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              >
                <GameWinners
                  gameId={game.id}
                  gameName={game.name}
                  gameColor={game.color}
                  gameIcon={game.icon}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* No Winners Yet */}
        {!appState.isDrawComplete && (
          <motion.div
            className="text-center py-12 sm:py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Award className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600 mb-3 sm:mb-4 px-2">
              Sorteio ainda não realizado
            </h3>
            <p className="text-gray-500 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
              O sorteio principal ainda não foi realizado. Quando acontecer, 
              o ganhador aparecerá aqui junto com os campeões dos jogos!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WinnersPage;