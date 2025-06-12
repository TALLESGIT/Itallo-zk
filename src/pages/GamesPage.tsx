import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Gamepad2, Trophy, Brain, Zap, Star, ArrowLeft, HelpCircle, Scissors } from 'lucide-react';
import WordGuessGame from '../components/games/WordGuessGame';
import NumberGuessGame from '../components/games/NumberGuessGame';
import MemoryGame from '../components/games/MemoryGame';
import QuizGame from '../components/games/QuizGame';
import RockPaperScissorsGame from '../components/games/RockPaperScissorsGame';

const GamesPage: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = [
    {
      id: 'word-guess',
      title: 'Descubra a Palavra',
      description: 'Tente descobrir a palavra secreta definida pelo administrador!',
      icon: Brain,
      color: 'from-blue-500 to-purple-600',
      difficulty: 'Médio'
    },
    {
      id: 'number-guess',
      title: 'Adivinhe o Número',
      description: 'Descubra o número secreto entre 1 e 100!',
      icon: Zap,
      color: 'from-green-500 to-teal-600',
      difficulty: 'Fácil'
    },
    {
      id: 'memory-game',
      title: 'Jogo da Memória',
      description: 'Teste sua memória encontrando os pares de cartas!',
      icon: Star,
      color: 'from-pink-500 to-rose-600',
      difficulty: 'Difícil'
    },
    {
      id: 'quiz-game',
      title: 'Quiz de Conhecimentos',
      description: 'Teste seus conhecimentos com perguntas variadas!',
      icon: HelpCircle,
      color: 'from-orange-500 to-red-600',
      difficulty: 'Médio'
    },
    {
      id: 'rock-paper-scissors',
      title: 'Pedra, Papel e Tesoura',
      description: 'Jogue o clássico contra o computador!',
      icon: Scissors,
      color: 'from-purple-500 to-indigo-600',
      difficulty: 'Fácil'
    }
  ];

  const renderGame = () => {
    switch (selectedGame) {
      case 'word-guess':
        return <WordGuessGame onBack={() => setSelectedGame(null)} />;
      case 'number-guess':
        return <NumberGuessGame onBack={() => setSelectedGame(null)} />;
      case 'memory-game':
        return <MemoryGame onBack={() => setSelectedGame(null)} />;
      case 'quiz-game':
        return <QuizGame onBack={() => setSelectedGame(null)} />;
      case 'rock-paper-scissors':
        return <RockPaperScissorsGame onBack={() => setSelectedGame(null)} />;
      default:
        return null;
    }
  };

  if (selectedGame) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-16">
          {renderGame()}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-16 pb-10">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full mb-6">
              <Gamepad2 size={40} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Central de Brincadeiras
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Divirta-se com nossos jogos interativos enquanto aguarda o sorteio!
            </p>
          </motion.div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setSelectedGame(game.id)}
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-primary/20">
                  {/* Card Header */}
                  <div className={`h-32 bg-gradient-to-r ${game.color} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10 flex items-center justify-center h-full">
                      <game.icon size={48} className="text-white" />
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                        {game.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {game.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-primary">
                        <Trophy size={16} className="mr-1" />
                        <span className="text-sm font-medium">Jogar Agora</span>
                      </div>
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowLeft size={16} className="rotate-180" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">5</div>
                <div className="text-gray-600">Jogos Disponíveis</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">∞</div>
                <div className="text-gray-600">Diversão Garantida</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-gray-600">Gratuito</div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GamesPage; 