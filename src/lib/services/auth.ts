import type { SupabaseClient } from '@supabase/supabase-js';
import type { Provider } from '@supabase/supabase-js';
import type { UserRole } from '$lib/helpers/types';

export interface SignUpData {
	email: string;
	password: string;
	fullName: string;
}

export interface SignInData {
	email: string;
	password: string;
}

export class AuthService {
	constructor(private supabase: SupabaseClient) {}

	/**
	 * Sign up a new user (defaults to buyer role)
	 * Profile is created automatically by database trigger
	 */
	async signUp(data: SignUpData) {
		// Create the auth user - profile will be created by trigger
		const { data: authData, error: authError } = await this.supabase.auth.signUp({
			email: data.email,
			password: data.password,
			options: {
				data: {
					full_name: data.fullName
				}
			}
		});

		if (authError) {
			throw new Error(authError.message);
		}

		if (!authData.user) {
			throw new Error('Failed to create user');
		}

		// Profile is created automatically by the database trigger
		// No need to manually insert into profiles table
		return authData;
	}

	/**
	 * Update user's seller role
	 */
	async enableSellerRole(userId: string) {
		const { error } = await this.supabase
			.from('profiles')
			.update({ role_seller: true })
			.eq('id', userId);

		if (error) {
			throw new Error(`Failed to enable seller role: ${error.message}`);
		}
	}

	/**
	 * Get user profile
	 */
	async getProfile(userId: string) {
		const { data, error } = await this.supabase
			.from('profiles')
			.select('*')
			.eq('id', userId)
			.single();

		if (error) {
			throw new Error(`Failed to get profile: ${error.message}`);
		}

		return data;
	}

	/**
	 * Sign in an existing user with email/password
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
	 * Sign in with OAuth provider (Google, GitHub, etc.)
	 */
	async signInWithOAuth(provider: Provider, redirectTo?: string) {
		const { data, error } = await this.supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: redirectTo || `${window.location.origin}/auth/callback`
			}
		});

		if (error) {
			throw new Error(error.message);
		}

		return data;
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
			.select('role_buyer, role_seller')
			.eq('id', userId)
			.single();

		if (error) {
			console.error('Error fetching user role:', error);
			return null;
		}

		// Return primary role (seller takes precedence if both are true)
		if (data?.role_seller) return 'seller';
		if (data?.role_buyer) return 'buyer';
		return null;
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
