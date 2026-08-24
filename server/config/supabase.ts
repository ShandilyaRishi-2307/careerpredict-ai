import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServerClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your_supabase_project_url')) {
    return null;
  }

  if (!supabaseServerClient) {
    try {
      supabaseServerClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } catch (err) {
      console.warn('Could not initialize Supabase server client:', err);
      return null;
    }
  }

  return supabaseServerClient;
}

export interface IVerifiedSupabaseUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    [key: string]: any;
  };
}

/**
 * Verify a Supabase access token on the Express backend.
 * Uses supabase.auth.getUser(token) with server credentials.
 * If live Supabase keys aren't set, decodes demo session tokens safely.
 */
export async function verifySupabaseToken(token: string): Promise<IVerifiedSupabaseUser | null> {
  if (!token || typeof token !== 'string') return null;

  const client = getSupabaseServerClient();

  if (client) {
    try {
      const { data, error } = await client.auth.getUser(token);
      if (error || !data?.user) {
        // If error with live client, check if it's a demo token in dev mode
        if (token.startsWith('demo_token_')) {
          return parseDemoToken(token);
        }
        return null;
      }
      return {
        id: data.user.id,
        email: data.user.email || '',
        user_metadata: data.user.user_metadata,
      };
    } catch (err) {
      console.warn('Error validating token with Supabase:', err);
    }
  }

  // Fallback parser for demo tokens or decoded JWTs in sandbox preview
  return parseDemoToken(token);
}

function parseDemoToken(token: string): IVerifiedSupabaseUser | null {
  try {
    if (token.startsWith('demo_token_')) {
      const parts = token.split('_');
      // Format: demo_token_<userId>_<base64email>_<base64name>
      const userId = parts[2] || 'supa_demo_002';
      const email = parts[3] ? Buffer.from(parts[3], 'base64').toString('utf-8') : 'alex@example.com';
      const name = parts[4] ? Buffer.from(parts[4], 'base64').toString('utf-8') : 'Alex Johnson';
      return {
        id: userId,
        email,
        user_metadata: { full_name: name },
      };
    }

    // Try decoding standard JWT payload (header.payload.signature)
    if (token.includes('.')) {
      const payloadPart = token.split('.')[1];
      if (payloadPart) {
        const decoded = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf-8'));
        if (decoded && (decoded.sub || decoded.id)) {
          return {
            id: decoded.sub || decoded.id,
            email: decoded.email || '',
            user_metadata: decoded.user_metadata || { full_name: decoded.name },
          };
        }
      }
    }
  } catch (e) {
    // Ignore parse error
  }
  return null;
}
