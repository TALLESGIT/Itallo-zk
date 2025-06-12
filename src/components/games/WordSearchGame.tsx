import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, RotateCcw, Trophy, Clock, Target, CheckCircle } from 'lucide-react';
import { useGameWinners } from '../../hooks/useGameWinners';
import { supabase } from '../../lib/supabase';

interface Position {
  row: number;
  col: number;
}

interface FoundWord {
  word: string;
  positions: Position[];
}

const WordSearchGame: React.FC = () => {
  const { addWinner } = useGameWinners();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // Grid de letras 12x12
  const [grid, setGrid] = useState<string[][]>([]);
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [firstClick, setFirstClick] = useState<Position | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Palavras para encontrar (carregadas do banco)
  const [wordsToFind, setWordsToFind] = useState<string[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);

  // Gerar grid aleatório com palavras escondidas
  const generateGrid = useCallback(() => {
    const newGrid: string[][] = Array(12).fill(null).map(() => Array(12).fill(''));
    
    // Função para colocar uma palavra no grid
    const placeWord = (word: string) => {
      const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal descendente
        [-1, 1],  // diagonal ascendente
      ];

      for (let attempts = 0; attempts < 100; attempts++) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const startRow = Math.floor(Math.random() * 12);
        const startCol = Math.floor(Math.random() * 12);

        // Verificar se a palavra cabe
        const endRow = startRow + direction[0] * (word.length - 1);
        const endCol = startCol + direction[1] * (word.length - 1);

        if (endRow >= 0 && endRow < 12 && endCol >= 0 && endCol < 12) {
          // Verificar se não há conflito
          let canPlace = true;
          const positions: Position[] = [];

          for (let i = 0; i < word.length; i++) {
            const row = startRow + direction[0] * i;
            const col = startCol + direction[1] * i;
            positions.push({ row, col });

            if (newGrid[row][col] !== '' && newGrid[row][col] !== word[i]) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            // Colocar a palavra
            for (let i = 0; i < word.length; i++) {
              const row = startRow + direction[0] * i;
              const col = startCol + direction[1] * i;
              newGrid[row][col] = word[i];
            }
            return true;
          }
        }
      }
      return false;
    };

    // Colocar palavras no grid
    wordsToFind.forEach(word => {
      placeWord(word);
    });

    // Preencher células vazias com letras aleatórias
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 12; col++) {
        if (newGrid[row][col] === '') {
          newGrid[row][col] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }

    setGrid(newGrid);
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameCompleted) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameCompleted, startTime]);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar palavras do banco de dados
  const fetchWords = async () => {
    try {
      setLoadingWords(true);
      const { data, error } = await supabase
        .from('word_search_words')
        .select('word')
        .eq('is_active', true)
        .limit(15);

      if (error) throw error;

      if (data && data.length > 0) {
        const words = data.map(item => item.word.toUpperCase());
        setWordsToFind(words);
      } else {
        // Fallback para palavras padrão se não houver no banco
        setWordsToFind([
          'JAVASCRIPT', 'REACT', 'TYPESCRIPT', 'HTML', 'CSS',
          'NODE', 'PYTHON', 'JAVA', 'PHP', 'MYSQL',
          'GITHUB', 'VSCODE', 'LINUX', 'WINDOWS', 'MOBILE'
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar palavras:', error);
      // Fallback para palavras padrão em caso de erro
      setWordsToFind([
        'JAVASCRIPT', 'REACT', 'TYPESCRIPT', 'HTML', 'CSS',
        'NODE', 'PYTHON', 'JAVA', 'PHP', 'MYSQL',
        'GITHUB', 'VSCODE', 'LINUX', 'WINDOWS', 'MOBILE'
      ]);
    } finally {
      setLoadingWords(false);
    }
  };

  // Inicializar jogo
  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    if (wordsToFind.length > 0) {
      generateGrid();
    }
  }, [wordsToFind, generateGrid]);

  const startGame = () => {
    setGameStarted(true);
    setGameCompleted(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setScore(0);
    setFoundWords([]);
    setSelectedCells([]);
    setFirstClick(null);
    generateGrid();
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameCompleted(false);
    setElapsedTime(0);
    setScore(0);
    setFoundWords([]);
    setSelectedCells([]);
    setFirstClick(null);
    setShowNameInput(false);
    generateGrid();
  };

  // Verificar se uma palavra foi encontrada
  const checkForWord = (positions: Position[]) => {
    const getWord = (positions: Position[]) => {
      return positions.map(pos => grid[pos.row][pos.col]).join('');
    };

    const word = getWord(positions);
    const reverseWord = getWord([...positions].reverse());

    for (const targetWord of wordsToFind) {
      if ((word === targetWord || reverseWord === targetWord) && 
          !foundWords.some(fw => fw.word === targetWord)) {
        const newFoundWord: FoundWord = { word: targetWord, positions };
        setFoundWords(prev => [...prev, newFoundWord]);
        setScore(prev => prev + targetWord.length * 10);
        
        // Verificar se o jogo foi completado
        if (foundWords.length + 1 === wordsToFind.length) {
          setGameCompleted(true);
          setShowNameInput(true);
        }
        return true;
      }
    }
    return false;
  };

  // Manipulação de seleção de células - Funciona para mobile e desktop
  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted || gameCompleted) return;

    if (isMobile) {
      // Modo mobile: sistema de dois cliques
      if (!firstClick) {
        // Primeiro clique - selecionar célula inicial
        setFirstClick({ row, col });
        setSelectedCells([{ row, col }]);
      } else {
        // Segundo clique - criar linha até a célula final
        const positions = getLineBetweenCells(firstClick, { row, col });
        setSelectedCells(positions);
        
        if (positions.length > 1) {
          checkForWord(positions);
        }
        
        setFirstClick(null);
        setTimeout(() => setSelectedCells([]), 500);
      }
    }
  };

  const handleCellMouseDown = (row: number, col: number) => {
    if (!gameStarted || gameCompleted || isMobile) return;
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || selectedCells.length === 0 || isMobile) return;

    const start = selectedCells[0];
    const positions = getLineBetweenCells(start, { row, col });
    setSelectedCells(positions);
  };

  const handleCellMouseUp = () => {
    if (!isSelecting || isMobile) return;
    setIsSelecting(false);

    if (selectedCells.length > 1) {
      checkForWord(selectedCells);
    }
    setTimeout(() => setSelectedCells([]), 500);
  };

  // Função para calcular linha entre duas células
  const getLineBetweenCells = (start: Position, end: Position): Position[] => {
    const positions: Position[] = [];
    const deltaRow = end.row - start.row;
    const deltaCol = end.col - start.col;

    // Verificar se é uma linha válida (horizontal, vertical ou diagonal)
    if (deltaRow === 0 || deltaCol === 0 || Math.abs(deltaRow) === Math.abs(deltaCol)) {
      const steps = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
      const stepRow = steps === 0 ? 0 : deltaRow / steps;
      const stepCol = steps === 0 ? 0 : deltaCol / steps;

      for (let i = 0; i <= steps; i++) {
        positions.push({
          row: start.row + Math.round(stepRow * i),
          col: start.col + Math.round(stepCol * i)
        });
      }
    } else {
      // Se não for uma linha válida, retornar apenas a célula inicial
      positions.push(start);
    }

    return positions;
  };

  // Salvar pontuação
  const handleSaveScore = async () => {
    if (!playerName.trim()) return;

    const timeInSeconds = Math.floor(elapsedTime / 1000);
    const wordsFound = foundWords.length;

    await addWinner({
      game_id: 'word_search',
      player_name: playerName.trim(),
      score: score,
      time_taken: timeInSeconds,
      attempts: 1,
      difficulty: 'normal',
      game_data: {
        words_found: wordsFound,
        total_words: wordsToFind.length,
        completion_rate: Math.round((wordsFound / wordsToFind.length) * 100)
      }
    });

    setShowNameInput(false);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  };

  const isCellFirstClick = (row: number, col: number) => {
    return firstClick && firstClick.row === row && firstClick.col === col;
  };

  const isCellInFoundWord = (row: number, col: number) => {
    return foundWords.some(fw => 
      fw.positions.some(pos => pos.row === row && pos.col === col)
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Search className="w-8 h-8 text-purple-500" />
          <h2 className="text-3xl font-bold text-gray-800">Caça Palavras</h2>
        </div>
        <p className="text-gray-600">
          Encontre todas as {wordsToFind.length} palavras escondidas no grid!
        </p>
      </div>

      {/* Game Stats */}
      {gameStarted && (
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">
              {formatTime(elapsedTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
            <Trophy className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">{score} pts</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-lg">
            <Target className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-800">
              {foundWords.length}/{wordsToFind.length}
            </span>
          </div>
        </div>
      )}

      {/* Instructions for mobile */}
      {gameStarted && isMobile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center">
          <p className="text-blue-800 text-sm">
            📱 <strong>Mobile:</strong> Clique na primeira letra, depois na última letra da palavra
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Grid */}
        <div className="lg:col-span-3">
          {loadingWords ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Carregando palavras...
              </h3>
              <p className="text-gray-600">
                Preparando o jogo para você!
              </p>
            </div>
          ) : !gameStarted ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Pronto para o desafio?
              </h3>
              <p className="text-gray-600 mb-6">
                Encontre {wordsToFind.length} palavras escondidas no grid!
              </p>
              <button
                onClick={startGame}
                disabled={wordsToFind.length === 0}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Iniciar Jogo
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              {/* Mobile controls */}
              {isMobile && firstClick && (
                <div className="mb-4 text-center">
                  <button
                    onClick={() => {
                      setFirstClick(null);
                      setSelectedCells([]);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Cancelar Seleção
                  </button>
                </div>
              )}

              <div className="flex justify-center">
                <div 
                  className="grid grid-cols-12 gap-1 sm:gap-2 select-none"
                  onMouseLeave={() => !isMobile && setSelectedCells([])}
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                    willChange: 'auto',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none'
                  }}
                >
                {grid.map((row, rowIndex) =>
                  row.map((letter, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center
                        text-sm sm:text-base md:text-lg font-bold cursor-pointer
                        border-2 transition-colors duration-150 select-none rounded-md
                        ${isCellSelected(rowIndex, colIndex) 
                          ? 'bg-blue-300 border-blue-500 text-blue-900 shadow-sm' 
                          : isCellFirstClick(rowIndex, colIndex)
                          ? 'bg-yellow-300 border-yellow-500 text-yellow-900 shadow-sm'
                          : isCellInFoundWord(rowIndex, colIndex)
                          ? 'bg-green-200 border-green-400 text-green-800'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }
                      `}
                      onClick={(e) => {
                        e.preventDefault();
                        handleCellClick(rowIndex, colIndex);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleCellMouseDown(rowIndex, colIndex);
                      }}
                      onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                      onMouseUp={handleCellMouseUp}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleCellClick(rowIndex, colIndex);
                      }}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                                          >
                        {letter}
                    </div>
                  ))
                )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Words List */}
        {gameStarted && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Palavras para Encontrar
            </h3>
            <div className="space-y-2">
              {wordsToFind.map((word) => {
                const isFound = foundWords.some(fw => fw.word === word);
                return (
                  <div
                    key={word}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg transition-all
                      ${isFound 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {isFound ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />
                    )}
                    <span className={`text-sm font-medium ${isFound ? 'line-through' : ''}`}>
                      {word}
                    </span>
                  </div>
                );
              })}
            </div>

            {gameStarted && (
              <button
                onClick={resetGame}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Victory Modal */}
      {showNameInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl p-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center mb-6">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Parabéns! 🎉
              </h3>
              <p className="text-gray-600">
                Você encontrou {foundWords.length} de {wordsToFind.length} palavras!
              </p>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><strong>Tempo:</strong> {formatTime(elapsedTime)}</p>
                <p><strong>Pontuação:</strong> {score} pontos</p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Digite seu nome"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={50}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSaveScore}
                  disabled={!playerName.trim()}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Salvar Pontuação
                </button>
                <button
                  onClick={() => setShowNameInput(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Pular
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WordSearchGame;
