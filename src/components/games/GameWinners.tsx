import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Clock, Target, Users, TrendingUp } from 'lucide-react';
import { useGameWinners } from '../../hooks/useGameWinners';

interface GameWinnersProps {
  gameId: string;
  gameName: string;
  gameColor: string;
  gameIcon: React.ComponentType<any>;
}

const GameWinners: React.FC<GameWinnersProps> = ({ gameId, gameName, gameColor, gameIcon: GameIcon }) => {
  const { getWinnersByGame, formatTime, getGameStats, loading } = useGameWinners();
  
  const winners = getWinnersByGame(gameId, 3);
  const stats = getGameStats(gameId);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Target className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 0: return 'from-yellow-400 to-yellow-600';
      case 1: return 'from-gray-300 to-gray-500';
      case 2: return 'from-amber-400 to-amber-600';
      default: return 'from-gray-200 to-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${gameColor} p-6 text-white`}>
        <div className="flex items-center gap-3 mb-4">
          <GameIcon className="w-8 h-8" />
          <h3 className="text-xl font-bold">{gameName}</h3>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-2xl font-bold">{stats.totalPlayers}</span>
            </div>
            <p className="text-white/80 text-xs">Jogadores</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-2xl font-bold">{stats.bestScore > 0 ? stats.bestScore : '--'}</span>
            </div>
            <p className="text-white/80 text-xs">Melhor Score</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-2xl font-bold">{stats.bestTime > 0 ? formatTime(stats.bestTime) : '--'}</span>
            </div>
            <p className="text-white/80 text-xs">Melhor Tempo</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-2xl font-bold">{stats.averageScore > 0 ? stats.averageScore : '--'}</span>
            </div>
            <p className="text-white/80 text-xs">Score Médio</p>
          </div>
        </div>
      </div>

      {/* Winners List */}
      <div className="p-6">
        {winners.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h4 className="font-semibold text-gray-800">Top Jogadores</h4>
            </div>
            
            {winners.map((winner, index) => (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Position */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getPodiumColor(index)} flex items-center justify-center flex-shrink-0`}>
                  {getPodiumIcon(index)}
                </div>
                
                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-gray-800 truncate">
                    {winner.player_name}
                  </h5>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {winner.score} pts
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(winner.time_taken)}
                    </span>
                    {winner.attempts && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {winner.attempts} tent.
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Date */}
                <div className="text-xs text-gray-500 text-right">
                  {new Date(winner.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="font-semibold text-gray-600 mb-2">Nenhum ganhador ainda</h4>
            <p className="text-gray-500 text-sm">
              Seja o primeiro a completar este jogo!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GameWinners; 