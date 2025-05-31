import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useApp } from '../../contexts/AppContext';
import { getDashboardStats } from '../../services/dataService';
import { Users, Tag, Award, CircleDollarSign } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { appState, refreshData } = useApp();
  const [stats, setStats] = useState({
    totalParticipants: 0,
    reservedNumbers: 0,
    availableNumbers: 1000,
    reservationRate: 0,
    isDrawComplete: false,
    winner: null,
    drawDate: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        await refreshData();
        const currentStats = await getDashboardStats();
        setStats(currentStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
        // Keep the previous stats state on error
      }
    };

    fetchDashboardData();
  }, [refreshData, appState.participants.length, appState.isDrawComplete]);

  // Format date for display
  const formatDate = (dateString: string) => {
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

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative\" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Participantes</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.totalParticipants}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-blue-500">
                  <Users size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Números Reservados</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.reservedNumbers}</h3>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg text-primary">
                  <Tag size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Números Disponíveis</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.availableNumbers}</h3>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-accent">
                  <Tag size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Taxa de Ocupação</p>
                  <h3 className="text-2xl font-bold mt-1">{stats.reservationRate.toFixed(1)}%</h3>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-yellow-500">
                  <CircleDollarSign size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Status do Sorteio</h2>
              
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full mr-2 ${stats.isDrawComplete ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>{stats.isDrawComplete ? 'Sorteio Realizado' : 'Sorteio Pendente'}</span>
              </div>
              
              {stats.isDrawComplete && stats.winner && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="text-green-500" size={20} />
                    <h3 className="font-semibold">Vencedor do Sorteio</h3>
                  </div>
                  <p><strong>Nome:</strong> {stats.winner.name}</p>
                  <p><strong>Número:</strong> {stats.winner.number}</p>
                  <p><strong>WhatsApp:</strong> {stats.winner.whatsapp}</p>
                  <p><strong>Data do Sorteio:</strong> {formatDate(stats.drawDate as string)}</p>
                </div>
              )}
              
              {!stats.isDrawComplete && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p>O sorteio ainda não foi realizado. Vá para a página de Sorteio para realizá-lo.</p>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Progresso da Campanha</h2>
              
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">{stats.reservationRate.toFixed(1)}% Completo</span>
                  <span className="text-sm text-gray-600">{stats.reservedNumbers}/{1000}</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${stats.reservationRate}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Últimos 10 números</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {appState.participants
                      .slice(-10)
                      .reverse()
                      .map((p) => (
                        <span 
                          key={p.id} 
                          className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                        >
                          {p.number}
                        </span>
                      ))}
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Meta de Reservas</p>
                  <div className="mt-2">
                    <span className="text-lg font-semibold text-primary">{stats.reservedNumbers}</span>
                    <span className="text-gray-400"> / 1000</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Faltam {1000 - stats.reservedNumbers} para 100%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;