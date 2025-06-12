import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Brain, Plus, Edit, Trash2, Gamepad2, Hash, HelpCircle, Search, Lock, Unlock, AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { useGameSettings } from '../../hooks/useGameSettings';

const AdminGamesPage: React.FC = () => {
  const { gameSettings, updateGameSetting, loading: gameSettingsLoading } = useGameSettings();
  const [gameWords, setGameWords] = useState<any[]>([]);
  const [wordSearchWords, setWordSearchWords] = useState<any[]>([]);
  const [newWord, setNewWord] = useState({ word: '', hint: '' });
  const [newSearchWord, setNewSearchWord] = useState({ word: '', category: 'geral' });
  const [editingWord, setEditingWord] = useState<any>(null);
  const [editingSearchWord, setEditingSearchWord] = useState<any>(null);
  const [showWordModal, setShowWordModal] = useState(false);
  const [showSearchWordModal, setShowSearchWordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGameWords();
    fetchWordSearchWords();
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

  const fetchWordSearchWords = async () => {
    try {
      const { data, error } = await supabase
        .from('word_search_words')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWordSearchWords(data || []);
    } catch (error) {
      console.error('Erro ao buscar palavras do caça palavras:', error);
      toast.error('Erro ao carregar palavras do caça palavras.');
    }
  };

  const handleSaveWord = async () => {
    if (!newWord.word.trim()) {
      toast.error('A palavra é obrigatória!');
      return;
    }

    try {
      if (editingWord) {
        const { error } = await supabase
          .from('game_words')
          .update({
            word: newWord.word.trim().toLowerCase(),
            hint: newWord.hint.trim() || null,
          })
          .eq('id', editingWord.id);

        if (error) throw error;
        toast.success('Palavra atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('game_words')
          .insert({
            word: newWord.word.trim().toLowerCase(),
            hint: newWord.hint.trim() || null,
            is_active: false,
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
      // Primeiro, desativar todas as palavras
      await supabase
        .from('game_words')
        .update({ is_active: false })
        .neq('id', 0);

      // Depois, ativar apenas a palavra selecionada
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

  const openDeleteModal = (word: any) => {
    setWordToDelete(word);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setWordToDelete(null);
    setShowDeleteModal(false);
    setIsDeleting(false);
  };

  const confirmDeleteWord = async () => {
    if (!wordToDelete) {
      console.log('Nenhuma palavra selecionada para exclusão');
      return;
    }

    console.log('=== INICIANDO EXCLUSÃO ===');
    console.log('Palavra a ser excluída:', JSON.stringify(wordToDelete, null, 2));

    setIsDeleting(true);
    try {
      // Verifica se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuário autenticado:', user?.email, 'Role:', user?.user_metadata?.role);
      
      // Verifica se o usuário tem permissão de admin
      if (!user?.user_metadata?.role || user.user_metadata.role !== 'admin') {
        console.error('Usuário sem permissão de admin');
        throw new Error('Você não tem permissão para excluir palavras. Faça logout e login novamente se você é admin.');
      }
      
      // Determina qual tabela usar
      let tableName: string;
      
      // Verifica se tem campo 'hint' (game_words) ou 'category' (word_search_words)
      if (wordToDelete.hasOwnProperty('hint')) {
        tableName = 'game_words';
        console.log('Detectado como palavra do jogo "Descubra a Palavra"');
      } else if (wordToDelete.hasOwnProperty('category')) {
        tableName = 'word_search_words';
        console.log('Detectado como palavra do "Caça Palavras"');
      } else {
        console.error('Não foi possível determinar o tipo da palavra:', Object.keys(wordToDelete));
        throw new Error('Tipo de palavra não identificado');
      }
      
      console.log(`Tentando excluir da tabela: ${tableName}, ID: ${wordToDelete.id}`);
      
      // Executa a exclusão
      const { error, data } = await supabase
        .from(tableName)
        .delete()
        .eq('id', wordToDelete.id)
        .select();

      console.log('Resposta da exclusão:', { error, data });

      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('Nenhum registro foi excluído. Pode não existir ou não ter permissão.');
        throw new Error('Nenhum registro foi excluído');
      }
      
      console.log('Exclusão bem-sucedida:', data);
      toast.success('Palavra excluída com sucesso!');
      
      // Atualiza a lista apropriada
      if (tableName === 'game_words') {
        console.log('Atualizando lista de palavras do jogo');
        fetchGameWords();
      } else {
        console.log('Atualizando lista de palavras do caça palavras');
        fetchWordSearchWords();
      }
      
      closeDeleteModal();
    } catch (error) {
      console.error('=== ERRO NA EXCLUSÃO ===');
      console.error('Erro completo:', error);
      toast.error(`Erro ao excluir palavra: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
      console.log('=== FIM DA EXCLUSÃO ===');
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

  // Funções para Caça Palavras
  const handleSaveSearchWord = async () => {
    if (!newSearchWord.word.trim()) {
      toast.error('A palavra é obrigatória!');
      return;
    }

    try {
      if (editingSearchWord) {
        const { error } = await supabase
          .from('word_search_words')
          .update({
            word: newSearchWord.word.trim().toUpperCase(),
            category: newSearchWord.category.trim() || 'geral',
          })
          .eq('id', editingSearchWord.id);

        if (error) throw error;
        toast.success('Palavra do caça palavras atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('word_search_words')
          .insert({
            word: newSearchWord.word.trim().toUpperCase(),
            category: newSearchWord.category.trim() || 'geral',
            is_active: true,
          });

        if (error) throw error;
        toast.success('Palavra do caça palavras adicionada com sucesso!');
      }

      setNewSearchWord({ word: '', category: 'geral' });
      setEditingSearchWord(null);
      setShowSearchWordModal(false);
      fetchWordSearchWords();
    } catch (error) {
      console.error('Erro ao salvar palavra do caça palavras:', error);
      toast.error('Erro ao salvar palavra do caça palavras.');
    }
  };

  const handleToggleSearchWord = async (wordId: number, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('word_search_words')
        .update({ is_active: !isActive })
        .eq('id', wordId);

      if (error) throw error;
      toast.success(`Palavra ${!isActive ? 'ativada' : 'desativada'} com sucesso!`);
      fetchWordSearchWords();
    } catch (error) {
      console.error('Erro ao alterar status da palavra:', error);
      toast.error('Erro ao alterar status da palavra.');
    }
  };

  const openEditSearchWordModal = (word: any) => {
    setEditingSearchWord(word);
    setNewSearchWord({ word: word.word, category: word.category || 'geral' });
    setShowSearchWordModal(true);
  };

  const openAddSearchWordModal = () => {
    setEditingSearchWord(null);
    setNewSearchWord({ word: '', category: 'geral' });
    setShowSearchWordModal(true);
  };

  const refreshUserSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      console.log('Sessão atualizada:', data.user?.user_metadata);
      toast.success('Sessão atualizada! Tente excluir novamente.');
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      toast.error('Erro ao atualizar sessão. Faça logout e login novamente.');
    }
  };

  return (
    <AdminLayout title="Brincadeiras">
      <div className="flex justify-center">
        <div className="w-full max-w-4xl">
          {/* Botão de Debug para Atualizar Sessão */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Debug: Problemas com Exclusão?</h3>
                <p className="text-xs text-yellow-700 mt-1">
                  Se não conseguir excluir palavras, clique para atualizar suas permissões.
                </p>
              </div>
              <button
                onClick={refreshUserSession}
                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
              >
                Atualizar Sessão
              </button>
            </div>
          </div>
          
          <div className="space-y-8">
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
                                onClick={() => openDeleteModal(word)}
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

            {/* Palavras do Caça Palavras */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Palavras do Caça Palavras</h2>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <Search className="text-purple-500 mr-3" size={24} />
                  <h2 className="text-xl font-bold text-gray-800">Gerenciar Palavras</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      Gerencie as palavras do jogo "Caça Palavras"
                    </p>
                    <button
                      onClick={openAddSearchWordModal}
                      className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      <Plus size={16} className="mr-2" />
                      Nova Palavra
                    </button>
                  </div>

                  {wordSearchWords.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {wordSearchWords.map((word) => (
                        <div
                          key={word.id}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            word.is_active 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-800">
                                  {word.word}
                                </span>
                                {word.is_active && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    ATIVA
                                  </span>
                                )}
                              </div>
                              {word.category && (
                                <p className="text-xs text-gray-600 mt-1">
                                  <strong>Categoria:</strong> {word.category}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleSearchWord(word.id, word.is_active)}
                                className={`p-1 text-xs rounded transition-colors ${
                                  word.is_active 
                                    ? 'text-red-600 hover:bg-red-50' 
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                                title={word.is_active ? 'Desativar' : 'Ativar'}
                              >
                                {word.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                              </button>
                              <button
                                onClick={() => openEditSearchWordModal(word)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setWordToDelete(word);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search size={48} className="mx-auto mb-4 text-gray-300" />
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
                        { id: 'word_search', name: 'Caça Palavras', icon: Search, color: 'text-purple-600' },
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

          {/* Modal para Palavras do Caça Palavras */}
          {showSearchWordModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {editingSearchWord ? 'Editar Palavra' : 'Nova Palavra'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Palavra *
                    </label>
                    <input
                      type="text"
                      value={newSearchWord.word}
                      onChange={(e) => setNewSearchWord(prev => ({ ...prev, word: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Digite a palavra..."
                      maxLength={15}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={newSearchWord.category}
                      onChange={(e) => setNewSearchWord(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="geral">Geral</option>
                      <option value="programacao">Programação</option>
                      <option value="tecnologia">Tecnologia</option>
                      <option value="ciencia">Ciência</option>
                      <option value="esportes">Esportes</option>
                      <option value="animais">Animais</option>
                      <option value="cores">Cores</option>
                      <option value="comida">Comida</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveSearchWord}
                    className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    {editingSearchWord ? 'Atualizar' : 'Adicionar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSearchWordModal(false);
                      setEditingSearchWord(null);
                      setNewSearchWord({ word: '', category: 'geral' });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showDeleteModal && wordToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Confirmar Exclusão
                    </h3>
                  </div>
                  <button
                    onClick={closeDeleteModal}
                    className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
                    disabled={isDeleting}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-gray-700 text-lg mb-2">
                      Tem certeza que deseja excluir a palavra
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-red-500">
                      <span className="font-bold text-xl text-gray-800">
                        "{wordToDelete.word.toUpperCase()}"
                      </span>
                      {wordToDelete.hint && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Dica:</strong> {wordToDelete.hint}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">Atenção!</h4>
                        <p className="text-sm text-yellow-700">
                          Esta ação não pode ser desfeita. A palavra será permanentemente removida do sistema.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={closeDeleteModal}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      disabled={isDeleting}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDeleteWord}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Excluir Palavra
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminGamesPage; 