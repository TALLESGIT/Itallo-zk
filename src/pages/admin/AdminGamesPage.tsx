import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Brain, Plus, Edit, Trash2, Gamepad2, Hash, HelpCircle, Search, Lock, Unlock, AlertTriangle, X, BookOpen, Star, Smile, Zap } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { useGameSettings } from '../../hooks/useGameSettings';
import { getQuizQuestions, addQuizQuestion, updateQuizQuestion, deleteQuizQuestion } from '../../services/dataService';
import type { QuizQuestion } from '../../types';
import { getHangmanWords, addHangmanWord, updateHangmanWord, deleteHangmanWord, activateHangmanWord } from '../../services/dataService';
import type { HangmanWord } from '../../types';

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
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const gameTabs = [
    { key: 'memory_game', label: 'Jogo da Memória', icon: <Star className="w-5 h-5" /> },
    { key: 'quiz_game', label: 'Quiz de Conhecimentos', icon: <HelpCircle className="w-5 h-5" /> },
    { key: 'hangman_game', label: 'Jogo da Forca', icon: <Smile className="w-5 h-5" /> },
    { key: 'word_guess', label: 'Descubra a Palavra', icon: <Brain className="w-5 h-5" /> },
    { key: 'number_guess', label: 'Adivinhe o Número', icon: <Zap className="w-5 h-5" /> },
    { key: 'word_search', label: 'Caça-palavras', icon: <Search className="w-5 h-5" /> },
    { key: 'acesso', label: 'Controle de Acesso', icon: <Lock className="w-5 h-5" /> },
  ];
  const [activeTab, setActiveTab] = useState(gameTabs[0].key);

  // === Number Guess Config ===
  const [currentSecret, setCurrentSecret] = useState<number | null>(null);
  const [secretInput, setSecretInput] = useState<string>('');
  const [savingSecret, setSavingSecret] = useState(false);

  const [accessLoading, setAccessLoading] = useState<string | null>(null);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizQuestion | null>(null);
  const [quizForm, setQuizForm] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    category: '',
    difficulty: '',
    is_active: true,
  });
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizDeleteId, setQuizDeleteId] = useState<string | null>(null);
  const [quizDeleteLoading, setQuizDeleteLoading] = useState(false);

  const [hangmanWords, setHangmanWords] = useState<HangmanWord[]>([]);
  const [showHangmanModal, setShowHangmanModal] = useState(false);
  const [editingHangman, setEditingHangman] = useState<HangmanWord | null>(null);
  const [hangmanForm, setHangmanForm] = useState({ word: '', hint: '', category: 'geral' });
  const [hangmanLoading, setHangmanLoading] = useState(false);
  const [hangmanDeleteId, setHangmanDeleteId] = useState<number | null>(null);
  const [hangmanDeleteLoading, setHangmanDeleteLoading] = useState(false);

  const [wordGuessWords, setWordGuessWords] = useState<HangmanWord[]>([]);
  const [showWordGuessModal, setShowWordGuessModal] = useState(false);
  const [editingWordGuess, setEditingWordGuess] = useState<HangmanWord | null>(null);
  const [wordGuessForm, setWordGuessForm] = useState({ word: '', hint: '', category: 'geral' });
  const [wordGuessLoading, setWordGuessLoading] = useState(false);
  const [wordGuessDeleteId, setWordGuessDeleteId] = useState<number | null>(null);
  const [wordGuessDeleteLoading, setWordGuessDeleteLoading] = useState(false);

  const [showSecretModal, setShowSecretModal] = useState(false);

  useEffect(() => {
    fetchGameWords();
    fetchWordSearchWords();
    fetchSecretNumber();
    fetchQuizQuestions();
    fetchHangmanWords();
    fetchWordGuessWords();
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

  const fetchSecretNumber = async () => {
    const { data, error } = await supabase
      .from('number_guess_config')
      .select('id, secret')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    if (!error && data) {
      setCurrentSecret(data.secret);
      setSecretInput(String(data.secret));
    }
  };

  const fetchQuizQuestions = async () => {
    setQuizLoading(true);
    try {
      const data = await getQuizQuestions();
      setQuizQuestions(data);
    } catch (err) {
      toast.error('Erro ao carregar perguntas do Quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  const fetchHangmanWords = async () => {
    setHangmanLoading(true);
    try {
      const data = await getHangmanWords();
      setHangmanWords(data);
    } catch (err) {
      toast.error('Erro ao carregar palavras da Forca.');
    } finally {
      setHangmanLoading(false);
    }
  };

  const fetchWordGuessWords = async () => {
    setWordGuessLoading(true);
    try {
      const data = await getHangmanWords();
      setWordGuessWords((data || []).filter(w => !!w.hint));
    } catch (err) {
      toast.error('Erro ao carregar palavras do Descubra a Palavra.');
    } finally {
      setWordGuessLoading(false);
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
  const handleSaveNewSearchWord = async () => {
    if (!newSearchWord.word.trim()) {
      toast.error('A palavra é obrigatória!');
      return;
    }
    try {
      const { error } = await supabase
        .from('word_search_words')
        .insert({
          word: newSearchWord.word.trim(),
          category: newSearchWord.category.trim() || null,
          is_active: true,
        });
      if (error) throw error;
      toast.success('Palavra adicionada com sucesso!');
      setNewSearchWord({ word: '', category: 'geral' });
      setShowSearchWordModal(false);
      fetchWordSearchWords();
    } catch (error) {
      toast.error('Erro ao adicionar palavra.');
    }
  };

  const handleSaveSearchWord = async () => {
    if (!editingSearchWord.word.trim()) {
      toast.error('A palavra é obrigatória!');
      return;
    }
    try {
      const { error } = await supabase
        .from('word_search_words')
        .update({
          word: editingSearchWord.word.trim(),
          category: editingSearchWord.category.trim() || null,
        })
        .eq('id', editingSearchWord.id);
      if (error) throw error;
      toast.success('Palavra atualizada com sucesso!');
      setEditingSearchWord(null);
      setShowSearchWordModal(false);
      fetchWordSearchWords();
    } catch (error) {
      toast.error('Erro ao atualizar palavra.');
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

  const wipeWinners = async () => {
    setIsWiping(true);
    try {
      const { error } = await supabase.from('game_winners').delete().neq('id', 0);
      if (error) throw error;
      toast.success('Hall da Fama limpo com sucesso!');
      setShowWinnersModal(false);
    } catch (err) {
      console.error('Erro ao limpar winners:', err);
      toast.error('Erro ao limpar o Hall da Fama.');
    } finally {
      setIsWiping(false);
    }
  };

  const saveSecretNumber = async () => {
    const secret = parseInt(secretInput);
    if (isNaN(secret) || secret < 1 || secret > 100) {
      toast.error('Digite um número entre 1 e 100');
      return;
    }
    setSavingSecret(true);
    try {
      if (currentSecret === null) {
        // insert
        const { error } = await supabase.from('number_guess_config').insert({ secret });
        if (error) throw error;
      } else {
        const { data: existing } = await supabase
          .from('number_guess_config')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        if (existing) {
          const { error } = await supabase
            .from('number_guess_config')
            .update({ secret, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
        }
      }
      toast.success('Número secreto atualizado!');
      setCurrentSecret(secret);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar número');
    } finally {
      setSavingSecret(false);
    }
  };

  const openQuizModal = (question?: QuizQuestion) => {
    if (question) {
      setEditingQuiz(question);
      setQuizForm({
        question_text: question.question_text,
        options: question.options.slice(0, 4),
        correct_answer: question.correct_answer,
        category: question.category || '',
        difficulty: question.difficulty || '',
        is_active: question.is_active,
      });
    } else {
      setEditingQuiz(null);
      setQuizForm({
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        category: '',
        difficulty: '',
        is_active: true,
      });
    }
    setShowQuizModal(true);
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
    setEditingQuiz(null);
  };

  const handleQuizFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, idx?: number) => {
    if (typeof idx === 'number') {
      const newOptions = [...quizForm.options];
      newOptions[idx] = e.target.value;
      setQuizForm({ ...quizForm, options: newOptions });
    } else {
      setQuizForm({ ...quizForm, [e.target.name]: e.target.value });
    }
  };

  const handleSaveQuizQuestion = async () => {
    if (!quizForm.question_text.trim() || quizForm.options.some(opt => !opt.trim()) || quizForm.correct_answer === '') {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }
    setQuizLoading(true);
    try {
      if (editingQuiz) {
        await updateQuizQuestion(editingQuiz.id, {
          ...quizForm,
          options: quizForm.options,
        });
        toast.success('Pergunta atualizada com sucesso!');
      } else {
        await addQuizQuestion({
          ...quizForm,
          options: quizForm.options,
        });
        toast.success('Pergunta adicionada com sucesso!');
      }
      closeQuizModal();
      fetchQuizQuestions();
    } catch (err) {
      toast.error('Erro ao salvar pergunta.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleDeleteQuizQuestion = (id: string) => {
    setQuizDeleteId(id);
  };

  const confirmDeleteQuizQuestion = async () => {
    if (!quizDeleteId) return;
    setQuizDeleteLoading(true);
    try {
      await deleteQuizQuestion(quizDeleteId);
      toast.success('Pergunta excluída!');
      setQuizDeleteId(null);
      fetchQuizQuestions();
    } catch (err) {
      toast.error('Erro ao excluir pergunta.');
    } finally {
      setQuizDeleteLoading(false);
    }
  };

  const closeQuizDeleteModal = () => {
    setQuizDeleteId(null);
    setQuizDeleteLoading(false);
  };

  const openHangmanModal = (word?: HangmanWord) => {
    if (word) {
      setEditingHangman(word);
      setHangmanForm({ word: word.word, hint: word.hint || '', category: word.category || 'geral' });
    } else {
      setEditingHangman(null);
      setHangmanForm({ word: '', hint: '', category: 'geral' });
    }
    setShowHangmanModal(true);
  };

  const closeHangmanModal = () => {
    setShowHangmanModal(false);
    setEditingHangman(null);
  };

  const handleHangmanFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHangmanForm({ ...hangmanForm, [e.target.name]: e.target.value });
  };

  const handleSaveHangmanWord = async () => {
    if (!hangmanForm.word.trim()) {
      toast.error('A palavra é obrigatória!');
      return;
    }
    setHangmanLoading(true);
    try {
      if (editingHangman) {
        await updateHangmanWord(editingHangman.id, {
          word: hangmanForm.word.trim().toUpperCase(),
          hint: hangmanForm.hint.trim() || null,
          category: hangmanForm.category,
        });
        toast.success('Palavra atualizada com sucesso!');
      } else {
        await addHangmanWord({
          word: hangmanForm.word.trim().toUpperCase(),
          hint: hangmanForm.hint.trim() || null,
          category: hangmanForm.category,
          is_active: false,
        });
        toast.success('Palavra adicionada com sucesso!');
      }
      closeHangmanModal();
      fetchHangmanWords();
    } catch (err) {
      toast.error('Erro ao salvar palavra.');
    } finally {
      setHangmanLoading(false);
    }
  };

  const handleDeleteHangmanWord = (id: number) => {
    setHangmanDeleteId(id);
  };

  const confirmDeleteHangmanWord = async () => {
    if (!hangmanDeleteId) return;
    setHangmanDeleteLoading(true);
    try {
      await deleteHangmanWord(hangmanDeleteId);
      toast.success('Palavra excluída!');
      setHangmanDeleteId(null);
      fetchHangmanWords();
    } catch (err) {
      toast.error('Erro ao excluir palavra.');
    } finally {
      setHangmanDeleteLoading(false);
    }
  };

  const closeHangmanDeleteModal = () => {
    setHangmanDeleteId(null);
    setHangmanDeleteLoading(false);
  };

  const handleActivateHangmanWord = async (id: number) => {
    setHangmanLoading(true);
    try {
      await activateHangmanWord(id);
      toast.success('Palavra ativada!');
      fetchHangmanWords();
    } catch (err) {
      toast.error('Erro ao ativar palavra.');
    } finally {
      setHangmanLoading(false);
    }
  };

  const openWordGuessModal = (word?: HangmanWord) => {
    if (word) {
      setEditingWordGuess(word);
      setWordGuessForm({ word: word.word, hint: word.hint || '', category: word.category || 'geral' });
    } else {
      setEditingWordGuess(null);
      setWordGuessForm({ word: '', hint: '', category: 'geral' });
    }
    setShowWordGuessModal(true);
  };

  const closeWordGuessModal = () => {
    setShowWordGuessModal(false);
    setEditingWordGuess(null);
  };

  const handleWordGuessFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWordGuessForm({ ...wordGuessForm, [e.target.name]: e.target.value });
  };

  const handleSaveWordGuess = async () => {
    if (!wordGuessForm.word.trim() || !wordGuessForm.hint.trim()) {
      toast.error('Preencha a palavra e a dica!');
      return;
    }
    setWordGuessLoading(true);
    try {
      if (editingWordGuess) {
        await updateHangmanWord(editingWordGuess.id, {
          word: wordGuessForm.word.trim().toUpperCase(),
          hint: wordGuessForm.hint.trim(),
          category: wordGuessForm.category,
        });
        toast.success('Palavra atualizada com sucesso!');
      } else {
        await addHangmanWord({
          word: wordGuessForm.word.trim().toUpperCase(),
          hint: wordGuessForm.hint.trim(),
          category: wordGuessForm.category,
          is_active: false,
        });
        toast.success('Palavra adicionada com sucesso!');
      }
      closeWordGuessModal();
      fetchWordGuessWords();
    } catch (err) {
      toast.error('Erro ao salvar palavra.');
    } finally {
      setWordGuessLoading(false);
    }
  };

  const handleDeleteWordGuess = (id: number) => {
    setWordGuessDeleteId(id);
  };

  const confirmDeleteWordGuess = async () => {
    if (!wordGuessDeleteId) return;
    setWordGuessDeleteLoading(true);
    try {
      await deleteHangmanWord(wordGuessDeleteId);
      toast.success('Palavra excluída!');
      setWordGuessDeleteId(null);
      fetchWordGuessWords();
    } catch (err) {
      toast.error('Erro ao excluir palavra.');
    } finally {
      setWordGuessDeleteLoading(false);
    }
  };

  const closeWordGuessDeleteModal = () => {
    setWordGuessDeleteId(null);
    setWordGuessDeleteLoading(false);
  };

  const handleActivateWordGuess = async (id: number) => {
    setWordGuessLoading(true);
    try {
      await activateHangmanWord(id);
      toast.success('Palavra ativada!');
      fetchWordGuessWords();
    } catch (err) {
      toast.error('Erro ao ativar palavra.');
    } finally {
      setWordGuessLoading(false);
    }
  };

  const handleDeleteSearchWord = async () => {
    if (!wordToDelete) return;
    try {
      const { error } = await supabase
        .from('word_search_words')
        .delete()
        .eq('id', wordToDelete.id);
      if (error) throw error;
      toast.success('Palavra excluída com sucesso!');
      setShowDeleteModal(false);
      setWordToDelete(null);
      fetchWordSearchWords();
    } catch (error) {
      toast.error('Erro ao excluir palavra.');
    }
  };

  return (
    <AdminLayout title="Brincadeiras">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Administração de Brincadeiras</h1>
        <div className="flex gap-4 mb-8 flex-wrap">
          {gameTabs.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors mb-2 ${activeTab === tab.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'quiz_game' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Perguntas do Quiz</h2>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                onClick={() => openQuizModal()}
              >
                + Nova Pergunta
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Pergunta</th>
                    <th className="px-4 py-2 text-left">Alternativas</th>
                    <th className="px-4 py-2 text-left">Correta</th>
                    <th className="px-4 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {quizLoading ? (
                    <tr><td colSpan={4} className="text-center py-4">Carregando...</td></tr>
                  ) : quizQuestions.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-4">Nenhuma pergunta cadastrada.</td></tr>
                  ) : quizQuestions.map((q) => (
                    <tr key={q.id}>
                      <td className="px-4 py-2">{q.question_text}</td>
                      <td className="px-4 py-2">{q.options.join(', ')}</td>
                      <td className="px-4 py-2">{q.options.find((opt, idx) => String(idx) === q.correct_answer) || q.correct_answer}</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-600 hover:underline mr-2" onClick={() => openQuizModal(q)}>Editar</button>
                        <button className="text-red-600 hover:underline" onClick={() => handleDeleteQuizQuestion(q.id)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Modal de cadastro/edição de pergunta */}
            {showQuizModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative animate-fadeIn">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={closeQuizModal}><X size={22} /></button>
                  <h3 className="text-lg font-bold mb-4">{editingQuiz ? 'Editar Pergunta' : 'Nova Pergunta'}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pergunta *</label>
                      <input
                        type="text"
                        name="question_text"
                        className="w-full border rounded px-3 py-2"
                        value={quizForm.question_text}
                        onChange={handleQuizFormChange}
                        disabled={quizLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Alternativas *</label>
                      {quizForm.options.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          className="w-full border rounded px-3 py-2 mb-1"
                          value={opt}
                          onChange={e => handleQuizFormChange(e, idx)}
                          placeholder={`Alternativa ${idx + 1}`}
                          disabled={quizLoading}
                        />
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Alternativa Correta *</label>
                      <select
                        name="correct_answer"
                        className="w-full border rounded px-3 py-2"
                        value={quizForm.correct_answer}
                        onChange={handleQuizFormChange}
                        disabled={quizLoading}
                      >
                        <option value="">Selecione</option>
                        {quizForm.options.map((opt, idx) => (
                          <option key={idx} value={String(idx)}>{opt || `Alternativa ${idx + 1}`}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Categoria</label>
                        <select
                          className="w-full border rounded px-3 py-2 appearance-none"
                          value={quizForm.category || 'geral'}
                          onChange={e => setQuizForm({ ...quizForm, category: e.target.value })}
                          disabled={quizLoading}
                        >
                          <option value="geral">Geral</option>
                          <option value="animais">Animais</option>
                          <option value="cores">Cores</option>
                          <option value="frutas">Frutas</option>
                          <option value="esportes">Esportes</option>
                          <option value="paises">Países</option>
                          <option value="objetos">Objetos</option>
                          <option value="profissoes">Profissões</option>
                          <option value="alimentos">Alimentos</option>
                          <option value="outros">Outros</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Dificuldade</label>
                        <select
                          className="w-full border rounded px-3 py-2 appearance-none"
                          value={quizForm.difficulty || 'facil'}
                          onChange={e => setQuizForm({ ...quizForm, difficulty: e.target.value })}
                          disabled={quizLoading}
                        >
                          <option value="facil">Fácil</option>
                          <option value="medio">Médio</option>
                          <option value="dificil">Difícil</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 gap-2">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={closeQuizModal} disabled={quizLoading}>Cancelar</button>
                    <button className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700" onClick={handleSaveQuizQuestion} disabled={quizLoading}>{editingQuiz ? 'Salvar' : 'Cadastrar'}</button>
                  </div>
                </div>
              </div>
            )}
            {/* Modal de confirmação de exclusão do Quiz */}
            {quizDeleteId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <AlertCircle className="text-red-500 mr-2" size={32} />
                    <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
                  </div>
                  <p className="mb-6 text-gray-700">Tem certeza que deseja <span className="text-red-600 font-semibold">excluir</span> esta pergunta do Quiz? Esta ação não pode ser desfeita.</p>
                  <div className="flex justify-end gap-2">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={closeQuizDeleteModal} disabled={quizDeleteLoading}>Cancelar</button>
                    <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700" onClick={confirmDeleteQuizQuestion} disabled={quizDeleteLoading}>{quizDeleteLoading ? 'Excluindo...' : 'Excluir'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hangman_game' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Palavras da Forca</h2>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                onClick={() => openHangmanModal()}
              >
                + Nova Palavra
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Palavra</th>
                    <th className="px-4 py-2 text-left">Dica</th>
                    <th className="px-4 py-2 text-left">Ativa?</th>
                    <th className="px-4 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {hangmanLoading ? (
                    <tr><td colSpan={4} className="text-center py-4">Carregando...</td></tr>
                  ) : hangmanWords.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-4">Nenhuma palavra cadastrada.</td></tr>
                  ) : hangmanWords.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-2">{w.word}</td>
                      <td className="px-4 py-2">{w.hint}</td>
                      <td className="px-4 py-2">{w.is_active ? 'Sim' : 'Não'}</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-600 hover:underline mr-2" onClick={() => openHangmanModal(w)}>Editar</button>
                        <button className="text-red-600 hover:underline mr-2" onClick={() => handleDeleteHangmanWord(w.id)}>Excluir</button>
                        <button className="text-green-600 hover:underline" onClick={() => handleActivateHangmanWord(w.id)} disabled={w.is_active}>Ativar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Modal de cadastro/edição de palavra */}
            {showHangmanModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative animate-fadeIn">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={closeHangmanModal}><X size={22} /></button>
                  <h3 className="text-lg font-bold mb-4">{editingHangman ? 'Editar Palavra' : 'Nova Palavra'}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Palavra *</label>
                      <input
                        type="text"
                        name="word"
                        className="w-full border rounded px-3 py-2"
                        value={hangmanForm.word}
                        onChange={handleHangmanFormChange}
                        disabled={hangmanLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Dica</label>
                      <input
                        type="text"
                        name="hint"
                        className="w-full border rounded px-3 py-2"
                        value={hangmanForm.hint}
                        onChange={handleHangmanFormChange}
                        disabled={hangmanLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Categoria</label>
                      <select
                        className="w-full border rounded px-3 py-2 appearance-none"
                        value={editingHangman ? editingHangman.category : hangmanForm.category || 'geral'}
                        onChange={e => editingHangman ? setEditingHangman({ ...editingHangman, category: e.target.value }) : setHangmanForm({ ...hangmanForm, category: e.target.value })}
                        disabled={hangmanLoading}
                      >
                        <option value="geral">Geral</option>
                        <option value="animais">Animais</option>
                        <option value="cores">Cores</option>
                        <option value="frutas">Frutas</option>
                        <option value="esportes">Esportes</option>
                        <option value="paises">Países</option>
                        <option value="objetos">Objetos</option>
                        <option value="profissoes">Profissões</option>
                        <option value="alimentos">Alimentos</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 gap-2">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={closeHangmanModal} disabled={hangmanLoading}>Cancelar</button>
                    <button className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700" onClick={handleSaveHangmanWord} disabled={hangmanLoading}>{editingHangman ? 'Salvar' : 'Cadastrar'}</button>
                  </div>
                </div>
              </div>
            )}
            {/* Modal de confirmação de exclusão */}
            {hangmanDeleteId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <AlertCircle className="text-red-500 mr-2" size={32} />
                    <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
                  </div>
                  <p className="mb-6 text-gray-700">Tem certeza que deseja <span className="text-red-600 font-semibold">excluir</span> esta palavra da Forca? Esta ação não pode ser desfeita.</p>
                  <div className="flex justify-end gap-2">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={closeHangmanDeleteModal} disabled={hangmanDeleteLoading}>Cancelar</button>
                    <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700" onClick={confirmDeleteHangmanWord} disabled={hangmanDeleteLoading}>{hangmanDeleteLoading ? 'Excluindo...' : 'Excluir'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'word_guess' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Descubra a Palavra</h2>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                onClick={() => openWordGuessModal()}
              >
                + Nova Palavra
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Palavra</th>
                    <th className="px-4 py-2 text-left">Dica</th>
                    <th className="px-4 py-2 text-left">Ativa?</th>
                    <th className="px-4 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {wordGuessLoading ? (
                    <tr><td colSpan={4} className="text-center py-4">Carregando...</td></tr>
                  ) : wordGuessWords.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-4">Nenhuma palavra cadastrada.</td></tr>
                  ) : wordGuessWords.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-2">{w.word}</td>
                      <td className="px-4 py-2">{w.hint}</td>
                      <td className="px-4 py-2">{w.is_active ? 'Sim' : 'Não'}</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-600 hover:underline mr-2" onClick={() => openWordGuessModal(w)}>Editar</button>
                        <button className="text-red-600 hover:underline mr-2" onClick={() => handleDeleteWordGuess(w.id)}>Excluir</button>
                        <button className="text-green-600 hover:underline" onClick={() => handleActivateWordGuess(w.id)} disabled={w.is_active}>Ativar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Modal de cadastro/edição de palavra */}
            {showWordGuessModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative animate-fadeIn">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={closeWordGuessModal}><X size={22} /></button>
                  <h3 className="text-lg font-bold mb-4">{editingWordGuess ? 'Editar Palavra' : 'Nova Palavra'}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Palavra *</label>
                      <input
                        type="text"
                        name="word"
                        className="w-full border rounded px-3 py-2"
                        value={wordGuessForm.word}
                        onChange={handleWordGuessFormChange}
                        disabled={wordGuessLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Dica *</label>
                      <input
                        type="text"
                        name="hint"
                        className="w-full border rounded px-3 py-2"
                        value={wordGuessForm.hint}
                        onChange={handleWordGuessFormChange}
                        disabled={wordGuessLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Categoria</label>
                      <select
                        className="w-full border rounded px-3 py-2 appearance-none"
                        value={editingWordGuess ? editingWordGuess.category : wordGuessForm.category || 'geral'}
                        onChange={e => editingWordGuess ? setEditingWordGuess({ ...editingWordGuess, category: e.target.value }) : setWordGuessForm({ ...wordGuessForm, category: e.target.value })}
                        disabled={wordGuessLoading}
                      >
                        <option value="geral">Geral</option>
                        <option value="animais">Animais</option>
                        <option value="cores">Cores</option>
                        <option value="frutas">Frutas</option>
                        <option value="esportes">Esportes</option>
                        <option value="paises">Países</option>
                        <option value="objetos">Objetos</option>
                        <option value="profissoes">Profissões</option>
                        <option value="alimentos">Alimentos</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 gap-2">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={closeWordGuessModal} disabled={wordGuessLoading}>Cancelar</button>
                    <button className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700" onClick={handleSaveWordGuess} disabled={wordGuessLoading}>{editingWordGuess ? 'Salvar' : 'Cadastrar'}</button>
                  </div>
                </div>
              </div>
            )}
            {/* Modal de confirmação de exclusão */}
            {wordGuessDeleteId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <AlertCircle className="text-red-500 mr-2" size={32} />
                    <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
                  </div>
                  <p className="mb-6 text-gray-700">Tem certeza que deseja <span className="text-red-600 font-semibold">excluir</span> esta palavra? Esta ação não pode ser desfeita.</p>
                  <div className="flex justify-end gap-2">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={closeWordGuessDeleteModal} disabled={wordGuessDeleteLoading}>Cancelar</button>
                    <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700" onClick={confirmDeleteWordGuess} disabled={wordGuessDeleteLoading}>{wordGuessDeleteLoading ? 'Excluindo...' : 'Excluir'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'number_guess' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Adivinhe o Número</h2>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                onClick={() => setShowSecretModal(true)}
              >
                + Novo Número
              </button>
            </div>
            <p className="text-gray-600 mb-4">Configure o número secreto do jogo aqui.</p>
            <div className="mb-4">
              <span className="font-medium">Número atual: </span>
              <span className="text-lg font-bold text-primary">{currentSecret !== null ? currentSecret : 'Nenhum cadastrado'}</span>
            </div>
            {/* Modal de cadastro/edição do número secreto */}
            {showSecretModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative animate-fadeIn">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowSecretModal(false)}><X size={22} /></button>
                  <h3 className="text-lg font-bold mb-4">Novo Número Secreto</h3>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2 mb-4"
                    value={secretInput}
                    onChange={e => setSecretInput(e.target.value)}
                    min={1}
                    max={9999}
                    disabled={savingSecret}
                  />
                  <div className="flex justify-end gap-2">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={() => setShowSecretModal(false)} disabled={savingSecret}>Cancelar</button>
                    <button className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700" onClick={saveSecretNumber} disabled={savingSecret || !secretInput}>Salvar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'word_search' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Caça-palavras</h2>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                onClick={() => setShowSearchWordModal(true)}
              >
                + Nova Palavra
              </button>
            </div>
            <p className="text-gray-600 mb-4">Gerencie as palavras do Caça-palavras aqui.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Palavra</th>
                    <th className="px-4 py-2 text-left">Categoria</th>
                    <th className="px-4 py-2 text-left">Ativa?</th>
                    <th className="px-4 py-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {wordSearchWords.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-4">Nenhuma palavra cadastrada.</td></tr>
                  ) : wordSearchWords.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-2">{w.word}</td>
                      <td className="px-4 py-2">{w.category || '-'}</td>
                      <td className="px-4 py-2">{w.is_active ? 'Sim' : 'Não'}</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-600 hover:underline mr-2" onClick={() => { setEditingSearchWord(w); setShowSearchWordModal(true); }}>Editar</button>
                        <button className="text-red-600 hover:underline" onClick={() => { setWordToDelete(w); setShowDeleteModal(true); }}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Modal de cadastro/edição de palavra */}
            {showSearchWordModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative animate-fadeIn">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => { setShowSearchWordModal(false); setEditingSearchWord(null); }}><X size={22} /></button>
                  <h3 className="text-lg font-bold mb-4">{editingSearchWord ? 'Editar Palavra' : 'Nova Palavra'}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Palavra *</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={editingSearchWord ? editingSearchWord.word : newSearchWord.word}
                        onChange={e => editingSearchWord ? setEditingSearchWord({ ...editingSearchWord, word: e.target.value }) : setNewSearchWord({ ...newSearchWord, word: e.target.value })}
                        disabled={false}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Categoria</label>
                      <select
                        className="w-full border rounded px-3 py-2 appearance-none"
                        value={editingSearchWord ? editingSearchWord.category : newSearchWord.category}
                        onChange={e => editingSearchWord ? setEditingSearchWord({ ...editingSearchWord, category: e.target.value }) : setNewSearchWord({ ...newSearchWord, category: e.target.value })}
                        disabled={false}
                      >
                        <option value="geral">Geral</option>
                        <option value="animais">Animais</option>
                        <option value="cores">Cores</option>
                        <option value="frutas">Frutas</option>
                        <option value="esportes">Esportes</option>
                        <option value="paises">Países</option>
                        <option value="objetos">Objetos</option>
                        <option value="profissoes">Profissões</option>
                        <option value="alimentos">Alimentos</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 gap-2">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={() => { setShowSearchWordModal(false); setEditingSearchWord(null); }}>Cancelar</button>
                    <button className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700" onClick={editingSearchWord ? handleSaveSearchWord : handleSaveNewSearchWord}>{editingSearchWord ? 'Salvar' : 'Cadastrar'}</button>
                  </div>
                </div>
              </div>
            )}
            {/* Modal de confirmação de exclusão */}
            {showDeleteModal && wordToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <AlertCircle className="text-red-500 mr-2" size={32} />
                    <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
                  </div>
                  <p className="mb-6 text-gray-700">Tem certeza que deseja <span className="text-red-600 font-semibold">excluir</span> esta palavra do Caça-palavras? Esta ação não pode ser desfeita.</p>
                  <div className="flex justify-end gap-2">
                    <button className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={() => { setShowDeleteModal(false); setWordToDelete(null); }}>Cancelar</button>
                    <button className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700" onClick={handleDeleteSearchWord}>{false ? 'Excluindo...' : 'Excluir'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'acesso' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Controle de Acesso aos Jogos</h2>
            <p className="text-gray-600 mb-4">Libere ou bloqueie o acesso dos usuários a cada jogo.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {gameTabs.filter(tab => tab.key !== 'acesso').map(tab => {
                const enabled = gameSettings.find(s => s.game_name === tab.key)?.is_enabled ?? false;
                return (
                  <div key={tab.key} className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-6 border h-40 shadow-sm">
                    <span className="font-medium text-gray-800 text-lg mb-2 text-center">{tab.label}</span>
                    <div className="flex flex-col items-center gap-2 mt-2">
                      <span className={`flex items-center gap-1 text-sm font-semibold ${enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {enabled ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                        {enabled ? 'Liberado' : 'Bloqueado'}
                      </span>
                      {/* Toggle Switch */}
                      <button
                        onClick={async () => {
                          setAccessLoading(tab.key);
                          await updateGameSetting(tab.key, !enabled);
                          setAccessLoading(null);
                        }}
                        className={`relative w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                        aria-label={enabled ? 'Bloquear' : 'Liberar'}
                        disabled={accessLoading === tab.key}
                      >
                        <span
                          className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-6' : ''}`}
                        />
                        {accessLoading === tab.key && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <svg className="animate-spin w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminGamesPage; 