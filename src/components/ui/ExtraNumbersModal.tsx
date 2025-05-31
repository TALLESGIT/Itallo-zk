import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import * as uuid from 'uuid';

interface ExtraNumbersModalProps {
  onClose: () => void;
  userWhatsapp: string;
  userName: string;
}

const ExtraNumbersModal: React.FC<ExtraNumbersModalProps> = ({ onClose, userWhatsapp, userName }) => {
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ amount: '', proof: '' });
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkPendingRequests();
  }, [userWhatsapp]);

  // Atualizar em tempo real se pendência mudar
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes',
          filter: `whatsapp=eq.${userWhatsapp}`
        },
        checkPendingRequests
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userWhatsapp]);

  const checkPendingRequests = async () => {
    const { data: existingRequests } = await supabase
      .from('solicitacoes')
      .select('id, status')
      .eq('whatsapp', userWhatsapp)
      .eq('status', 'pendente');

    setHasPendingRequest(existingRequests ? existingRequests.length > 0 : false);
  };

  const calculateExtraNumbers = (amount: number) => {
    return Math.floor(amount / 7) * 5;
  };

  const validateForm = (): boolean => {
    const newErrors = { amount: '', proof: '' };
    let isValid = true;

    const amount = parseFloat(purchaseAmount);
    if (!amount || amount < 7) {
      newErrors.amount = 'O valor mínimo da compra é R$ 7,00';
      isValid = false;
    }

    if (!selectedFile) {
      newErrors.proof = 'Por favor, envie o comprovante de pagamento';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 5MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Apenas imagens JPG, PNG ou WebP são permitidas');
        return;
      }
      setSelectedFile(file);
      setErrors(prev => ({ ...prev, proof: '' }));
    }
  };

  const uploadProof = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuid.v4()}.${fileExt}`;
    const filePath = `proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('comprovantes')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error('Erro ao enviar comprovante');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('comprovantes')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedFile || hasPendingRequest) {
      return;
    }

    setIsSubmitting(true);

    try {
      const proofUrl = await uploadProof(selectedFile);
      
      const { error } = await supabase
        .from('solicitacoes')
        .insert([{
          nome_completo: userName,
          whatsapp: userWhatsapp,
          valor_compra: parseFloat(purchaseAmount),
          comprovante_url: proofUrl,
          numeros_extras: calculateExtraNumbers(parseFloat(purchaseAmount)),
          status: 'pendente'
        }]);

      if (error) throw error;

      toast.success('Solicitação enviada com sucesso! Aguarde a aprovação do administrador.');
      onClose();
    } catch (error) {
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasPendingRequest) {
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
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Solicitação Pendente</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                  <div>
                    <p className="text-yellow-800">
                      Você já possui uma solicitação pendente de aprovação.
                    </p>
                    <p className="text-yellow-700 text-sm mt-2">
                      Aguarde a análise do administrador para solicitar mais números extras.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="btn btn-primary w-full"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

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
                <h2 className="text-2xl font-bold text-gray-800">
                  Solicitar Números Extras
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Fechar"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  A cada R$ 7,00 em compras na ZK Variedades, você ganha +5 números para o sorteio!
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="form-label">Nome Completo</label>
                    <input
                      type="text"
                      className="form-input rounded-xl bg-gray-50"
                      value={userName}
                      disabled
                    />
                  </div>

                  <div className="form-control">
                    <label className="form-label">WhatsApp</label>
                    <input
                      type="text"
                      className="form-input rounded-xl bg-gray-50"
                      value={userWhatsapp}
                      disabled
                    />
                  </div>

                  <div className="form-control">
                    <label className="form-label">Valor da Compra (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="7"
                      className="form-input rounded-xl"
                      placeholder="Ex: 7.00"
                      value={purchaseAmount}
                      onChange={(e) => {
                        setPurchaseAmount(e.target.value);
                        setErrors(prev => ({ ...prev, amount: '' }));
                      }}
                    />
                    {errors.amount && (
                      <div className="form-error">{errors.amount}</div>
                    )}
                    {purchaseAmount && parseFloat(purchaseAmount) >= 7 && (
                      <div className="mt-2 text-sm text-green-600">
                        Você receberá +{calculateExtraNumbers(parseFloat(purchaseAmount))} números extras
                      </div>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="form-label">Comprovante de Pagamento</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary transition-colors flex flex-col items-center gap-2"
                    >
                      {selectedFile ? (
                        <>
                          <ImageIcon size={24} className="text-primary" />
                          <span className="text-sm text-gray-600">{selectedFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload size={24} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Clique para enviar o comprovante
                          </span>
                          <span className="text-xs text-gray-500">
                            JPG, PNG ou WebP até 5MB
                          </span>
                        </>
                      )}
                    </button>
                    {errors.proof && (
                      <div className="form-error">{errors.proof}</div>
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
                    {isSubmitting ? (
                      'Processando...'
                    ) : (
                      <>
                        Enviar Solicitação
                        <Upload size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExtraNumbersModal;