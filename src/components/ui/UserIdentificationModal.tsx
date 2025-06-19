import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserIdentificationModalProps {
  onClose: () => void;
  onIdentified: (name: string, whatsapp: string, number?: number) => void;
}

const UserIdentificationModal: React.FC<UserIdentificationModalProps> = ({ onClose, onIdentified }) => {
  const [whatsapp, setWhatsapp] = useState('');
  const [name, setName] = useState('');
  const [number, setNumber] = useState<number | null>(null);
  const [step, setStep] = useState<'input' | 'found' | 'notfound' | 'loading'>('input');
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('loading');
    try {
      const { data, error: fetchError } = await supabase
        .from('participants')
        .select('name, whatsapp, number')
        .eq('whatsapp', whatsapp)
        .single();
      if (fetchError || !data) {
        setStep('notfound');
        setNumber(null);
        setName('');
      } else {
        setName(data.name);
        setNumber(data.number);
        setStep('found');
      }
    } catch (err) {
      setError('Erro ao buscar cadastro. Tente novamente.');
      setStep('input');
    }
  };

  const handleConfirm = () => {
    if (step === 'found' && name && whatsapp) {
      onIdentified(name, whatsapp, number || undefined);
      onClose();
    } else if (step === 'notfound' && name && whatsapp) {
      onIdentified(name, whatsapp);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
        >
          <h2 className="text-2xl font-bold text-center mb-4 text-primary">Identifique-se</h2>
          <p className="text-center text-gray-600 mb-4 text-sm">
            Para acessar seus números e solicitar extras, digite o <b>mesmo WhatsApp usado no cadastro</b>.<br/>
            Assim, você recupera seu acesso em qualquer navegador ou dispositivo.<br/>
            Caso ainda não tenha cadastro, preencha seu nome para criar um novo.
          </p>
          {step === 'input' && (
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="form-label flex items-center gap-2"><Smartphone size={16}/> WhatsApp</label>
                <input
                  type="text"
                  className="form-input w-full rounded-xl"
                  placeholder="Digite seu WhatsApp"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">Buscar cadastro</button>
              {error && <div className="form-error text-center">{error}</div>}
            </form>
          )}
          {step === 'loading' && (
            <div className="text-center py-8">Buscando cadastro...</div>
          )}
          {step === 'found' && (
            <div className="text-center space-y-4">
              <div className="flex flex-col items-center gap-2">
                <User size={32} className="text-primary" />
                <div className="text-lg font-semibold">{name}</div>
                <div className="text-gray-600">WhatsApp: {whatsapp}</div>
                <div className="text-gray-600">Número: {number}</div>
              </div>
              <button className="btn btn-primary w-full" onClick={handleConfirm}>Confirmar e acessar</button>
            </div>
          )}
          {step === 'notfound' && (
            <form onSubmit={e => { e.preventDefault(); handleConfirm(); }} className="space-y-4">
              <div className="text-center text-gray-700 mb-2">Cadastro não encontrado. Informe seu nome para criar um novo cadastro.</div>
              <div>
                <label className="form-label flex items-center gap-2"><User size={16}/> Nome completo</label>
                <input
                  type="text"
                  className="form-input w-full rounded-xl"
                  placeholder="Digite seu nome completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">Cadastrar e acessar</button>
              {error && <div className="form-error text-center">{error}</div>}
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserIdentificationModal; 