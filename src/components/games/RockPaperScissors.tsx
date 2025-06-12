import React, { useState } from 'react';
import { motion } from 'framer-motion';

type Choice = 'rock' | 'paper' | 'scissors';
type GameResult = 'win' | 'lose' | 'draw';

interface GameHistory {
  playerChoice: Choice;
  computerChoice: Choice;
  result: GameResult;
}

const RockPaperScissors: React.FC = () => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const choices: { value: Choice; emoji: string; name: string }[] = [
    { value: 'rock', emoji: '🪨', name: 'Pedra' },
    { value: 'paper', emoji: '📄', name: 'Papel' },
    { value: 'scissors', emoji: '✂️', name: 'Tesoura' },
  ];

  const getRandomChoice = (): Choice => {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex].value;
  };

  const determineWinner = (player: Choice, computer: Choice): GameResult => {
    if (player === computer) return 'draw';
    
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'win';
    }
    
    return 'lose';
  };

  const playGame = async (choice: Choice) => {
    setIsPlaying(true);
    setPlayerChoice(choice);
    
    // Simular delay para animação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const computerChoice = getRandomChoice();
    const gameResult = determineWinner(choice, computerChoice);
    
    setComputerChoice(computerChoice);
    setResult(gameResult);
    
    // Atualizar pontuação
    setScore(prev => ({
      ...prev,
      [gameResult === 'win' ? 'wins' : gameResult === 'lose' ? 'losses' : 'draws']: 
        prev[gameResult === 'win' ? 'wins' : gameResult === 'lose' ? 'losses' : 'draws'] + 1
    }));
    
    // Adicionar ao histórico
    setHistory(prev => [...prev, { playerChoice: choice, computerChoice, result: gameResult }].slice(-10));
    
    setIsPlaying(false);
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setScore({ wins: 0, losses: 0, draws: 0 });
    setHistory([]);
  };

  const getResultMessage = () => {
    if (!result) return '';
    
    switch (result) {
      case 'win':
        return '🎉 Você ganhou!';
      case 'lose':
        return '😔 Você perdeu!';
      case 'draw':
        return '🤝 Empate!';
      default:
        return '';
    }
  };

  const getResultColor = () => {
    switch (result) {
      case 'win':
        return 'text-green-600';
      case 'lose':
        return 'text-red-600';
      case 'draw':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8">
        {/* Placar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{score.wins}</div>
            <div className="text-sm text-green-700">Vitórias</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{score.draws}</div>
            <div className="text-sm text-yellow-700">Empates</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{score.losses}</div>
            <div className="text-sm text-red-700">Derrotas</div>
          </div>
        </div>

        {/* Área do Jogo */}
        <div className="text-center mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-center mb-8">
            {/* Jogador */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Você</h3>
              <motion.div
                className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-4xl"
                animate={isPlaying ? { rotate: [0, 360] } : {}}
                transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
              >
                {playerChoice ? choices.find(c => c.value === playerChoice)?.emoji : '❓'}
              </motion.div>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">VS</div>
            </div>

            {/* Computador */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Computador</h3>
              <motion.div
                className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center text-4xl"
                animate={isPlaying ? { rotate: [0, -360] } : {}}
                transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
              >
                {computerChoice ? choices.find(c => c.value === computerChoice)?.emoji : '❓'}
              </motion.div>
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-2xl font-bold mb-6 ${getResultColor()}`}
            >
              {getResultMessage()}
            </motion.div>
          )}
        </div>

        {/* Botões de Escolha */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {choices.map((choice) => (
            <motion.button
              key={choice.value}
              onClick={() => playGame(choice.value)}
              disabled={isPlaying}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                isPlaying
                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                  : 'bg-white border-gray-200 hover:border-primary hover:bg-primary/5 hover:scale-105'
              }`}
              whileHover={!isPlaying ? { scale: 1.05 } : {}}
              whileTap={!isPlaying ? { scale: 0.95 } : {}}
            >
              <div className="text-4xl mb-2">{choice.emoji}</div>
              <div className="font-semibold text-gray-700">{choice.name}</div>
            </motion.button>
          ))}
        </div>

        {/* Histórico */}
        {history.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Últimas Jogadas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {history.slice(-10).map((game, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg text-center text-sm ${
                    game.result === 'win'
                      ? 'bg-green-100 text-green-800'
                      : game.result === 'lose'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <div className="text-xs">
                    {choices.find(c => c.value === game.playerChoice)?.emoji} vs{' '}
                    {choices.find(c => c.value === game.computerChoice)?.emoji}
                  </div>
                  <div className="font-semibold">
                    {game.result === 'win' ? 'V' : game.result === 'lose' ? 'D' : 'E'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão Reset */}
        <div className="text-center">
          <button
            onClick={resetGame}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
          >
            Jogar Novamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default RockPaperScissors; 