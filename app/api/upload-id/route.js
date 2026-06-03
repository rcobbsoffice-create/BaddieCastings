import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const formData = await request.formData();
        const userId = formData.get('userId');
        const idFront = formData.get('idFront');
        const idBack = formData.get('idBack');

        if (!userId || !idFront || !idBack) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const upload = async (file, side) => {
            const ext = file.name.split('.').pop().toLowerCase();
            const path = `${userId}/id_${side}.${ext}`;
            const buffer = Buffer.from(await file.arrayBuffer());

            const { error } = await supabaseAdmin.storage
                .from('ids')
                .upload(path, buffer, { contentType: file.type, upsert: true });

            if (error) throw error;
            return path;
        };

        const [frontPath, backPath] = await Promise.all([
            upload(idFront, 'front'),
            upload(idBack, 'back'),
        ]);

        await supabaseAdmin
            .from('profiles')
            .update({ id_front_url: frontPath, id_back_url: backPath })
            .eq('id', userId);

        return NextResponse.json({ success: true, frontPath, backPath });
    } catch (err) {
        console.error('[Upload ID Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
