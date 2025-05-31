import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, User, AlertCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

const AdminLogin: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    
    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('Email ou senha inválidos. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center pt-20 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="bg-primary p-6 text-white text-center">
              <h1 className="text-2xl font-bold">Área Administrativa</h1>
              <p className="mt-2 text-white/80">Faça login para acessar o painel</p>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="form-control">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={18} />
                    </div>
                    <input
                      type="email"
                      id="email"
                      className="form-input pl-10"
                      placeholder="admin@zkpremios.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-control">
                  <label htmlFor="password" className="form-label">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      id="password"
                      className="form-input pl-10"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Autenticando...' : 'Entrar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminLogin;