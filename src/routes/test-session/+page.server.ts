import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('Session:', locals.session);
	console.log('User Role:', locals.userRole);
	
	return {
		session: locals.session,
		userRole: locals.userRole,
		hasSession: !!locals.session,
		userId: locals.session?.user?.id || null,
		userEmail: locals.session?.user?.email || null
	};
};
