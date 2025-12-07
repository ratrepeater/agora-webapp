#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file from project root
const envPath = join(__dirname, '..', '.env');
let envVars = {};

try {
	const envContent = readFileSync(envPath, 'utf-8');
	envContent.split('\n').forEach(line => {
		const trimmed = line.trim();
		if (trimmed && !trimmed.startsWith('#')) {
			const [key, ...valueParts] = trimmed.split('=');
			if (key && valueParts.length > 0) {
				envVars[key.trim()] = valueParts.join('=').trim();
			}
		}
	});
} catch (error) {
	console.error('Error reading .env file:', error.message);
	console.error('Make sure .env file exists in the project root');
	process.exit(1);
}

// Get Supabase credentials from environment
const supabaseUrl = envVars.PUBLIC_SUPABASE_URL || envVars.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('Missing Supabase credentials in .env file');
	console.error('Required: PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
	process.exit(1);
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
export { supabaseUrl, supabaseKey };
