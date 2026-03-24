import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function POST(request: NextRequest) {
  try {
    const { agencyId, role } = await getAuthenticatedAgency(request);
    
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const supabase = createSupabaseServiceClient(); // Use service role for storage management

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const typeParam = formData.get('type') as string; // 'logo' or 'watermark'
    const allowedTypes = ['logo', 'watermark'];
    const type = allowedTypes.includes(typeParam) ? typeParam : 'unknown';

    if (type === 'unknown') {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bucketName = 'agency-logos';
    
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.id === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true });
    }

    // Process image with sharp
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const compressedBuffer = await sharp(buffer)
      .resize(400, null, { withoutEnlargement: true }) // Standard enterprise logo size
      .webp({ quality: 85 })
      .toBuffer();

    const fileName = `${agencyId}/${type}_${Date.now()}.webp`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, compressedBuffer, {
        upsert: true,
        contentType: 'image/webp',
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('[Logo Upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
