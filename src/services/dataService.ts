import { supabase, testSupabaseConnection } from '../lib/supabase';
import { Participant } from '../types';

// Reset system
export const resetSystem = async (): Promise<boolean> => {
  console.log('[resetSystem] Iniciando reset do sistema via função SQL...');
  try {
    const { error } = await supabase.rpc('reset_all_tables');
    if (error) {
      console.error('[resetSystem] Erro ao executar função reset_all_tables:', error);
      throw error;
    }
    localStorage.clear();
    console.log('[resetSystem] localStorage limpo. Reset concluído via função SQL.');
    return true;
  } catch (error) {
    console.error('[resetSystem] Erro ao resetar sistema via função SQL:', error);
    return false;
  }
};

// Participant management
export const getParticipants = async (): Promise<Participant[]> => {
  try {
    // First, test the connection
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      throw new Error(`Failed to connect to Supabase: ${connectionTest.error}`);
    }

    // If connection is good, proceed with the actual query
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('registration_date', { ascending: false });

    if (error) {
      console.error('Error fetching participants:', error);
      throw error;
    }

    if (!data) {
      console.log('No participants found, returning empty array');
      return [];
    }

    return data.map(p => ({
      id: p.id,
      name: p.name,
      whatsapp: p.whatsapp,
      number: p.number,
      registrationDate: p.registration_date
    }));
  } catch (error) {
    console.error('Unexpected error in getParticipants:', error);
    throw error; // Re-throw to allow proper error handling upstream
  }
};

export const saveParticipant = async (
  participant: Omit<Participant, 'id' | 'registrationDate'>
): Promise<boolean> => {
  try {
    // Impedir que o mesmo WhatsApp cadastre mais de um número
    const { data: existingByWhatsapp } = await supabase
      .from('participants')
      .select('id')
      .eq('whatsapp', participant.whatsapp);
    if (existingByWhatsapp && existingByWhatsapp.length > 0) {
      return false;
    }
    // Impedir duplicidade de número
    const { data: existing } = await supabase
      .from('participants')
      .select('id')
      .eq('number', participant.number);
    if (existing && existing.length > 0) {
      return false;
    }
    const { error } = await supabase
      .from('participants')
      .insert([{
        name: participant.name,
        whatsapp: participant.whatsapp,
        number: participant.number,
        registration_date: new Date().toISOString()
      }]);
    return !error;
  } catch (error) {
    console.error('Error saving participant:', error);
    return false;
  }
};

// Extra numbers management
export const generateExtraNumbers = async (requestId: string, quantity: number): Promise<number[]> => {
  try {
    // Get all taken numbers
    const { data: participants } = await supabase
      .from('participants')
      .select('number');
    
    const takenNumbers = new Set(participants?.map(p => p.number) || []);
    
    // Generate available numbers pool
    const availableNumbers: number[] = [];
    for (let i = 1; i <= 1000; i++) {
      if (!takenNumbers.has(i)) {
        availableNumbers.push(i);
      }
    }

    if (availableNumbers.length < quantity) {
      throw new Error('Não há números suficientes disponíveis');
    }

    // Randomly select numbers
    const selectedNumbers: number[] = [];
    for (let i = 0; i < quantity; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const number = availableNumbers.splice(randomIndex, 1)[0];
      selectedNumbers.push(number);
    }

    // Update the request with selected numbers and mark as completed
    const { error: updateError } = await supabase
      .from('solicitacoes')
      .update({
        numeros_escolhidos: selectedNumbers,
        status: 'concluido'
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Log the operation
    await logOperation({
      type: 'EXTRA_NUMBERS_GENERATED',
      request_id: requestId,
      numbers: selectedNumbers,
      timestamp: new Date().toISOString()
    });

    return selectedNumbers;
  } catch (error) {
    console.error('Error generating extra numbers:', error);
    throw error;
  }
};

// Operation logging
export const logOperation = async (logData: {
  type: string;
  request_id: string;
  numbers: number[];
  timestamp: string;
}): Promise<void> => {
  try {
    await supabase
      .from('operation_logs')
      .insert([logData]);
  } catch (error) {
    console.error('Error logging operation:', error);
  }
};

// Draw management
export const getDrawStatus = async () => {
  try {
    const { data, error } = await supabase
      .from('draws')
      .select(`
        *,
        winner:participants(*)
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching draw status:', error);
      return { isComplete: false, drawDate: null, winner: null };
    }

    if (!data) {
      return { isComplete: false, drawDate: null, winner: null };
    }

    return {
      isComplete: true,
      drawDate: data.created_at,
      winner: data.winner ? {
        id: data.winner.id,
        name: data.winner.name,
        whatsapp: data.winner.whatsapp,
        number: data.winner.number,
        registrationDate: data.winner.registration_date
      } : null
    };
  } catch (error) {
    console.error('Unexpected error in getDrawStatus:', error);
    return { isComplete: false, drawDate: null, winner: null };
  }
};

export const saveDrawStatus = async (drawData: {
  isComplete: boolean;
  drawDate: string;
  winner: Participant | null;
}): Promise<boolean> => {
  try {
    if (!drawData.winner) return false;

    const { error } = await supabase
      .from('draws')
      .insert([{
        winner_id: drawData.winner.id,
        created_at: drawData.drawDate
      }]);

    return !error;
  } catch (error) {
    console.error('Error saving draw status:', error);
    return false;
  }
};

// Export data as CSV
export const exportParticipantsAsCSV = async (): string => {
  const participants = await getParticipants();
  
  if (participants.length === 0) {
    return '';
  }
  
  const header = 'ID,Nome,WhatsApp,Número,Data de Registro\n';
  const rows = participants.map((p) => {
    const date = new Date(p.registrationDate).toLocaleDateString('pt-BR');
    return `${p.id},"${p.name}","${p.whatsapp}",${p.number},"${date}"`;
  }).join('\n');
  
  return header + rows;
};

// Dashboard stats
export const getDashboardStats = async () => {
  try {
    const participants = await getParticipants();
    // Participantes únicos por WhatsApp
    const uniqueWhatsapps = new Set(participants.map(p => p.whatsapp));
    return {
      totalParticipants: uniqueWhatsapps.size,
      reservedNumbers: participants.length,
      availableNumbers: 1000 - participants.length,
      reservationRate: (participants.length / 1000) * 100,
      isDrawComplete: (await getDrawStatus()).isComplete,
      winner: (await getDrawStatus()).winner,
      drawDate: (await getDrawStatus()).drawDate,
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      totalParticipants: 0,
      reservedNumbers: 0,
      availableNumbers: 1000,
      reservationRate: 0,
      isDrawComplete: false,
      winner: null,
      drawDate: null,
    };
  }
};

// DrawConfig management
import type { DrawConfig } from '../types';

export const getDrawConfig = async (): Promise<DrawConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('draw_config')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      value: data.value,
      drawDate: data.draw_date,
      imageUrl: data.image_url,
      isFree: data.is_free,
      callToAction: data.call_to_action,
      regulationUrl: data.regulation_url,
    };
  } catch (error) {
    console.error('Erro ao buscar configuração do sorteio:', error);
    return null;
  }
};

export const saveDrawConfig = async (config: Omit<DrawConfig, 'id'> & { id?: string }): Promise<boolean> => {
  try {
    let result;
    if (config.id) {
      result = await supabase
        .from('draw_config')
        .update({
          name: config.name,
          description: config.description,
          value: config.value,
          draw_date: config.drawDate,
          image_url: config.imageUrl,
          is_free: config.isFree,
          call_to_action: config.callToAction,
          regulation_url: config.regulationUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);
    } else {
      result = await supabase
        .from('draw_config')
        .insert({
          name: config.name,
          description: config.description,
          value: config.value,
          draw_date: config.drawDate,
          image_url: config.imageUrl,
          is_free: config.isFree,
          call_to_action: config.callToAction,
          regulation_url: config.regulationUrl,
          updated_at: new Date().toISOString(),
        });
    }
    if (result.error) throw result.error;
    return true;
  } catch (error) {
    console.error('Erro ao salvar configuração do sorteio:', error);
    return false;
  }
};