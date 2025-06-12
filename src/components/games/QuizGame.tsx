import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Trophy, Clock, CheckCircle, X, Info } from 'lucide-react';
import { toast } from 'react-toastify';

interface QuizGameProps {
  onBack: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

const QuizGame: React.FC<QuizGameProps> = ({ onBack }) => {
  const [questions] = useState<Question[]>([
    {
      id: 1,
      question: "Qual é a capital do Brasil?",
      options: ["São Paulo", "Rio de Janeiro", "Brasília", "Belo Horizonte"],
      correctAnswer: 2,
      explanation: "Brasília é a capital federal do Brasil desde 1960."
    },
    {
      id: 2,
      question: "Quantos dias tem um ano bissexto?",
      options: ["365", "366", "364", "367"],
      correctAnswer: 1,
      explanation: "Um ano bissexto tem 366 dias, ocorrendo a cada 4 anos."
    },
    {
      id: 3,
      question: "Qual é o maior planeta do sistema solar?",
      options: ["Terra", "Saturno", "Júpiter", "Netuno"],
      correctAnswer: 2,
      explanation: "Júpiter é o maior planeta do nosso sistema solar."
    },
    {
      id: 4,
      question: "Em que ano o Brasil foi descoberto?",
      options: ["1498", "1500", "1502", "1499"],
      correctAnswer: 1,
      explanation: "O Brasil foi descoberto por Pedro Álvares Cabral em 1500."
    },
    {
      id: 5,
      question: "Qual é o resultado de 15 x 8?",
      options: ["110", "120", "130", "140"],
      correctAnswer: 1,
      explanation: "15 multiplicado por 8 é igual a 120."
    },
    {
      id: 6,
      question: "Qual é o oceano que banha o litoral brasileiro?",
      options: ["Pacífico", "Índico", "Atlântico", "Ártico"],
      correctAnswer: 2,
      explanation: "O Oceano Atlântico banha toda a costa brasileira."
    },
    {
      id: 7,
      question: "Quantos estados tem o Brasil?",
      options: ["25", "26", "27", "28"],
      correctAnswer: 1,
      explanation: "O Brasil possui 26 estados mais o Distrito Federal."
    },
    {
      id: 8,
      question: "Qual é a moeda oficial do Brasil?",
      options: ["Peso", "Dólar", "Real", "Euro"],
      correctAnswer: 2,
      explanation: "O Real é a moeda oficial do Brasil desde 1994."
    }
  ]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
  const [timeLeft, setTimeLeft] = useState(30);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStatus === 'playing') {
      handleTimeUp();
    }
  }, [timeLeft, gameStatus]);

  const handleTimeUp = () => {
    if (selectedAnswer === null) {
      handleAnswer(-1); // -1 indica que o tempo acabou sem resposta
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answerIndex);
    const newUserAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newUserAnswers);

    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    setShowExplanation(true);

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeLeft(30);
        setShowExplanation(false);
      } else {
        setGameStatus('finished');
      }
    }, 3000);
  };

  const resetGame = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setGameStatus('playing');
    setTimeLeft(30);
    setShowExplanation(false);
    setUserAnswers([]);
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return "Excelente! Você é um expert! 🏆";
    if (percentage >= 60) return "Muito bem! Bom conhecimento! 👏";
    if (percentage >= 40) return "Não foi mal! Continue estudando! 📚";
    return "Que tal estudar um pouco mais? 💪";
  };

  const getScoreStars = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return 5;
    if (percentage >= 60) return 4;
    if (percentage >= 40) return 3;
    if (percentage >= 20) return 2;
    return 1;
  };

  if (gameStatus === 'finished') {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center text-primary hover:text-primary/80 mb-4 sm:mb-6 text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Voltar aos Jogos</span>
            <span className="xs:hidden">Voltar</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center"
          >
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Quiz Finalizado!</h2>
            
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                {score}/{questions.length}
              </div>
              <div className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                {((score / questions.length) * 100).toFixed(0)}% de acertos
              </div>
              <div className="flex justify-center gap-1 mb-3 sm:mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`text-xl sm:text-2xl ${i < getScoreStars() ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <p className="text-sm sm:text-base text-gray-700 font-medium px-2">{getScoreMessage()}</p>
            </div>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-48 sm:max-h-64 overflow-y-auto">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-2 sm:p-3 rounded-lg border-2 ${
                    userAnswers[index] === question.correctAnswer
                      ? 'border-green-300 bg-green-50'
                      : userAnswers[index] === -1
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium">
                      Pergunta {index + 1}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {userAnswers[index] === question.correctAnswer ? (
                        <CheckCircle className="text-green-500" size={14} />
                      ) : userAnswers[index] === -1 ? (
                        <Clock className="text-yellow-500" size={14} />
                      ) : (
                        <X className="text-red-500" size={14} />
                      )}
                      <span className="text-xs">
                        {userAnswers[index] === question.correctAnswer
                          ? 'Correto'
                          : userAnswers[index] === -1
                          ? 'Tempo esgotado'
                          : 'Incorreto'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={resetGame}
              className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
            >
              Jogar Novamente
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="h-6 mb-2" />
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center justify-center">
              <HelpCircle className="mr-2 text-primary" size={24} />
              <span className="hidden sm:inline">Quiz de Conhecimentos</span>
              <span className="sm:hidden">Quiz</span>
            </h1>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              Pergunta {currentQuestion + 1} de {questions.length}
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <Clock className="text-primary" size={14} />
              <span className={`text-sm sm:text-base font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-primary'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3 sm:mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          <div className="text-center">
            <div className="text-base sm:text-lg font-bold text-primary mb-2">
              Pontuação: {score}/{currentQuestion + (selectedAnswer !== null ? 1 : 0)}
            </div>
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-8"
        >
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 text-center px-2">
            {questions[currentQuestion].question}
          </h2>

          <div className="space-y-2 sm:space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all text-sm sm:text-base ${
                  selectedAnswer === null
                    ? 'border-gray-200 hover:border-primary hover:bg-primary/5'
                    : selectedAnswer === index
                    ? index === questions[currentQuestion].correctAnswer
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-red-500 bg-red-50 text-red-800'
                    : index === questions[currentQuestion].correctAnswer
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                } disabled:cursor-not-allowed`}
              >
                <div className="flex items-center">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 flex-shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {selectedAnswer !== null && (
                    <div className="ml-2 flex-shrink-0">
                      {selectedAnswer === index && index === questions[currentQuestion].correctAnswer && (
                        <CheckCircle className="text-green-500" size={16} />
                      )}
                      {selectedAnswer === index && index !== questions[currentQuestion].correctAnswer && (
                        <X className="text-red-500" size={16} />
                      )}
                      {selectedAnswer !== index && index === questions[currentQuestion].correctAnswer && (
                        <CheckCircle className="text-green-500" size={16} />
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Explanation */}
          {showExplanation && questions[currentQuestion].explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1 text-sm sm:text-base">Explicação:</h4>
                  <p className="text-blue-700 text-xs sm:text-sm">{questions[currentQuestion].explanation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
            <li className="text-gray-700">
              • Responda cada pergunta dentro do tempo limite de 30 segundos
            </li>
            <li className="text-gray-700">
              • Clique na alternativa que você considera correta
            </li>
            <li className="text-gray-700">
              • Verde indica resposta correta, vermelho indica incorreta
            </li>
            <li className="text-gray-700">
              • Sua pontuação final será baseada no número de acertos
            </li>
            <li className="text-gray-700">
              • Quanto mais acertos, mais estrelas você ganha!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuizGame; 