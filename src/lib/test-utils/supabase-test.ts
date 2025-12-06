import { createClient } from '@supabase/supabase-js';

/**
 * Test Supabase client that bypasses RLS using service role key
 * This should only be used in tests
 */

// Use remote Supabase configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sbfpxgsgabkgbutzhgwm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZnB4Z3NnYWJrZ2J1dHpoZ3dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4ODQ4MywiZXhwIjoyMDc3NzY0NDgzfQ.FGeTitHzEIeHKkSkvfvincnoRRHFTwYLb156uoPXP9I';

// Use service role key to bypass RLS in tests
export const supabaseTest = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});
