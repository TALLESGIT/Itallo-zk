import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { useApp } from '../../contexts/AppContext';
import { Gift, AlertTriangle, Award, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import { getDrawConfig } from '../../services/dataService';
import type { DrawConfig } from '../../types';

const DrawPage: React.FC = () => {
  const { appState, performDraw } = useApp();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showWinner, setShowWinner] = useState(false);
  const [drawConfig, setDrawConfig] = useState<DrawConfig | null>(null);
  const [modalStep, setModalStep] = useState<'countdown' | 'result' | null>(null);
  const [modalCountdown, setModalCountdown] = useState(5);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Buscar config do sorteio ao abrir página
  useEffect(() => {
    (async () => {
      const config = await getDrawConfig();
      setDrawConfig(config);
    })();
  }, []);

  const handleStartDraw = async () => {
    if (appState.participants.length === 0) {
      return;
    }
    if (appState.isDrawComplete) {
      return;
    }
    setShowConfirmation(true);
  };

  // Função para camuflar WhatsApp
  const maskWhatsapp = (w: string) => w.replace(/(\d{2}\) \d{5}-)\d{4}/, '$1****');

  // Função para gerar link WhatsApp
  const getWhatsappLink = (name: string, number: string, prize: string, sorteio: string) => {
    const msg =
      `🎉 Parabéns, ${name}! Você foi o grande vencedor do sorteio ${sorteio} com o número ${number}! Em breve entraremos em contato para entrega do prêmio.\n\nAgradecemos por participar e confiar na ZK Prêmios. Continue acompanhando nossas ações e boa sorte nos próximos sorteios! 🚀✨`;
    const phone = (appState.winner?.whatsapp || '').replace(/\D/g, '');
    return `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleConfirmDraw = async () => {
    setShowConfirmation(false);
    setModalStep('countdown');
    setModalCountdown(5);
    setShowFireworks(false);
    // Contagem regressiva
    for (let i = 5; i > 0; i--) {
      setModalCountdown(i);
      await new Promise((res) => setTimeout(res, 1000));
    }
    setModalCountdown(0);
    // Pequena pausa
    await new Promise((res) => setTimeout(res, 400));
    await performDraw();
    setShowFireworks(true);
    setModalStep('result');
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

  // Função para abrir o modal de resultado manualmente
  const handleShowResultModal = () => {
    setModalStep('result');
    setShowResultModal(true);
  };

  // Função para fechar qualquer modal
  const handleCloseModal = () => {
    setModalStep(null);
    setShowResultModal(false);
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
          <>
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
                  {maskWhatsapp(appState.winner.whatsapp)}
                  <button onClick={() => handleCopy(appState.winner.whatsapp)} className="ml-1 p-1 rounded hover:bg-gray-200">
                    <Copy size={16} />
                  </button>
                </span>
                <span className="text-sm text-gray-500">Data: {formatDate(appState.winner.registrationDate)}</span>
              </div>
            </motion.div>
            <button
              className="btn btn-primary w-full max-w-xs mx-auto mb-4"
              onClick={handleShowResultModal}
            >
              Ver Resultado Animado
            </button>
          </>
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

        {modalStep && (showResultModal || modalStep !== 'result') && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 overflow-hidden relative flex flex-col items-center">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-primary z-20"
                onClick={handleCloseModal}
                aria-label="Fechar"
              >
                ✕
              </button>
              {modalStep === 'countdown' && (
                <div className="flex flex-col items-center justify-center py-16">
                  <span className="text-6xl font-extrabold text-primary animate-bounce mb-4">{modalCountdown}</span>
                  <div className="text-lg text-gray-700 font-medium">Prepare-se! O sorteio será realizado em instantes...</div>
                </div>
              )}
              {modalStep === 'result' && appState.winner && drawConfig && (
                <div className="flex flex-col items-center justify-center py-8 px-4 w-full">
                  {/* Fogos de artifício animados */}
                  {showFireworks && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      {/* Simples animação SVG de fogos */}
                      <svg width="100%" height="100%" className="animate-fade-in" style={{position:'absolute',top:0,left:0}}>
                        <circle cx="50%" cy="60" r="30" fill="#facc15" opacity="0.5">
                          <animate attributeName="r" from="0" to="80" dur="0.8s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.8" to="0" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="80%" cy="100" r="20" fill="#38bdf8" opacity="0.5">
                          <animate attributeName="r" from="0" to="60" dur="1s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.8" to="0" dur="1s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="30%" cy="120" r="18" fill="#f472b6" opacity="0.5">
                          <animate attributeName="r" from="0" to="50" dur="0.7s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.8" to="0" dur="0.7s" repeatCount="indefinite" />
                        </circle>
                      </svg>
                    </div>
                  )}
                  {/* Banner */}
                  <img src={drawConfig.imageUrl} alt="Banner Sorteio" className="w-full max-h-40 object-cover rounded-xl mb-4 border" />
                  <h3 className="text-2xl font-bold text-primary mb-2 text-center">{drawConfig.name}</h3>
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <span className="inline-block px-8 py-4 bg-primary text-white text-4xl font-extrabold rounded-xl shadow-lg animate-pulse mb-2">
                      {appState.winner.number}
                    </span>
                    <span className="text-lg font-semibold text-gray-800">{appState.winner.name}</span>
                    <span className="text-gray-600 flex items-center gap-2">
                      {maskWhatsapp(appState.winner.whatsapp)}
                      <a
                        href={getWhatsappLink(appState.winner.name, appState.winner.number, drawConfig.value, drawConfig.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 p-2 rounded-full bg-green-100 hover:bg-green-200 transition"
                        title="Chamar no WhatsApp"
                      >
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path fill="#25D366" d="M12 2C6.477 2 2 6.477 2 12c0 1.85.504 3.58 1.38 5.07L2.06 22l5.08-1.33A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Z"/><path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.967-.94 1.166-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.21-.242-.58-.487-.501-.67-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074.149.198 2.1 3.205 5.077 4.372.71.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347Z"/></svg>
                      </a>
                    </span>
                    <span className="text-sm text-gray-500">Data: {formatDate(appState.winner.registrationDate)}</span>
                  </div>
                  <button className="btn btn-primary mt-4 w-full" onClick={() => setModalStep(null)}>Fechar</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DrawPage;