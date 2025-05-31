import { testSupabaseConnection } from './lib/supabase';

async function testConnection() {
  const result = await testSupabaseConnection();
  if (result.success) {
    console.log('Conexão com Supabase bem-sucedida!');
  } else {
    console.error('Erro na conexão com Supabase:', result.error);
  }
}

testConnection();
