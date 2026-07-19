import { prisma } from './src/lib/prisma';

async function main() {
  // Видаляємо university-копії босів (не шаблони) щоб вони перестворились з 20 питаннями
  const uniBosses = await prisma.boss.findMany({
    where: { universityId: { not: null } },
    include: { _count: { select: { puzzles: true } } }
  });

  console.log(`Знайдено ${uniBosses.length} university-копій босів:`);
  for (const b of uniBosses) {
    console.log(`  - "${b.name}" (${b._count.puzzles} питань, UNI: ${b.universityId?.slice(0, 8)})`);
  }

  if (uniBosses.length === 0) {
    console.log('Нічого видаляти.');
    return;
  }

  const bossIds = uniBosses.map(b => b.id);

  // Каскадне видалення
  await prisma.raidMessage.deleteMany({ where: { bossId: { in: bossIds } } });
  await prisma.bossAttempt.deleteMany({ where: { bossId: { in: bossIds } } });
  await prisma.codeBlock.deleteMany({ where: { puzzle: { bossId: { in: bossIds } } } });
  await prisma.puzzle.deleteMany({ where: { bossId: { in: bossIds } } });
  await prisma.boss.deleteMany({ where: { id: { in: bossIds } } });

  console.log(`\n✅ Видалено ${uniBosses.length} university-копій. При наступному вході до рейду сервер автоматично створить нових босів з 20 питаннями.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
