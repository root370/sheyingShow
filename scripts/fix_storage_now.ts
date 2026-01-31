const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fixing storage configuration...');

    // 1. Ensure Bucket is Public
    // This is critical for public URLs to work
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('exhibitions', 'exhibitions', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log('Bucket configuration updated: "exhibitions" is now PUBLIC.');

    // 2. Drop existing policies (Clean slate)
    const policies = [
      'Public Access',
      'Authenticated Upload',
      'Users can update own objects',
      'Users can delete own objects',
      'Any Upload',
      'Give me access',
      'Public Upload'
    ];

    for (const policy of policies) {
        try {
            await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${policy}" ON storage.objects;`);
        } catch (e) {
            console.log(`Note: Could not drop policy "${policy}" (might not exist).`);
        }
    }
    console.log('Old policies dropped.');

    // 3. Create new policies
    
    // Public Read
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Access"
      ON storage.objects FOR SELECT
      USING ( bucket_id = 'exhibitions' );
    `);

    // Authenticated Upload
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Authenticated Upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK ( bucket_id = 'exhibitions' );
    `);

    // Update Own
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can update own objects"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING ( bucket_id = 'exhibitions' AND auth.uid() = owner );
    `);

    // Delete Own
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can delete own objects"
      ON storage.objects FOR DELETE
      TO authenticated
      USING ( bucket_id = 'exhibitions' AND auth.uid() = owner );
    `);

    console.log('New storage policies applied successfully!');
  } catch (e) {
    console.error('Error fixing storage:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
