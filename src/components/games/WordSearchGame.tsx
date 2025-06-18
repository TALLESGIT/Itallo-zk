import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, RotateCcw, Trophy, Clock, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { useGameWinners } from '../../hooks/useGameWinners';
import { supabase } from '../../lib/supabase';
import { useGameSettings } from '../../hooks/useGameSettings';
import { useAuth } from '../../contexts/AuthContext';

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
  const { isGameEnabled, isAdmin } = useGameSettings();
  const { authState } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // Tamanho dinâmico do grid (mínimo 12)
  const [gridSize, setGridSize] = useState(12);
  const [grid, setGrid] = useState<string[][]>([]);
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [firstClick, setFirstClick] = useState<Position | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Palavras para encontrar (carregadas do banco)
  const [wordsToFind, setWordsToFind] = useState<string[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);

  // ===== Tempo limite (10 min) e cooldown (15 min) =====
  const MAX_TIME_MS = 10 * 60 * 1000; // 600.000 ms => 10 minutos
  const COOLDOWN_MS = 15 * 60 * 1000; // 900.000 ms => 15 minutos

  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const gameEnabled = isGameEnabled('word_search');

  // Gerar grid aleatório com palavras escondidas
  const generateGrid = useCallback(() => {
    const N = gridSize;
    const newGrid: string[][] = Array(N).fill(null).map(() => Array(N).fill(''));
    
    // Função para colocar uma palavra no grid
    const placeWord = (word: string) => {
      const directions = [
        [0, 1],    // → horizontal direita
        [0, -1],   // ← horizontal esquerda
        [1, 0],    // ↓ vertical
        [-1, 0],   // ↑ vertical
        [1, 1],    // ↘ diagonal descendente direita
        [-1, -1],  // ↖ diagonal ascendente esquerda
        [-1, 1],   // ↗ diagonal ascendente direita
        [1, -1],   // ↙ diagonal descendente esquerda
      ];

      for (let attempts = 0; attempts < 100; attempts++) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const startRow = Math.floor(Math.random() * N);
        const startCol = Math.floor(Math.random() * N);

        // Verificar se a palavra cabe
        const endRow = startRow + direction[0] * (word.length - 1);
        const endCol = startCol + direction[1] * (word.length - 1);

        if (endRow >= 0 && endRow < N && endCol >= 0 && endCol < N) {
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
    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        if (newGrid[row][col] === '') {
          newGrid[row][col] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }

    setGrid(newGrid);
  }, [gridSize, wordsToFind]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameCompleted) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);

        // Verificar tempo limite
        if (Date.now() - startTime >= MAX_TIME_MS) {
          setGameCompleted(true);
          setShowNameInput(false);
          setShowTimeoutModal(true);

          // Definir cooldown
          const end = Date.now() + COOLDOWN_MS;
          localStorage.setItem('word_search_cooldown_end', end.toString());
          setCooldownEnd(end);
        }
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
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const words = data.map(item => item.word.toUpperCase());
        // Ajustar gridSize com base na maior palavra
        const longest = Math.max(...words.map(w => w.length));
        setGridSize(Math.max(12, longest));
        setWordsToFind(words);
      } else {
        // Se não houver palavras ativas, não exibir nenhuma palavra na interface
        setWordsToFind([]);
      }
    } catch (error) {
      console.error('Erro ao carregar palavras:', error);
      // Em caso de erro, não mostrar palavras padronizadas; evitar dados fictícios
      setWordsToFind([]);
    } finally {
      setLoadingWords(false);
    }
  };

  // Inicializar jogo
  useEffect(() => {
    fetchWords();

    // Gerar um nome de canal único por instância para evitar erro de múltiplas inscrições
    const uniqueChannelName = `word_search_words_changes_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'word_search_words' },
        () => {
          fetchWords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (wordsToFind.length > 0) {
      generateGrid();
    }
  }, [wordsToFind, generateGrid]);

  // Carregar cooldown salvo (se existir)
  useEffect(() => {
    const stored = localStorage.getItem('word_search_cooldown_end');
    if (stored) {
      const end = parseInt(stored, 10);
      if (!isNaN(end) && end > Date.now()) {
        setCooldownEnd(end);
        setCooldownRemaining(end - Date.now());
      }
    }

    // Intervalo para atualizar contagem regressiva do cooldown
    const interval = setInterval(() => {
      if (cooldownEnd) {
        const remaining = cooldownEnd - Date.now();
        if (remaining <= 0) {
          setCooldownEnd(null);
          localStorage.removeItem('word_search_cooldown_end');
        }
        setCooldownRemaining(Math.max(0, remaining));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  // Preencher automaticamente o nome do usuário autenticado
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      // Se houver nome, usar. Senão, usar prefixo do e-mail
      const userName = authState.user.user_metadata?.name || (authState.user.email ? authState.user.email.split('@')[0] : 'Usuário');
      setPlayerName(userName);
    }
  }, [authState]);

  const startGame = () => {
    if (!gameEnabled) return;
    // Bloqueio por cooldown
    if (cooldownEnd && cooldownEnd > Date.now()) return;

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
    if (!isSelecting || !gameStarted || gameCompleted || isMobile) return;

    const start = selectedCells[0];
    const positions = getLineBetweenCells(start, { row, col });
    setSelectedCells(positions);
  };

  const handleCellMouseUp = () => {
    if (!gameStarted || gameCompleted || isMobile) return;
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

  const [cellSize, setCellSize] = useState(32);

  // Função para recalcular o tamanho das células baseado na largura da tela
  const calculateCellSize = () => {
    const vw = window.innerWidth;
    const GAP = 4;
    const GAP_TOTAL = (gridSize - 1) * GAP;
    const size = Math.max(30, Math.min(56, Math.floor((vw - 32 - GAP_TOTAL) / gridSize)));
    setCellSize(size);
  };

  useEffect(() => {
    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);
    return () => window.removeEventListener('resize', calculateCellSize);
  }, [gridSize]);

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
              {formatTime(Math.max(0, MAX_TIME_MS - elapsedTime))}
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

      {/* Instruções */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mt-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
        <ul className="space-y-1 text-sm text-gray-700 mt-2">
          <li>• Encontre todas as palavras escondidas no grid de letras</li>
          <li>• Clique e arraste (ou toque duas vezes) para selecionar as palavras</li>
          <li>• As palavras podem estar na horizontal, vertical ou diagonal</li>
          <li>• Complete o desafio antes do tempo acabar</li>
          <li>• O cronômetro limita o tempo para cada rodada</li>
        </ul>
      </div>

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
                {wordsToFind.length > 0
                  ? `Encontre ${wordsToFind.length} palavras escondidas no grid!`
                  : 'Nenhuma palavra disponível no momento. Aguarde novas atualizações!'}
              </p>
              <button
                onClick={startGame}
                disabled={wordsToFind.length === 0 || (cooldownEnd && cooldownEnd > Date.now())}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors text-white ${
                  wordsToFind.length === 0 || (cooldownEnd && cooldownEnd > Date.now())
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {cooldownEnd && cooldownEnd > Date.now()
                  ? 'Aguardando...'
                  : 'Iniciar Jogo'}
              </button>

              {cooldownEnd && cooldownEnd > Date.now() && (
                <p className="mt-3 text-sm text-gray-600">
                  Você poderá tentar novamente em {Math.ceil(cooldownRemaining / 60000)} min.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg">
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

              <div className="flex justify-center" style={{ position: 'relative' }}>
                <div className="overflow-x-auto" style={{ position: 'relative' }}>
                  {/* Overlay para bloquear interação quando showNameInput estiver aberto */}
                  {showNameInput && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'rgba(255,255,255,0.6)',
                      zIndex: 10,
                      cursor: 'not-allowed',
                    }} />
                  )}
                  <div
                    className="grid gap-[4px] mx-auto select-none"
                    style={{
                      width: cellSize * gridSize,
                      gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`
                    }}
                  >
                    {grid.map((row, rowIndex) =>
                      row.map((letter, colIndex) => {
                        const isSelected = selectedCells.some(
                          (pos) => pos.row === rowIndex && pos.col === colIndex
                        );
                        const isFound = foundWords.some((fw) =>
                          fw.positions.some(
                            (pos) => pos.row === rowIndex && pos.col === colIndex
                          )
                        );

                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`flex items-center justify-center border text-base font-bold md:text-lg transition-colors duration-150 ${
                              isFound
                                ? 'bg-green-400 text-white'
                                : isSelected
                                ? 'bg-yellow-300 text-gray-800'
                                : 'bg-white text-gray-800'
                            }`}
                            style={{ width: cellSize, height: cellSize }}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                            onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                            onMouseUp={handleCellMouseUp}
                          >
                            {letter}
                          </div>
                        );
                      })
                    )}
                  </div>
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
                className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors w-full mt-4 justify-center gap-2"
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

            {/* Se usuário autenticado, não mostrar input, apenas botão de salvar */}
            {authState.isAuthenticated ? (
              <div className="flex gap-3">
                <button
                  onClick={handleSaveScore}
                  className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex-1 font-semibold justify-center"
                >
                  Salvar Pontuação
                </button>
              </div>
            ) : (
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
                    className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex-1 font-semibold justify-center"
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
            )}
          </motion.div>
        </div>
      )}

      {/* Timeout Modal */}
      {showTimeoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl p-6 max-w-md w-full text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Trophy className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Tempo esgotado</h3>
            <p className="text-gray-600 mb-6">Tente outra vez em alguns minutos!</p>
            <button
              onClick={() => {
                setShowTimeoutModal(false);
                resetGame();
              }}
              className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold"
            >
              Entendi
            </button>
          </motion.div>
        </div>
      )}

      {/* Game Disabled Message */}
      {!gameEnabled && (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Jogo indisponível no momento
          </h3>
          <p className="text-gray-600 mb-6">
            O administrador desativou este jogo temporariamente. Tente novamente mais tarde.
          </p>
        </div>
      )}
    </div>
  );
};

export default WordSearchGame;
