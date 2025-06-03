import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useApp } from '../../contexts/AppContext';
import { Participant } from '../../types';
import { exportParticipantsAsCSV } from '../../services/dataService';
import { Download, Search } from 'lucide-react';

const ParticipantsList: React.FC = () => {
  const { appState, refreshData } = useApp();
  const [search, setSearch] = useState('');
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    // Filter participants based on search term
    const filtered = appState.participants.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.whatsapp.includes(search) ||
        p.number.toString().includes(search)
    );
    setFilteredParticipants(filtered);
  }, [search, appState.participants]);

  const handleExportCSV = () => {
    const csvContent = exportParticipantsAsCSV();
    if (!csvContent) {
      return;
    }

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'participantes_zkpremios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Agrupar participantes por nome e whatsapp
  const groupedParticipants = filteredParticipants.reduce((acc, curr) => {
    const key = curr.name + '|' + curr.whatsapp;
    if (!acc[key]) {
      acc[key] = { ...curr, numbers: [curr.number] };
    } else {
      acc[key].numbers.push(curr.number);
    }
    return acc;
  }, {} as Record<string, Participant & { numbers: number[] }>);
  const participantsArray = Object.values(groupedParticipants);

  // Adicionado para debug: mostrar todos os participantes carregados
  console.log('Participantes carregados:', participantsArray);

  return (
    <AdminLayout title="Participantes">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-4xl">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar participante..."
                className="form-input pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="btn btn-outline flex items-center gap-2"
              disabled={appState.participants.length === 0}
            >
              <Download size={18} />
              Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            {participantsArray.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Números
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Registro
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participantsArray.map((participant, idx) => (
                    <tr key={participant.whatsapp + '-' + idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{participant.whatsapp}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {participant.numbers.sort((a, b) => a - b).map((num) => (
                            <span key={num} className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                              {num}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(participant.registrationDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum participante registrado ainda.</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Total de participantes: {appState.participants.length}
            {search && ` (Exibindo ${filteredParticipants.length} resultados)`}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ParticipantsList;