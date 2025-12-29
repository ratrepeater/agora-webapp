import { supabase } from '$lib/helpers/supabase.server';

export async function GET() {
    let { data: listings, error } = await supabase
        .from('listings')
        .select('*');
          
    if (error) {
        return { status: 500, body: error.message };
    }

    return new Response(JSON.stringify(listings), { status: 200, headers: { 'Content-Type': 'application/json' } });
}