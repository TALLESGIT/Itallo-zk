import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import RegistrationModal from './RegistrationModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

interface NumberGridProps {
  onRegister: (name: string, whatsapp: string, number: number) => void;
}

const NumberGrid: React.FC<NumberGridProps> = ({ onRegister }) => {
  const { appState, isNumberTaken } = useApp();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedNumber');
    return saved ? parseInt(saved, 10) : null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const numbersPerPage = 100;
  const totalPages = 10;

  useEffect(() => {
    // Check if user has already selected a number
    const hasSelected = localStorage.getItem('hasSelectedNumber') === 'true';
    const savedNumber = localStorage.getItem('selectedNumber');
    
    if (hasSelected && savedNumber) {
      setSelectedNumber(parseInt(savedNumber, 10));
    }
  }, []);

  const handleNumberClick = (number: number) => {
    const hasSelected = localStorage.getItem('hasSelectedNumber') === 'true';
    
    if (hasSelected) {
      toast.warning('Você já escolheu um número para este sorteio!');
      return;
    }

    if (!isNumberTaken(number)) {
      setSelectedNumber(number);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNumber(null);
  };

  const handleRegistrationComplete = (name: string, whatsapp: string) => {
    if (selectedNumber === null) return;
    
    // Save selection state to localStorage
    localStorage.setItem('hasSelectedNumber', 'true');
    localStorage.setItem('selectedNumber', selectedNumber.toString());
    localStorage.setItem('userName', name);
    localStorage.setItem('userWhatsapp', whatsapp);
    
    onRegister(name, whatsapp, selectedNumber);
    handleCloseModal();
  };

  const renderNumbers = () => {
    const startNumber = currentPage * numbersPerPage + 1;
    const endNumber = startNumber + numbersPerPage - 1;
    const numbers = [];

    for (let i = startNumber; i <= endNumber; i++) {
      const isTaken = isNumberTaken(i);
      const isSelected = selectedNumber === i;
      const hasSelected = localStorage.getItem('hasSelectedNumber') === 'true';
      
      const className = `number-item flex items-center justify-center w-full h-full rounded-lg text-lg font-semibold transition-all duration-200 ${
        isTaken 
          ? 'bg-primary text-white cursor-not-allowed' 
          : isSelected 
          ? 'bg-accent text-white transform scale-105 shadow-lg' 
          : hasSelected
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white hover:bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:transform hover:-translate-y-1 hover:shadow-md'
      }`;
      
      numbers.push(
        <motion.div
          key={i}
          className="aspect-square"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: i % 100 * 0.001 }}
        >
          <button
            className={className}
            onClick={() => !isTaken && !hasSelected && handleNumberClick(i)}
            disabled={isTaken || hasSelected}
          >
            {i}
          </button>
        </motion.div>
      );
    }
    return numbers;
  };

  return (
    <>
      <div className="flex flex-col items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="btn btn-outline flex items-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>
          <span className="mx-2 text-sm font-medium text-gray-700 whitespace-nowrap">
            Página {currentPage + 1} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="btn btn-outline flex items-center gap-2 disabled:opacity-50"
          >
            Próximo
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div className="number-grid">
        {renderNumbers()}
      </div>
      
      {isModalOpen && selectedNumber && (
        <RegistrationModal
          number={selectedNumber}
          onClose={handleCloseModal}
          onComplete={handleRegistrationComplete}
        />
      )}
    </>
  );
};

export default NumberGrid;