import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useApp } from '../../contexts/AppContext';
import { RefreshCw, AlertTriangle, Trash2, Mail, Lock, Eye, EyeOff, Upload, Settings, Save, AlertCircle, CheckCircle, Brain, Plus, Edit, Gamepad2, Hash, HelpCircle, Scissors, Unlock } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { getDrawConfig, saveDrawConfig } from '../../services/dataService';
import type { DrawConfig } from '../../types';
import { motion } from 'framer-motion';
import { useGameSettings } from '../../hooks/useGameSettings';

const SettingsPage: React.FC = () => {
  const { resetSystem } = useApp();
  const { gameSettings, updateGameSetting, loading: gameSettingsLoading } = useGameSettings();
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
  const [gameWords, setGameWords] = useState<any[]>([]);
  const [newWord, setNewWord] = useState({ word: '', hint: '' });
  const [editingWord, setEditingWord] = useState<any>(null);
  const [showWordModal, setShowWordModal] = useState(false);

  // Campos do formulário
  const [form, setForm] = useState({
    name: '',
    description: '',
    value: '',
    drawDate: '',
    imageUrl: '',
    isFree: false,
  });

  // Upload da imagem do sorteio
  const [uploading, setUploading] = useState(false);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;
      const filePath = fileName;
      const { error: uploadError } = await supabase.storage.from('banners').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('banners').getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, imageUrl: data.publicUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (err) {
      toast.error('Erro ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  };

  // Carregar config ao abrir
  useEffect(() => {
    (async () => {
      setIsLoadingConfig(true);
      const config = await getDrawConfig();
      setDrawConfig(config);
      if (config) setForm({
        name: config.name,
        description: config.description,
        value: config.value,
        drawDate: config.drawDate,
        imageUrl: config.imageUrl,
        isFree: config.isFree
      });
      setIsLoadingConfig(false);
    })();
    fetchGameWords();
  }, []);

  const fetchGameWords = async () => {
    try {
      const { data, error } = await supabase
        .from('game_words')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGameWords(data || []);
    } catch (error) {
      console.error('Erro ao buscar palavras:', error);
      toast.error('Erro ao carregar palavras do jogo.');
    }
  };

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
      if (config) setForm({
        name: config.name,
        description: config.description,
        value: config.value,
        drawDate: config.drawDate,
        imageUrl: config.imageUrl,
        isFree: config.isFree
      });
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

  const handleSaveWord = async () => {
    if (!newWord.word.trim()) {
      toast.warning('Digite uma palavra válida!');
      return;
    }

    try {
      if (editingWord) {
        const { error } = await supabase
          .from('game_words')
          .update({
            word: newWord.word.trim(),
            hint: newWord.hint.trim()
          })
          .eq('id', editingWord.id);

        if (error) throw error;
        toast.success('Palavra atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('game_words')
          .insert({
            word: newWord.word.trim(),
            hint: newWord.hint.trim(),
            is_active: false
          });

        if (error) throw error;
        toast.success('Palavra adicionada com sucesso!');
      }

      setNewWord({ word: '', hint: '' });
      setEditingWord(null);
      setShowWordModal(false);
      fetchGameWords();
    } catch (error) {
      console.error('Erro ao salvar palavra:', error);
      toast.error('Erro ao salvar palavra.');
    }
  };

  const handleActivateWord = async (wordId: number) => {
    try {
      // Desativar todas as palavras
      await supabase
        .from('game_words')
        .update({ is_active: false })
        .neq('id', 0);

      // Ativar a palavra selecionada
      const { error } = await supabase
        .from('game_words')
        .update({ is_active: true })
        .eq('id', wordId);

      if (error) throw error;
      toast.success('Palavra ativada com sucesso!');
      fetchGameWords();
    } catch (error) {
      console.error('Erro ao ativar palavra:', error);
      toast.error('Erro ao ativar palavra.');
    }
  };

  const handleDeleteWord = async (wordId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta palavra?')) return;

    try {
      const { error } = await supabase
        .from('game_words')
        .delete()
        .eq('id', wordId);

      if (error) throw error;
      toast.success('Palavra excluída com sucesso!');
      fetchGameWords();
    } catch (error) {
      console.error('Erro ao excluir palavra:', error);
      toast.error('Erro ao excluir palavra.');
    }
  };

  const openEditModal = (word: any) => {
    setEditingWord(word);
    setNewWord({ word: word.word, hint: word.hint || '' });
    setShowWordModal(true);
  };

  const openAddModal = () => {
    setEditingWord(null);
    setNewWord({ word: '', hint: '' });
    setShowWordModal(true);
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
                    className="btn w-full py-3 text-lg mt-2 rounded-xl bg-primary hover:bg-primary/80 text-white font-bold shadow-md transition-all duration-200"
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
                    <div className="flex flex-col gap-3">
                      <label className="block text-base font-semibold text-gray-700 mb-1">Imagem do Sorteio</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="form-input"
                          disabled={uploading}
                        />
                        {uploading && <span className="text-sm text-blue-600">Enviando...</span>}
                        {form.imageUrl && (
                          <img src={form.imageUrl} alt="Banner" className="w-24 h-16 object-cover rounded-lg border" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">A imagem será exibida no banner do sorteio.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input name="isFree" type="checkbox" checked={form.isFree} onChange={handleFormChange} />
                      <label className="font-semibold">Sorteio Grátis?</label>
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

            <div>
              <h2 className="text-xl font-semibold mb-4">Configurações de Jogo</h2>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <Brain className="text-primary mr-3" size={24} />
                  <h2 className="text-xl font-bold text-gray-800">Palavras do Jogo</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      Gerencie as palavras do jogo "Descubra a Palavra"
                    </p>
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                    >
                      <Plus size={16} className="mr-2" />
                      Nova Palavra
                    </button>
                  </div>

                  {gameWords.length > 0 ? (
                    <div className="space-y-3">
                      {gameWords.map((word) => (
                        <div
                          key={word.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            word.is_active 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-lg text-gray-800">
                                  {word.word.toUpperCase()}
                                </span>
                                {word.is_active && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    ATIVA
                                  </span>
                                )}
                              </div>
                              {word.hint && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Dica:</strong> {word.hint}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {!word.is_active && (
                                <button
                                  onClick={() => handleActivateWord(word.id)}
                                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                                >
                                  Ativar
                                </button>
                              )}
                              <button
                                onClick={() => openEditModal(word)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteWord(word.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma palavra cadastrada ainda.</p>
                      <p className="text-sm">Adicione palavras para o jogo funcionar!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Controle de Acesso aos Jogos</h2>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <Gamepad2 className="text-primary mr-3" size={24} />
                  <h2 className="text-xl font-bold text-gray-800">Liberar/Bloquear Jogos</h2>
                </div>

                <div className="space-y-4">
                  <div className="mb-4">
                    <p className="text-gray-600">
                      Controle quais jogos os usuários podem acessar. Jogos bloqueados aparecerão com cadeado.
                    </p>
                  </div>

                  {gameSettingsLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Carregando configurações...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { id: 'word_guess', name: 'Descubra a Palavra', icon: Gamepad2, color: 'text-blue-600' },
                        { id: 'number_guess', name: 'Adivinhe o Número', icon: Hash, color: 'text-green-600' },
                        { id: 'memory_game', name: 'Jogo da Memória', icon: Brain, color: 'text-pink-600' },
                        { id: 'quiz_game', name: 'Quiz Conhecimentos', icon: HelpCircle, color: 'text-orange-600' },
                        { id: 'rock_paper_scissors', name: 'Pedra, Papel, Tesoura', icon: Scissors, color: 'text-indigo-600' },
                      ].map((game) => {
                        const Icon = game.icon;
                        const setting = gameSettings.find(s => s.game_name === game.id);
                        const isEnabled = setting?.is_enabled || false;
                        
                        return (
                          <div
                            key={game.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isEnabled 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-red-300 bg-red-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className={`${game.color} w-6 h-6`} />
                                <div>
                                  <span className="font-bold text-lg text-gray-800">
                                    {game.name}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {isEnabled ? (
                                      <>
                                        <Unlock className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-green-700 font-medium">
                                          Liberado para usuários
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-4 h-4 text-red-600" />
                                        <span className="text-sm text-red-700 font-medium">
                                          Bloqueado para usuários
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateGameSetting(game.id, !isEnabled)}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isEnabled
                                      ? 'bg-red-500 text-white hover:bg-red-600'
                                      : 'bg-green-500 text-white hover:bg-green-600'
                                  }`}
                                >
                                  {isEnabled ? 'Bloquear' : 'Liberar'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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

          {showWordModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {editingWord ? 'Editar Palavra' : 'Nova Palavra'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Palavra *
                    </label>
                    <input
                      type="text"
                      value={newWord.word}
                      onChange={(e) => setNewWord(prev => ({ ...prev, word: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Digite a palavra..."
                      maxLength={20}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dica (opcional)
                    </label>
                    <textarea
                      value={newWord.hint}
                      onChange={(e) => setNewWord(prev => ({ ...prev, hint: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Digite uma dica para ajudar os jogadores..."
                      rows={3}
                      maxLength={200}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowWordModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveWord}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                  >
                    {editingWord ? 'Atualizar' : 'Adicionar'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;