import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ViewNumbersModalProps {
  onClose: () => void;
  whatsapp: string;
}

interface UserNumber {
  number: number;
  type: 'regular' | 'extra';
  date: string;
}

interface ExtraNumbersRequest {
  id: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  valor_compra: number;
  numeros_extras: number;
  created_at: string;
  numeros_escolhidos: number[] | null;
}

const ViewNumbersModal: React.FC<ViewNumbersModalProps> = ({ onClose, whatsapp }) => {
  const [numbers, setNumbers] = useState<UserNumber[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ExtraNumbersRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [whatsapp]);

  // Atualizar modal em tempo real se pendências mudarem
  useEffect(() => {
    const uniqueChannelName = `schema-db-changes_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes',
          filter: `whatsapp=eq.${whatsapp}`
        },
        fetchUserData
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [whatsapp]);

  const fetchUserData = async () => {
    try {
      // Fetch regular numbers
      const { data: regularNumbers, error: regularError } = await supabase
        .from('participants')
        .select('number, registration_date')
        .eq('whatsapp', whatsapp)
        .order('registration_date', { ascending: false });

      if (regularError) throw regularError;

      // Fetch extra numbers requests
      const { data: requests, error: requestsError } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('whatsapp', whatsapp)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Process regular numbers
      const regularNumbersList: UserNumber[] = (regularNumbers || []).map(n => ({
        number: n.number,
        type: 'regular' as const,
        date: n.registration_date
      }));

      // Process extra numbers from approved requests
      const extraNumbersList: UserNumber[] = (requests || [])
        .filter(r => r.status === 'aprovado' && r.numeros_escolhidos)
        .flatMap(r => 
          (r.numeros_escolhidos || []).map(num => ({
            number: num,
            type: 'extra' as const,
            date: r.created_at
          }))
        );

      // Combine and sort all numbers
      setNumbers([...regularNumbersList, ...extraNumbersList]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      // Set pending requests
      setPendingRequests(requests?.filter(r => r.status === 'pendente') || []);

      setError('');
    } catch (err) {
      console.error('Error fetching numbers:', err);
      setError('Erro ao carregar seus números. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
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
                <h2 className="text-2xl font-bold text-gray-800">
                  Meus Números
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Fechar"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                  <p className="text-red-700">{error}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingRequests.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                      <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                        <Clock size={18} />
                        Solicitações Pendentes
                      </h3>
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="mt-2 text-sm text-yellow-700">
                          <p>• {request.numeros_extras} números extras</p>
                          <p className="text-xs text-yellow-600">
                            Valor: {formatCurrency(request.valor_compra)} - 
                            Solicitado em {formatDate(request.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {numbers.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-600">
                        Nenhum número encontrado para este WhatsApp.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-sm text-gray-600">
                          Total de números: <span className="font-semibold">{numbers.length}</span>
                        </p>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto pr-2">
                        {numbers.map((num, index) => (
                          <motion.div
                            key={`${num.number}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-semibold text-gray-800">
                                {num.number}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                num.type === 'extra' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {num.type === 'extra' ? 'Extra' : 'Regular'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Registrado em: {formatDate(num.date)}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ViewNumbersModal;