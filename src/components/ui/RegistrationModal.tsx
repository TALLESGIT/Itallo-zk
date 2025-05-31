import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import { X, Send, ArrowRight } from 'lucide-react';

interface RegistrationModalProps {
  number: number;
  onClose: () => void;
  onComplete: (name: string, whatsapp: string) => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ number, onClose, onComplete }) => {
  const { addParticipant } = useApp();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [errors, setErrors] = useState({ name: '', whatsapp: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [canConfirm, setCanConfirm] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryWhatsapp, setRecoveryWhatsapp] = useState('');
  const [recoveryName, setRecoveryName] = useState('');

  const validateForm = (): boolean => {
    const newErrors = { name: '', whatsapp: '' };
    let isValid = true;

    const nameWords = name.trim().split(' ').filter(Boolean);
    if (nameWords.length < 2) {
      newErrors.name = 'Por favor, insira seu nome completo (nome e sobrenome)';
      isValid = false;
    }

    const whatsappRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!whatsappRegex.test(whatsapp)) {
      newErrors.whatsapp = 'Formato inválido. Use: (XX) XXXXX-XXXX';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setStep('confirmation');
    
    // Enable confirmation button after 4 seconds
    setTimeout(() => {
      setCanConfirm(true);
    }, 4000);
  };

  const handleWhatsAppConfirmation = async () => {
    setIsSubmitting(true);
    const result = await addParticipant({
      name,
      whatsapp,
      number,
    });
    setIsSubmitting(false);
    if (result.success) {
      onComplete(name, whatsapp);
    } else if (result.reason === 'whatsapp_exists' && result.participant) {
      setShowRecovery(true);
      setRecoveryWhatsapp(result.participant.whatsapp);
      setRecoveryName(result.participant.name);
    }
  };

  const formatWhatsApp = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      return digits.length ? `(${digits}` : '';
    } else if (digits.length <= 7) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    } else {
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
    }
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="modal-content bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-gray-800">
                    {step === 'form' ? (
                      <span className="flex items-center gap-2">
                        Número {number}
                        <span className="text-sm font-normal text-gray-500">
                          (Etapa 1 de 2)
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Confirmar WhatsApp
                        <span className="text-sm font-normal text-gray-500">
                          (Etapa 2 de 2)
                        </span>
                      </span>
                    )}
                  </h2>
                </motion.div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Fechar"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              {step === 'form' ? (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                >
                  <div className="space-y-4">
                    <div className="form-control">
                      <label htmlFor="name" className="form-label">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="form-input rounded-xl"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: João Silva"
                        required
                      />
                      {errors.name && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="form-error"
                        >
                          {errors.name}
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="form-control">
                      <label htmlFor="whatsapp" className="form-label">
                        WhatsApp
                      </label>
                      <input
                        type="text"
                        id="whatsapp"
                        className="form-input rounded-xl"
                        value={whatsapp}
                        onChange={handleWhatsAppChange}
                        placeholder="(XX) XXXXX-XXXX"
                        maxLength={15}
                        required
                      />
                      {errors.whatsapp && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="form-error"
                        >
                          {errors.whatsapp}
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="btn btn-outline rounded-xl"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary rounded-xl flex items-center gap-2"
                      disabled={isSubmitting}
                    >
                      Próximo
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-blue-50 p-4 rounded-xl mb-6">
                    <h3 className="font-semibold text-blue-800 mb-2">
                      Instruções para confirmar:
                    </h3>
                    <ul className="space-y-2 text-blue-700">
                      <li>1. O WhatsApp será aberto em uma nova aba/janela.</li>
                      <li>2. Envie a mensagem pré-definida para o administrador.</li>
                      <li>3. Após 4s, o botão "Confirmar Participação" será habilitado aqui.</li>
                      <li>4. Se o WhatsApp não abrir, verifique seu navegador.</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl mb-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Nome:</span>
                      <span className="font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">WhatsApp:</span>
                      <span className="font-medium">{whatsapp}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Número escolhido:</span>
                      <span className="font-medium">{number}</span>
                    </div>
                  </div>

                  {showRecovery && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-4 text-center">
                      <h2 className="text-xl font-bold text-yellow-800 mb-2">Já existe cadastro para este WhatsApp</h2>
                      <p className="text-gray-700 mb-2">O número <span className="font-mono">{formatWhatsApp(recoveryWhatsapp)}</span> já está cadastrado como <b>{recoveryName}</b>.</p>
                      <p className="text-gray-700">Se este número é seu, recupere o acesso na tela inicial clicando em "Recupere seu cadastro".</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="btn btn-outline rounded-xl"
                      onClick={() => setStep('form')}
                      disabled={isSubmitting}
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleWhatsAppConfirmation}
                      className={`btn btn-primary rounded-xl flex items-center gap-2 ${
                        !canConfirm && 'opacity-50 cursor-not-allowed'
                      }`}
                      disabled={isSubmitting || !canConfirm}
                    >
                      {isSubmitting ? (
                        'Processando...'
                      ) : (
                        <>
                          Confirmar Participação
                          <Send size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationModal;