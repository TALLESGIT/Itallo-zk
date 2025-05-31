import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Check, X, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../../contexts/AppContext';
import { generateExtraNumbers } from '../../services/dataService';

interface ExtraNumbersRequest {
  id: string;
  nome_completo: string;
  whatsapp: string;
  valor_compra: number;
  numeros_extras: number;
  comprovante_url: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'concluido';
  created_at: string;
  numeros_escolhidos: number[] | null;
}

const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ExtraNumbersRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { appState, refreshData } = useApp();

  useEffect(() => {
    fetchRequests();

    // Subscribe to changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: ExtraNumbersRequest) => {
    if (request.status !== 'pendente' || processingId) {
      toast.error('Esta solicitação já foi processada ou está em andamento');
      return;
    }
    setProcessingId(request.id);
    try {
      // Gerar números extras disponíveis
      const numbers = await generateExtraNumbers(request.id, request.numeros_extras);

      // Inserir todos os participantes de uma vez
      const participantsToInsert = numbers.map(number => ({
        name: request.nome_completo,
        whatsapp: request.whatsapp,
        number: number,
        registration_date: new Date().toISOString()
      }));
      const { error: insertError } = await supabase
        .from('participants')
        .insert(participantsToInsert);
      if (insertError) throw insertError;

      // Só agora atualizar a solicitação para concluido e salvar os números escolhidos
      const { data: updateData, error: updateError, count } = await supabase
        .from('solicitacoes')
        .update({
          numeros_escolhidos: numbers,
          status: 'concluido'
        })
        .eq('id', request.id)
        .select('*', { count: 'exact' });
      console.log('Resultado do update da solicitação:', { updateData, updateError, count });
      if (updateError) {
        console.error('Erro ao atualizar status da solicitação:', updateError);
        toast.error('Erro ao atualizar status da solicitação. Veja o console.');
        throw updateError;
      }
      if (count === 0) {
        toast.error('Nenhuma solicitação foi atualizada. Verifique se o ID está correto e se há permissão.');
        console.warn('Nenhuma linha foi alterada no update da solicitação.');
      }

      toast.success(`Solicitação aprovada! ${numbers.length} números foram gerados automaticamente.`);
      await fetchRequests();
      await refreshData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Erro ao aprovar solicitação. Tente novamente.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: ExtraNumbersRequest) => {
    if (request.status !== 'pendente' || processingId) {
      toast.error('Esta solicitação já foi processada ou está em andamento');
      return;
    }
    setProcessingId(request.id);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ 
          status: 'concluido',
          numeros_escolhidos: [] 
        })
        .eq('id', request.id);

      if (error) throw error;
      
      toast.success('Solicitação rejeitada com sucesso');
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Erro ao rejeitar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
            Concluído
          </span>
        );
      case 'rejeitado':
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
            Rejeitado
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
            Pendente
          </span>
        );
    }
  };

  return (
    <AdminLayout title="Solicitações de Números Extras">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-4xl">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600">Nenhuma solicitação encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{request.nome_completo}</h3>
                      <p className="text-gray-600">{request.whatsapp}</p>
                      <div className="flex gap-4">
                        <span className="text-sm">
                          Valor: <strong>{formatCurrency(request.valor_compra)}</strong>
                        </span>
                        <span className="text-sm">
                          Números extras: <strong>{request.numeros_extras}</strong>
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Solicitado em: {formatDate(request.created_at)}
                      </p>
                      <div className="mt-2">{getStatusBadge(request.status)}</div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <a
                        href={request.comprovante_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline w-full md:w-auto flex items-center gap-2"
                      >
                        <Eye size={18} />
                        Ver Comprovante
                      </a>

                      {request.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => handleApprove(request)}
                            className="btn btn-primary w-full md:w-auto flex items-center gap-2"
                            disabled={!!processingId}
                          >
                            {processingId === request.id ? (
                              <span className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent border-white rounded-full"></span>
                            ) : <Check size={18} />}
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            className="btn btn-outline text-red-500 border-red-500 hover:bg-red-50 w-full md:w-auto flex items-center gap-2"
                            disabled={!!processingId}
                          >
                            {processingId === request.id ? (
                              <span className="animate-spin h-5 w-5 mr-2 border-2 border-t-transparent border-red-500 rounded-full"></span>
                            ) : <X size={18} />}
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {request.status === 'concluido' && request.numeros_escolhidos && request.numeros_escolhidos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium mb-2">Números atribuídos:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.numeros_escolhidos.map(number => (
                          <span
                            key={number}
                            className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                          >
                            {number}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default RequestsPage;