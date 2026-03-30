import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Falta SUPABASE_URL o SUPABASE_KEY en .env');
}

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseKey || 'dummy');
