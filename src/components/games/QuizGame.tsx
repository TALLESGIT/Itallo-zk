import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Trophy, Clock, CheckCircle, X } from 'lucide-react';
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center text-primary hover:text-primary/80 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar aos Jogos
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Finalizado!</h2>
            
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 mb-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {score}/{questions.length}
              </div>
              <div className="text-gray-600 mb-4">
                {((score / questions.length) * 100).toFixed(0)}% de acertos
              </div>
              <div className="flex justify-center gap-1 mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={`text-2xl ${i < getScoreStars() ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <p className="text-gray-700 font-medium">{getScoreMessage()}</p>
            </div>

            <div className="space-y-3 mb-6">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-3 rounded-lg border-2 ${
                    userAnswers[index] === question.correctAnswer
                      ? 'border-green-300 bg-green-50'
                      : userAnswers[index] === -1
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Pergunta {index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {userAnswers[index] === question.correctAnswer ? (
                        <CheckCircle className="text-green-500" size={16} />
                      ) : userAnswers[index] === -1 ? (
                        <Clock className="text-yellow-500" size={16} />
                      ) : (
                        <X className="text-red-500" size={16} />
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
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Jogar Novamente
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center text-primary hover:text-primary/80"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar aos Jogos
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <HelpCircle className="mr-2 text-primary" size={28} />
              Quiz de Conhecimentos
            </h1>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Pergunta {currentQuestion + 1} de {questions.length}
            </span>
            <div className="flex items-center gap-2">
              <Clock className="text-primary" size={16} />
              <span className={`font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-primary'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-primary mb-2">
              Pontuação: {score}/{currentQuestion + (selectedAnswer !== null ? 1 : 0)}
            </div>
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
            {questions[currentQuestion].question}
          </h2>

          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswer === null
                    ? 'border-gray-200 hover:border-primary hover:bg-primary/5'
                    : selectedAnswer === index
                    ? index === questions[currentQuestion].correctAnswer
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-red-500 bg-red-50 text-red-800'
                    : index === questions[currentQuestion].correctAnswer
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {selectedAnswer !== null && (
                    <div>
                      {index === questions[currentQuestion].correctAnswer && (
                        <CheckCircle className="text-green-500" size={20} />
                      )}
                      {selectedAnswer === index && index !== questions[currentQuestion].correctAnswer && (
                        <X className="text-red-500" size={20} />
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {showExplanation && questions[currentQuestion].explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <p className="text-blue-800">
                <strong>Explicação:</strong> {questions[currentQuestion].explanation}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Como Jogar:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="text-gray-700">
              • Você tem 30 segundos para responder cada pergunta
            </li>
            <li className="text-gray-700">
              • Clique na resposta que considera correta
            </li>
            <li className="text-gray-700">
              • Após responder, você verá a explicação da resposta
            </li>
            <li className="text-gray-700">
              • Sua pontuação final será baseada no número de acertos
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuizGame; 