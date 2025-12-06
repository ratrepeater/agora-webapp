import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	const userRole = locals.userRole;

	let profile = null;
	if (session) {
		const { data } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', session.user.id)
			.single();
		profile = data;
	}

	return {
		session,
		userRole,
		profile
	};
};
