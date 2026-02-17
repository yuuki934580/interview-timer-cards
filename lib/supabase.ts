import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Supabase環境変数が未設定です。\n' +
    'NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください。'
  );
}

// ブラウザ/サーバー共用（anon key）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サーバーサイドのみ（service_role key）
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('❌ getSupabaseAdmin はサーバーサイドのみで使用できます');
  }
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      '❌ SUPABASE_SERVICE_ROLE_KEY が未設定です。\n' +
      '.env.local または Vercel環境変数に設定してください。'
    );
  }
  return createClient(supabaseUrl!, serviceRoleKey);
};
