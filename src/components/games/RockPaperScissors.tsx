import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameSettings } from '../../hooks/useGameSettings';
import { useGameWinners } from '../../hooks/useGameWinners';
import { useAuth } from '../../contexts/AuthContext';

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

  const { isAdmin } = useGameSettings();
  const { addWinner } = useGameWinners();
  const { authState } = useAuth();

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
    
    if (gameResult === 'win') {
      addWinner?.({
        game_id: 'rock_paper_scissors',
        player_name: getPlayerName(),
        score: score.wins + 1,
        time_taken: 0,
        attempts: score.wins + score.losses + score.draws + 1,
        difficulty: 'normal',
        game_data: { history: [...history, { playerChoice: choice, computerChoice, result: gameResult }] },
      });
    }
    
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
            className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Jogar Novamente
          </button>
        </div>

        {/* Instruções */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-blue-200 inline-block border border-blue-400 flex items-center justify-center text-lg">✊</span>
              <span className="text-sm text-gray-800">Pedra ganha da Tesoura</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-yellow-200 inline-block border border-yellow-400 flex items-center justify-center text-lg">✋</span>
              <span className="text-sm text-gray-800">Papel ganha da Pedra</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-pink-200 inline-block border border-pink-400 flex items-center justify-center text-lg">✌️</span>
              <span className="text-sm text-gray-800">Tesoura ganha do Papel</span>
            </div>
          </div>
          <ul className="space-y-1 text-sm text-gray-700 mt-2">
            <li>• Escolha entre Pedra, Papel ou Tesoura</li>
            <li>• O computador também fará uma escolha</li>
            <li>• Veja quem vence cada rodada</li>
            <li>• O placar mostra suas vitórias, empates e derrotas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RockPaperScissors; 