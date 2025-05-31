import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, User, Phone } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';

interface Winner {
  id: string;
  name: string;
  whatsapp: string;
  number: number;
  draw_date: string;
  prize_description?: string;
  prize_value?: string;
}

const WinnersPage: React.FC = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const { data, error } = await supabase
        .from('draws')
        .select(`
          id,
          created_at,
          winner:participants (
            id,
            name,
            whatsapp,
            number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedWinners = data
        .filter(d => d.winner)
        .map(d => ({
          id: d.winner.id,
          name: d.winner.name,
          whatsapp: d.winner.whatsapp,
          number: d.winner.number,
          draw_date: d.created_at,
          prize_description: 'R$ 10.000,00 no PIX',
          prize_value: 'R$ 10.000,00'
        }));

      setWinners(formattedWinners);
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Função robusta para camuflar o telefone
  const maskWhatsapp = (w: string) => {
    const digits = w.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,8)}***`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6,7)}***`;
    }
    return digits.slice(0,3) + '*****';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <div className="inline-block p-3 bg-yellow-100 rounded-full mb-4">
                <Trophy className="w-8 h-8 text-yellow-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
                Ganhadores
              </h1>
              <p className="text-lg text-gray-600">
                Conheça os felizardos que já foram premiados em nossos sorteios!
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : winners.length > 0 ? (
              <div className="grid gap-6">
                {winners.map((winner) => (
                  <motion.div
                    key={winner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-6 h-6 text-yellow-500" />
                          <h3 className="text-xl font-semibold text-gray-800">
                            {winner.prize_description}
                          </h3>
                        </div>
                        <span className="px-4 py-1 bg-primary/10 text-primary rounded-full font-medium">
                          Número: {winner.number}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-600">
                          <User className="w-5 h-5 mr-2" />
                          <span>{winner.name}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-5 h-5 mr-2" />
                          <span>Sorteado em {formatDate(winner.draw_date)}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <Phone className="w-5 h-5 mr-2" />
                          <span>{maskWhatsapp(winner.whatsapp)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Prêmio
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            {winner.prize_value}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  Nenhum sorteio realizado ainda. Fique atento aos próximos!
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default WinnersPage;