import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole } from '$lib/helpers/types';

export interface SignUpData {
	email: string;
	password: string;
	fullName: string;
	role: UserRole;
}

export interface SignInData {
	email: string;
	password: string;
}

export class AuthService {
	constructor(private supabase: SupabaseClient) {}

	/**
	 * Sign up a new user (buyer or seller)
	 */
	async signUp(data: SignUpData) {
		// Create the auth user
		const { data: authData, error: authError } = await this.supabase.auth.signUp({
			email: data.email,
			password: data.password,
			options: {
				data: {
					full_name: data.fullName,
					role: data.role
				}
			}
		});

		if (authError) {
			throw new Error(authError.message);
		}

		if (!authData.user) {
			throw new Error('Failed to create user');
		}

		// Create the profile record
		const { error: profileError } = await this.supabase.from('profiles').insert({
			id: authData.user.id,
			email: data.email,
			full_name: data.fullName,
			role: data.role
		});

		if (profileError) {
			throw new Error(`Failed to create profile: ${profileError.message}`);
		}

		return authData;
	}

	/**
	 * Sign in an existing user
	 */
	async signIn(data: SignInData) {
		const { data: authData, error } = await this.supabase.auth.signInWithPassword({
			email: data.email,
			password: data.password
		});

		if (error) {
			throw new Error(error.message);
		}

		return authData;
	}

	/**
	 * Sign out the current user
	 */
	async signOut() {
		const { error } = await this.supabase.auth.signOut();

		if (error) {
			throw new Error(error.message);
		}
	}

	/**
	 * Get the current session
	 */
	async getSession() {
		const { data, error } = await this.supabase.auth.getSession();

		if (error) {
			throw new Error(error.message);
		}

		return data.session;
	}

	/**
	 * Get the user's role from the profiles table
	 */
	async getUserRole(userId: string): Promise<UserRole | null> {
		const { data, error } = await this.supabase
			.from('profiles')
			.select('role')
			.eq('id', userId)
			.single();

		if (error) {
			console.error('Error fetching user role:', error);
			return null;
		}

		return data?.role || null;
	}

	/**
	 * Check if the current user has a specific role
	 */
	async hasRole(role: UserRole): Promise<boolean> {
		const session = await this.getSession();
		if (!session) return false;

		const userRole = await this.getUserRole(session.user.id);
		return userRole === role;
	}

	/**
	 * Listen to auth state changes
	 */
	onAuthStateChange(callback: (session: any) => void) {
		return this.supabase.auth.onAuthStateChange((_event, session) => {
			callback(session);
		});
	}
}
