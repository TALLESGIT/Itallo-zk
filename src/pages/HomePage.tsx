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

    // Fallback: se localStorage falhar, checar no backend
    if (!hasSelected && savedWhatsapp) {
      (async () => {
        try {
          const participants = await getParticipants();
          const found = participants.find(p => p.whatsapp === savedWhatsapp);
          if (found) {
            setHasSelectedNumber(true);
            setSelectedNumber(found.number);
            setUserName(found.name);
            localStorage.setItem('hasSelectedNumber', 'true');
            localStorage.setItem('selectedNumber', found.number.toString());
            localStorage.setItem('userName', found.name);
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, []);

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
              <Banner url="https://zksorteios.com.br/campanha/r-usd-10-000-00-reias-no-pix-2" />
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
    </div>
  );
};

export default HomePage;