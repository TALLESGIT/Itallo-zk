import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useApp } from '../../contexts/AppContext';
import { RefreshCw, AlertTriangle, Trash2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { getDrawConfig, saveDrawConfig } from '../../services/dataService';
import type { DrawConfig } from '../../types';

const SettingsPage: React.FC = () => {
  const { resetSystem } = useApp();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [drawConfig, setDrawConfig] = useState<DrawConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Campos do formulário
  const [form, setForm] = useState<Omit<DrawConfig, 'id'>>({
    name: '',
    description: '',
    value: '',
    drawDate: '',
    imageUrl: '',
    isFree: false,
    callToAction: '',
    regulationUrl: '',
  });

  // Carregar config ao abrir
  useEffect(() => {
    (async () => {
      setIsLoadingConfig(true);
      const config = await getDrawConfig();
      setDrawConfig(config);
      if (config) setForm({ ...config });
      setIsLoadingConfig(false);
    })();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    const success = await saveDrawConfig({ ...form, id: drawConfig?.id });
    setIsSavingConfig(false);
    if (success) {
      toast.success('Configuração do sorteio/prêmio salva com sucesso!');
      const config = await getDrawConfig();
      setDrawConfig(config);
      if (config) setForm({ ...config });
    } else {
      toast.error('Erro ao salvar configuração.');
    }
  };

  const handleReset = () => {
    setShowConfirmation(true);
  };

  const confirmReset = async () => {
    setIsResetting(true);
    try {
      const success = await resetSystem();
      if (success) {
        toast.success('Sistema reiniciado com sucesso! Os dados foram apagados.');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Erro ao reiniciar o sistema. Verifique o console para detalhes.');
        console.error('Reset falhou: Os dados podem não ter sido apagados corretamente.');
      }
    } catch (error) {
      console.error('Erro detalhado ao resetar:', error);
      toast.error('Erro inesperado ao reiniciar o sistema. Veja o console para detalhes.');
    } finally {
      setIsResetting(false);
      setShowConfirmation(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (email && email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });

        if (emailError) throw emailError;
      }

      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;
      }

      toast.success('Credenciais atualizadas com sucesso!');
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast.error('Erro ao atualizar credenciais');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminLayout title="Configurações">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-4xl">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-extrabold mb-6 text-primary text-center tracking-tight drop-shadow-sm">Credenciais do Administrador</h2>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-lg mx-auto">
                <form onSubmit={handleUpdateCredentials} className="space-y-8">
                  <div className="flex flex-col gap-3">
                    <label className="block text-base font-semibold text-gray-700 mb-1">Novo Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <input
                        type="email"
                        className="form-input pl-14 py-3 w-full bg-blue-50 focus:bg-white rounded-xl text-base placeholder-gray-400"
                        placeholder="Digite o novo email do administrador"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="block text-base font-semibold text-gray-700 mb-1">Nova Senha</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-primary" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input pl-14 pr-12 py-3 w-full bg-blue-50 focus:bg-white rounded-xl text-base placeholder-gray-400"
                        placeholder="Digite a nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-20 text-gray-400 hover:text-primary"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="block text-base font-semibold text-gray-700 mb-1">Confirmar Nova Senha</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-primary" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-input pl-14 pr-12 py-3 w-full bg-blue-50 focus:bg-white rounded-xl text-base placeholder-gray-400"
                        placeholder="Confirme a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isUpdating}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center z-20 text-gray-400 hover:text-primary"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn w-full py-3 text-lg mt-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-md transition-all duration-200"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Atualizando...' : 'Salvar Alterações'}
                  </button>
                </form>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold mb-6 text-primary text-center tracking-tight drop-shadow-sm">Configuração do Sorteio/Prêmio</h2>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto">
                {isLoadingConfig ? (
                  <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : (
                  <form onSubmit={handleSaveConfig} className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold">Nome do Sorteio/Prêmio</label>
                      <input name="name" value={form.name} onChange={handleFormChange} className="form-input" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold">Descrição</label>
                      <textarea name="description" value={form.description} onChange={handleFormChange} className="form-input" rows={2} required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold">Valor do Prêmio</label>
                      <input name="value" value={form.value} onChange={handleFormChange} className="form-input" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold">Data do Sorteio</label>
                      <input name="drawDate" type="datetime-local" value={form.drawDate} onChange={handleFormChange} className="form-input" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold">URL da Imagem</label>
                      <input name="imageUrl" value={form.imageUrl} onChange={handleFormChange} className="form-input" required />
                    </div>
                    <div className="flex items-center gap-2">
                      <input name="isFree" type="checkbox" checked={form.isFree} onChange={handleFormChange} />
                      <label className="font-semibold">Sorteio Grátis?</label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold">Chamada de Ação</label>
                      <input name="callToAction" value={form.callToAction} onChange={handleFormChange} className="form-input" required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold">Link para Regulamento</label>
                      <input name="regulationUrl" value={form.regulationUrl} onChange={handleFormChange} className="form-input" required />
                    </div>
                    <button type="submit" className="btn btn-primary w-full py-3 text-lg mt-2" disabled={isSavingConfig}>
                      {isSavingConfig ? 'Salvando...' : 'Salvar Configuração'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Reiniciar Sistema</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-medium text-yellow-800">Atenção!</h3>
                    <p className="text-yellow-700">
                      Reiniciar o sistema irá:
                    </p>
                    <ul className="mt-2 space-y-1 text-yellow-700">
                      <li>• Apagar todos os participantes registrados</li>
                      <li>• Remover todas as solicitações de números extras</li>
                      <li>• Excluir todos os comprovantes de pagamento</li>
                      <li>• Limpar o histórico de sorteios</li>
                    </ul>
                    <p className="mt-2 text-yellow-700 font-medium">
                      Esta ação não pode ser desfeita!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="btn btn-outline text-red-500 border-red-500 hover:bg-red-50 w-full flex items-center justify-center gap-2"
                  disabled={isResetting}
                >
                  <Trash2 size={18} />
                  {isResetting ? 'Reiniciando...' : 'Reiniciar Sistema'}
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Informações do Sistema</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <dl className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-gray-600">Versão</dt>
                    <dd className="font-medium">1.0.0</dd>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-gray-600">Ambiente</dt>
                    <dd className="font-medium">Produção</dd>
                  </div>
                  <div className="flex justify-between py-3">
                    <dt className="text-gray-600">Última atualização</dt>
                    <dd className="font-medium">{new Date().toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {showConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Confirmar Reinicialização</h3>
                <p className="mb-6 text-gray-600">
                  Tem certeza que deseja reiniciar o sistema? Todos os dados serão
                  permanentemente apagados.
                </p>
                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="btn btn-outline"
                    disabled={isResetting}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmReset}
                    className="btn btn-primary bg-red-500 hover:bg-red-600 border-none flex items-center gap-2"
                    disabled={isResetting}
                  >
                    <RefreshCw size={18} className={isResetting ? 'animate-spin' : ''} />
                    {isResetting ? 'Reiniciando...' : 'Confirmar Reinicialização'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;