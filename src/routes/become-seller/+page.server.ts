import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session) {
		throw redirect(303, '/auth/signin?redirectTo=/become-seller');
	}

	return {
		session: locals.session
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.session) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const companyName = formData.get('companyName') as string;

			// Update profile to enable seller role
			const updates: any = { role_seller: true };
			if (companyName) {
				updates.company_name = companyName;
			}

			const { error } = await locals.supabase
				.from('profiles')
				.update(updates)
				.eq('id', locals.session.user.id);

			if (error) {
				console.error('Error enabling seller role:', error);
				return fail(500, { error: 'Failed to enable seller account' });
			}

			// Redirect to seller dashboard
			throw redirect(303, '/seller/dashboard');
		} catch (err) {
			if ((err as any).status === 303) {
				throw err;
			}
			console.error('Error in become-seller action:', err);
			return fail(500, { error: 'Failed to enable seller account' });
		}
	}
};
