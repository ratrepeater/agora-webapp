import { writable } from 'svelte/store';
import type { Session, User } from '@supabase/supabase-js';
import type { UserRole } from '$lib/helpers/types';

interface AuthState {
	session: Session | null;
	user: User | null;
	userRole: UserRole | null;
	loading: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		session: null,
		user: null,
		userRole: null,
		loading: true
	});

	return {
		subscribe,
		setSession: (session: Session | null, userRole: UserRole | null) => {
			update((state) => ({
				...state,
				session,
				user: session?.user || null,
				userRole,
				loading: false
			}));
		},
		setLoading: (loading: boolean) => {
			update((state) => ({ ...state, loading }));
		},
		clear: () => {
			set({
				session: null,
				user: null,
				userRole: null,
				loading: false
			});
		}
	};
}

export const authStore = createAuthStore();
