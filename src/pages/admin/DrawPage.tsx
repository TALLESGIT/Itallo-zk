import { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { useApp } from '../../contexts/AppContext';
import { Gift, AlertTriangle, Award, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

const DrawPage: React.FC = () => {
  const { appState, performDraw } = useApp();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showWinner, setShowWinner] = useState(false);

  const handleStartDraw = async () => {
    if (appState.participants.length === 0) {
      return;
    }
    if (appState.isDrawComplete) {
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmDraw = async () => {
    setShowConfirmation(false);
    setIsAnimating(true);
    setShowWinner(false);
    setCountdown(3);
    // Contagem regressiva
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((res) => setTimeout(res, 1000));
    }
    setCountdown(0);
    // Pequena pausa antes de mostrar o vencedor
    await new Promise((res) => setTimeout(res, 500));
    await performDraw();
    setIsAnimating(false);
    setShowWinner(true);
    toast.success('Sorteio realizado com sucesso!');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Copiado para a área de transferência!');
  };

  return (
    <AdminLayout title="Sorteio">
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
            <Gift size={32} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Sistema de Sorteio</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Realize o sorteio entre todos os participantes que reservaram números.<br />
            Uma vez realizado, o sorteio não poderá ser refeito sem reiniciar o sistema.
          </p>
        </div>

        {appState.participants.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-medium text-yellow-800">Sem participantes</h3>
              <p className="text-yellow-700 text-sm">
                Não há participantes registrados para realizar o sorteio.
                Aguarde até que pelo menos um participante reserve um número.
              </p>
            </div>
          </div>
        ) : appState.isDrawComplete && appState.winner ? (
          <motion.div
            className="bg-green-50 border border-green-100 rounded-2xl p-8 shadow-lg flex flex-col items-center mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <Award className="text-green-500 mb-2" size={36} />
            <h3 className="text-2xl font-bold text-green-800 mb-2">Vencedor do Sorteio</h3>
            <div className="flex flex-col items-center gap-2 mb-4">
              <span className="inline-block px-6 py-3 bg-primary text-white text-3xl font-extrabold rounded-xl shadow-lg animate-pulse">
                {appState.winner.number}
              </span>
              <span className="text-lg font-semibold text-gray-800">{appState.winner.name}</span>
              <span className="text-gray-600 flex items-center gap-2">
                {appState.winner.whatsapp}
                <button onClick={() => handleCopy(appState.winner.whatsapp)} className="ml-1 p-1 rounded hover:bg-gray-200">
                  <Copy size={16} />
                </button>
              </span>
              <span className="text-sm text-gray-500">Data: {formatDate(appState.winner.registrationDate)}</span>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md w-full max-w-lg flex flex-col items-center">
            {isAnimating ? (
              <>
                <motion.div
                  className="mb-6"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="block text-6xl font-extrabold text-primary animate-bounce">
                    {countdown > 0 ? countdown : 'Sorteando...'}
                  </span>
                </motion.div>
                <div className="text-lg text-gray-700 font-medium">Prepare-se! O sorteio será realizado em instantes...</div>
              </>
            ) : (
              <>
                <button
                  onClick={handleConfirmDraw}
                  className="btn btn-primary w-full py-3 text-lg mt-2"
                  disabled={appState.participants.length === 0}
                >
                  Iniciar Sorteio
                </button>
              </>
            )}
          </div>
        )}

        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Confirmar Sorteio</h3>
              <p className="mb-6 text-gray-600">
                Tem certeza que deseja realizar o sorteio agora? Esta ação não poderá ser desfeita.
              </p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="btn btn-outline"
                  disabled={isAnimating}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDraw}
                  className="btn btn-primary flex items-center gap-2"
                  disabled={isAnimating}
                >
                  <Gift size={18} />
                  Confirmar Sorteio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DrawPage;