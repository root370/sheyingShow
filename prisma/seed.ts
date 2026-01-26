import { PrismaClient } from '@prisma/client'
import { exhibitions } from '../src/data/exhibitions'
import { photos } from '../src/data/photos'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // Seed Exhibitions
  for (const e of exhibitions) {
    const exhibition = await prisma.exhibition.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        title: e.title,
        cover: e.cover,
        year: e.year,
        photoCount: e.photoCount,
        description: e.description,
        top: e.top,
        left: e.left,
        rotate: e.rotate,
        borderRadius: e.borderRadius,
      },
    })
    console.log(`Created exhibition with id: ${exhibition.id}`)
  }

  // Seed Photos
  for (const p of photos) {
    const photo = await prisma.photo.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        src: p.src,
        alt: p.alt,
        caption: p.caption,
        aspectRatio: p.aspectRatio,
        color: p.color,
        annotations: {
          create: p.annotations.map(a => ({
            x: a.x,
            y: a.y,
            text: a.text
          }))
        }
      },
    })
    console.log(`Created photo with id: ${photo.id}`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
