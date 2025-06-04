import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Banner from '../components/ui/Banner';
import NumberGrid from '../components/ui/NumberGrid';
import { useApp } from '../contexts/AppContext';
import { Plus, Eye } from 'lucide-react';
import ExtraNumbersModal from '../components/ui/ExtraNumbersModal';
import ViewNumbersModal from '../components/ui/ViewNumbersModal';
import { toast } from 'react-toastify';
import { getParticipants } from '../services/dataService';

const HomePage: React.FC = () => {
  const { appState } = useApp();
  const { selectedNumbers } = appState;
  const [showExtraNumbersModal, setShowExtraNumbersModal] = useState(false);
  const [showViewNumbersModal, setShowViewNumbersModal] = useState(false);
  const [hasSelectedNumber, setHasSelectedNumber] = useState(() => {
    return localStorage.getItem('hasSelectedNumber') === 'true';
  });
  const [userWhatsapp, setUserWhatsapp] = useState(() => {
    return localStorage.getItem('userWhatsapp') || '';
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || '';
  });
  const [selectedNumber, setSelectedNumber] = useState(() => {
    const saved = localStorage.getItem('selectedNumber');
    return saved ? parseInt(saved, 10) : null;
  });
  
  const totalNumbers = 1000;
  const availableNumbers = totalNumbers - selectedNumbers.length;
  const progressPercentage = (selectedNumbers.length / totalNumbers) * 100;

  // Ref para o banner
  const bannerRef = useRef<HTMLDivElement>(null);

  // Novo estado para recuperação
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryWhatsapp, setRecoveryWhatsapp] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'input'|'found'|'notfound'>('input');
  const [recoveredName, setRecoveredName] = useState('');
  const [recoveredNumber, setRecoveredNumber] = useState<number|null>(null);

  // Novo estado para o modal do banner
  const [showBannerModal, setShowBannerModal] = useState(() => {
    return localStorage.getItem('showBannerModal') === 'true';
  });

  // Novo estado para redirecionamento após clicar no banner
  const [pendingBannerRedirect, setPendingBannerRedirect] = useState(false);

  // Função para formatar WhatsApp
  const formatWhatsapp = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) {
      return digits.length ? `(${digits}` : '';
    } else if (digits.length <= 7) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    } else if (digits.length <= 11) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 3)} ${digits.substring(3, 7)}-${digits.substring(7, 11)}`;
    } else {
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 3)} ${digits.substring(3, 7)}-${digits.substring(7, 11)}`;
    }
  };

  // Exibe banner só se localStorage limpo e usuário clicar em "Recuperar cadastro"
  const tryShowRecovery = () => {
    setShowRecovery(true);
    setRecoveryStep('input');
    setRecoveryWhatsapp('');
    setRecoveryError('');
  };

  useEffect(() => {
    // Restore state from localStorage
    const hasSelected = localStorage.getItem('hasSelectedNumber') === 'true';
    const savedWhatsapp = localStorage.getItem('userWhatsapp');
    const savedName = localStorage.getItem('userName');
    const savedNumber = localStorage.getItem('selectedNumber');

    setHasSelectedNumber(hasSelected);
    if (savedWhatsapp) setUserWhatsapp(savedWhatsapp);
    if (savedName) setUserName(savedName);
    if (savedNumber) setSelectedNumber(parseInt(savedNumber, 10));

    // Se o localStorage indica cadastro, mas o WhatsApp não existe mais no banco, limpar localStorage
    if (hasSelected && savedWhatsapp) {
      (async () => {
        try {
          const participants = await getParticipants();
          const found = participants.find(p => p.whatsapp === savedWhatsapp);
          if (!found) {
            // Limpa localStorage e estados
            localStorage.removeItem('hasSelectedNumber');
            localStorage.removeItem('userWhatsapp');
            localStorage.removeItem('userName');
            localStorage.removeItem('selectedNumber');
            setHasSelectedNumber(false);
            setUserWhatsapp('');
            setUserName('');
            setSelectedNumber(null);
          }
        } catch (e) {
          // ignore
        }
      })();
    }

    // Se localStorage está limpo, mas o WhatsApp já existe no backend, exibe recuperação
    if (!hasSelected && !savedWhatsapp) {
      (async () => {
        try {
          const participants = await getParticipants();
          // Busca pelo WhatsApp do navegador (se o usuário digitar na tela de cadastro)
          // Aqui, tentamos identificar se o usuário já participou antes
          // Se houver apenas UM participante com o mesmo IP (ou outro critério, se disponível), exibe recuperação
          // Como fallback, se o usuário tentar cadastrar e já existir, o modal de recuperação aparece normalmente
          // Aqui, só mostramos se o WhatsApp já existe no backend para este navegador
          // Como não temos o WhatsApp, não mostramos nada (fluxo seguro)
        } catch (e) {
          // ignore
        }
      })();
    }
  }, []);

  // Função para recuperar cadastro pelo WhatsApp
  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoveryStep('input');
    if (!recoveryWhatsapp) return;
    setRecoveryLoading(true);
    try {
      const participants = await getParticipants();
      const found = participants.find(p => p.whatsapp === recoveryWhatsapp);
      if (found) {
        setRecoveredName(found.name);
        setRecoveredNumber(found.number);
        setRecoveryStep('found');
        // Só salva no localStorage se usuário clicar em "Recuperar acesso"
      } else {
        setRecoveryStep('notfound');
        setRecoveryError('Nenhum cadastro encontrado para este WhatsApp.');
      }
    } catch (err) {
      setRecoveryError('Erro ao buscar cadastro. Tente novamente.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Função para realmente restaurar o acesso
  const handleRestoreAccess = () => {
    if (recoveredName && recoveredNumber && recoveryWhatsapp) {
      setUserWhatsapp(recoveryWhatsapp);
      setUserName(recoveredName);
      setSelectedNumber(recoveredNumber);
      setHasSelectedNumber(true);
      localStorage.setItem('userWhatsapp', recoveryWhatsapp);
      localStorage.setItem('userName', recoveredName);
      localStorage.setItem('selectedNumber', recoveredNumber.toString());
      localStorage.setItem('hasSelectedNumber', 'true');
      toast.success('Cadastro recuperado com sucesso!');
      setShowRecovery(false);
    }
  };

  const handleExtraNumbersClick = () => {
    if (!hasSelectedNumber) {
      toast.warning('Você precisa escolher um número e se cadastrar primeiro!');
      return;
    }
    if (!userWhatsapp || !userName) {
      toast.warning('Complete seu cadastro para solicitar números extras!');
      return;
    }
    setShowExtraNumbersModal(true);
  };

  const handleViewNumbersClick = () => {
    if (!hasSelectedNumber) {
      toast.warning('Você precisa escolher um número e se cadastrar primeiro!');
      return;
    }
    if (!userWhatsapp) {
      toast.warning('Complete seu cadastro para ver seus números!');
      return;
    }
    setShowViewNumbersModal(true);
  };

  const handleRegistrationComplete = (name: string, whatsapp: string, number: number) => {
    setUserName(name);
    setUserWhatsapp(whatsapp);
    setSelectedNumber(number);
    setHasSelectedNumber(true);
    // Save all state to localStorage
    localStorage.setItem('userName', name);
    localStorage.setItem('userWhatsapp', whatsapp);
    localStorage.setItem('selectedNumber', number.toString());
    localStorage.setItem('hasSelectedNumber', 'true');
    toast.success('Número reservado com sucesso! Agora você pode solicitar números extras.');
    // Scroll até o banner
    setTimeout(() => {
      bannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  };

  const handleBannerClick = () => {
    setShowBannerModal(true);
    setPendingBannerRedirect(true);
    localStorage.setItem('showBannerModal', 'true');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-16 pb-10 flex justify-center items-start">
        <div className="w-full max-w-2xl px-2 sm:px-4 py-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {showRecovery && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 text-center">
                <h2 className="text-xl font-bold text-yellow-800 mb-2">Recupere seu cadastro</h2>
                {recoveryStep === 'input' && (
                  <>
                    <p className="text-gray-700 mb-4">Informe o WhatsApp usado no cadastro para recuperar seu número e liberar as opções.</p>
                    <form onSubmit={handleRecovery} className="flex flex-col items-center gap-4">
                      <input
                        type="text"
                        className="form-input w-full max-w-xs text-center"
                        placeholder="(XX) X XXXX-XXXX"
                        value={recoveryWhatsapp}
                        onChange={e => setRecoveryWhatsapp(formatWhatsapp(e.target.value))}
                        maxLength={15}
                        disabled={recoveryLoading}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary px-8"
                        disabled={recoveryLoading || recoveryWhatsapp.length < 15}
                      >
                        {recoveryLoading ? 'Buscando...' : 'Recuperar'}
                      </button>
                      {recoveryError && <div className="text-red-600 text-sm mt-2">{recoveryError}</div>}
                    </form>
                  </>
                )}
                {recoveryStep === 'found' && (
                  <>
                    <p className="text-green-700 mb-4">Cadastro encontrado para <b>{recoveredName}</b>! Clique abaixo para restaurar o acesso.</p>
                    <button className="btn btn-success px-8" onClick={handleRestoreAccess}>
                      Recuperar acesso
                    </button>
                  </>
                )}
                {recoveryStep === 'notfound' && (
                  <>
                    <p className="text-red-700 mb-4">Nenhum cadastro encontrado para este WhatsApp.</p>
                    <button className="btn btn-outline px-8" onClick={() => setRecoveryStep('input')}>
                      Tentar outro número
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-primary drop-shadow-sm tracking-tight">
                Bem-vindo ao ZK Prêmios!
              </h1>
              <p className="text-lg text-gray-700 max-w-xl mx-auto font-medium">
                Participe do nosso sorteio exclusivo: escolha seu número da sorte entre <span className="font-bold text-primary">1 e 1000</span> e concorra a prêmios incríveis!<br />
                Após selecionar, preencha seus dados para garantir sua vaga. Não perca essa chance de transformar seu dia com a ZK Prêmios!
              </p>
            </div>
            
            <div ref={bannerRef}>
              <Banner url="https://zksorteios.com.br/campanha/r-usd-10-000-00-reias-no-pix-2" onClick={handleBannerClick} />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 my-8">
              <motion.button
                onClick={handleExtraNumbersClick}
                className={`btn rounded-full flex items-center gap-2 px-6 py-3 ${
                  hasSelectedNumber 
                    ? 'btn-primary' 
                    : 'btn-primary opacity-50 cursor-not-allowed'
                }`}
                whileHover={hasSelectedNumber ? { scale: 1.05 } : {}}
                whileTap={hasSelectedNumber ? { scale: 0.95 } : {}}
                animate={hasSelectedNumber ? { 
                  scale: [1, 1.05, 1],
                  transition: { 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                } : {}}
                disabled={!hasSelectedNumber}
              >
                <Plus size={20} />
                Solicitar números extras
              </motion.button>

              <motion.button
                onClick={handleViewNumbersClick}
                className={`btn btn-outline rounded-full flex items-center gap-2 px-6 py-3 ${
                  hasSelectedNumber ? '' : 'opacity-50 cursor-not-allowed'
                }`}
                whileHover={hasSelectedNumber ? { scale: 1.05 } : {}}
                whileTap={hasSelectedNumber ? { scale: 0.95 } : {}}
                disabled={!hasSelectedNumber}
              >
                <Eye size={20} />
                Ver Meus Números
              </motion.button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-5 sm:p-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="mb-4 md:mb-0 text-center md:text-left">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Status dos Números
                  </h2>
                  <p className="text-gray-600">
                    {availableNumbers} números disponíveis de {totalNumbers}
                  </p>
                </div>
                
                <div className="w-full md:w-1/2">
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>{selectedNumbers.length} reservados</span>
                    <span>{progressPercentage.toFixed(1)}% preenchido</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-white border border-primary"></div>
                    <span className="text-sm">Disponível</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                    <span className="text-sm">Reservado</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-accent"></div>
                    <span className="text-sm">Selecionado</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                    <span className="text-sm">Bloqueado</span>
                  </div>
                </div>
              </div>
              
              <NumberGrid onRegister={handleRegistrationComplete} />
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />

      {showExtraNumbersModal && (
        <ExtraNumbersModal
          onClose={() => setShowExtraNumbersModal(false)}
          userName={userName}
          userWhatsapp={userWhatsapp}
        />
      )}

      {showViewNumbersModal && (
        <ViewNumbersModal
          onClose={() => setShowViewNumbersModal(false)}
          whatsapp={userWhatsapp}
        />
      )}

      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-primary">Como garantir seus números extras?</h2>
            <p className="mb-6 text-gray-700 text-base">
              <b>1. Clique em "Entendi" abaixo para ser direcionado ao site da ação e realizar sua compra normalmente.</b><br/><br/>
              <b>2. Após concluir a compra, volte para este aplicativo e clique no botão <span className='text-primary'>"Solicitar números extras"</span> na tela principal.</b><br/><br/>
              <b>3. Somente após a equipe ZK Prêmios aprovar, seus números extras serão liberados e confirmados para o sorteio.</b><br/><br/>
              <span className="text-sm text-gray-500">Dúvidas? Fale com nosso suporte pelo WhatsApp.</span>
            </p>
            <button
              className="btn btn-primary px-8"
              onClick={() => {
                setShowBannerModal(false);
                localStorage.removeItem('showBannerModal');
                if (pendingBannerRedirect) {
                  setPendingBannerRedirect(false);
                  window.open('https://zksorteios.com.br/campanha/r-usd-10-000-00-reias-no-pix-2', '_blank');
                }
              }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;