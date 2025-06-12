import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';

interface RockPaperScissorsGameProps {
  onBack: () => void;
}

type Choice = 'rock' | 'paper' | 'scissors';
type GameResult = 'win' | 'lose' | 'draw';

const RockPaperScissorsGame: React.FC<RockPaperScissorsGameProps> = ({ onBack }) => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [score, setScore] = useState({ player: 0, computer: 0, draws: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameHistory, setGameHistory] = useState<Array<{
    player: Choice;
    computer: Choice;
    result: GameResult;
  }>>([]);

  const choices: { id: Choice; name: string; emoji: string; beats: Choice }[] = [
    { id: 'rock', name: 'Pedra', emoji: '🪨', beats: 'scissors' },
    { id: 'paper', name: 'Papel', emoji: '📄', beats: 'rock' },
    { id: 'scissors', name: 'Tesoura', emoji: '✂️', beats: 'paper' }
  ];

  const getRandomChoice = (): Choice => {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex].id;
  };

  const determineWinner = (player: Choice, computer: Choice): GameResult => {
    if (player === computer) return 'draw';
    
    const playerChoice = choices.find(c => c.id === player);
    return playerChoice?.beats === computer ? 'win' : 'lose';
  };

  const playGame = (playerChoice: Choice) => {
    if (isPlaying) return;

    setIsPlaying(true);
    setPlayerChoice(playerChoice);
    setComputerChoice(null);
    setResult(null);

    // Simular "pensamento" do computador
    setTimeout(() => {
      const computerChoice = getRandomChoice();
      setComputerChoice(computerChoice);

      setTimeout(() => {
        const gameResult = determineWinner(playerChoice, computerChoice);
        setResult(gameResult);

        // Atualizar pontuação
        setScore(prev => ({
          player: prev.player + (gameResult === 'win' ? 1 : 0),
          computer: prev.computer + (gameResult === 'lose' ? 1 : 0),
          draws: prev.draws + (gameResult === 'draw' ? 1 : 0)
        }));

        // Adicionar ao histórico
        setGameHistory(prev => [...prev, {
          player: playerChoice,
          computer: computerChoice,
          result: gameResult
        }].slice(-10)); // Manter apenas os últimos 10 jogos

        // Mostrar resultado
        if (gameResult === 'win') {
          toast.success('Você ganhou! 🎉');
        } else if (gameResult === 'lose') {
          toast.error('Você perdeu! 😔');
        } else {
          toast.info('Empate! 🤝');
        }

        setIsPlaying(false);
      }, 1000);
    }, 1500);
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setScore({ player: 0, computer: 0, draws: 0 });
    setGameHistory([]);
    setIsPlaying(false);
  };

  const getChoiceEmoji = (choice: Choice | null) => {
    if (!choice) return '❓';
    return choices.find(c => c.id === choice)?.emoji || '❓';
  };

  const getChoiceName = (choice: Choice | null) => {
    if (!choice) return 'Escolhendo...';
    return choices.find(c => c.id === choice)?.name || 'Desconhecido';
  };

  const getResultMessage = (result: GameResult | null) => {
    switch (result) {
      case 'win': return 'Você Ganhou! 🎉';
      case 'lose': return 'Você Perdeu! 😔';
      case 'draw': return 'Empate! 🤝';
      default: return 'Faça sua escolha!';
    }
  };

  const getResultColor = (result: GameResult | null) => {
    switch (result) {
      case 'win': return 'text-green-600';
      case 'lose': return 'text-red-600';
      case 'draw': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
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
            <button
              onClick={resetGame}
              className="inline-flex items-center text-primary hover:text-primary/80 p-2"
              title="Reiniciar Jogo"
            >
              <RotateCcw size={18} />
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center justify-center">
              <span className="mr-2">🪨📄✂️</span>
              <span className="hidden sm:inline">Pedra, Papel e Tesoura</span>
              <span className="sm:hidden">Jokenpô</span>
            </h1>
          </div>
        </div>

        {/* Score */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">{score.player}</div>
              <div className="text-xs sm:text-sm text-gray-600">Suas Vitórias</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{score.draws}</div>
              <div className="text-xs sm:text-sm text-gray-600">Empates</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-red-600">{score.computer}</div>
              <div className="text-xs sm:text-sm text-gray-600">Vitórias do PC</div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-8">
          {/* Battle Arena */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 items-center mb-6 sm:mb-8">
            {/* Player */}
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">Você</h3>
              <motion.div
                animate={{ 
                  scale: playerChoice ? 1.1 : 1,
                  rotate: playerChoice ? [0, -10, 10, 0] : 0
                }}
                className="text-6xl sm:text-8xl mb-2 sm:mb-4"
              >
                {getChoiceEmoji(playerChoice)}
              </motion.div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                {getChoiceName(playerChoice)}
              </p>
            </div>

            {/* VS */}
            <div className="text-center order-last sm:order-none">
              <div className="text-2xl sm:text-4xl font-bold text-gray-400 mb-2 sm:mb-4">VS</div>
              <div className={`text-base sm:text-xl font-bold ${getResultColor(result)}`}>
                {getResultMessage(result)}
              </div>
            </div>

            {/* Computer */}
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-4">Computador</h3>
              <motion.div
                animate={{ 
                  scale: computerChoice ? 1.1 : 1,
                  rotate: computerChoice ? [0, 10, -10, 0] : 0
                }}
                className="text-6xl sm:text-8xl mb-2 sm:mb-4"
              >
                {isPlaying && !computerChoice ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  >
                    🤔
                  </motion.span>
                ) : (
                  getChoiceEmoji(computerChoice)
                )}
              </motion.div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                {isPlaying && !computerChoice ? 'Pensando...' : getChoiceName(computerChoice)}
              </p>
            </div>
          </div>

          {/* Choices */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-sm sm:max-w-md mx-auto">
            {choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => playGame(choice.id)}
                disabled={isPlaying}
                className={`p-3 sm:p-6 rounded-xl border-2 transition-all ${
                  isPlaying
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-primary hover:bg-primary/5 hover:scale-105'
                } ${playerChoice === choice.id ? 'border-primary bg-primary/10' : ''}`}
              >
                <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{choice.emoji}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-700">{choice.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Game History */}
        {gameHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Histórico dos Últimos Jogos</h3>
            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
              {gameHistory.slice().reverse().map((game, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                    game.result === 'win' ? 'bg-green-50 border border-green-200' :
                    game.result === 'lose' ? 'bg-red-50 border border-red-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">{getChoiceEmoji(game.player)}</span>
                    <span className="text-xs sm:text-sm text-gray-400">vs</span>
                    <span className="text-xl sm:text-2xl">{getChoiceEmoji(game.computer)}</span>
                  </div>
                  <div className={`text-xs sm:text-sm font-medium ${
                    game.result === 'win' ? 'text-green-600' :
                    game.result === 'lose' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {game.result === 'win' ? 'Vitória' :
                     game.result === 'lose' ? 'Derrota' : 'Empate'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
            <li className="text-gray-700">
              • <strong>Pedra</strong> quebra a tesoura
            </li>
            <li className="text-gray-700">
              • <strong>Papel</strong> embrulha a pedra
            </li>
            <li className="text-gray-700">
              • <strong>Tesoura</strong> corta o papel
            </li>
            <li className="text-gray-700">
              • Clique em uma das opções para jogar contra o computador
            </li>
            <li className="text-gray-700">
              • Acompanhe seu histórico de vitórias, derrotas e empates
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RockPaperScissorsGame; 