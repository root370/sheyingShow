const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Applying storage policies...');

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM pg_policies
              WHERE schemaname = 'storage'
              AND tablename = 'objects'
              AND policyname = 'Public Access'
          ) THEN
              create policy "Public Access"
              on storage.objects for select
              using ( bucket_id = 'exhibitions' );
              RAISE NOTICE 'Policy "Public Access" created.';
          ELSE
              RAISE NOTICE 'Policy "Public Access" already exists.';
          END IF;

          IF NOT EXISTS (
              SELECT 1
              FROM pg_policies
              WHERE schemaname = 'storage'
              AND tablename = 'objects'
              AND policyname = 'Public Upload'
          ) THEN
              create policy "Public Upload"
              on storage.objects for insert
              with check ( bucket_id = 'exhibitions' );
              RAISE NOTICE 'Policy "Public Upload" created.';
          ELSE
              RAISE NOTICE 'Policy "Public Upload" already exists.';
          END IF;
      END
      $$;
    `);

    console.log('Storage policies applied successfully.');
  } catch (e) {
    console.error('Error applying policies:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
