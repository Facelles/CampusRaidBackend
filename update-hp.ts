import { prisma } from './src/lib/prisma';

async function main() {
  const bosses = await prisma.boss.findMany();
  for (const boss of bosses) {
    let newMaxHp = boss.maxHp;
    if (boss.name.includes('Зелений Жнець')) newMaxHp = 10000;
    else if (boss.name.includes('Уроборос')) newMaxHp = 25000;
    else if (boss.name.includes('Червоний Демон')) newMaxHp = 50000;
    else newMaxHp = boss.maxHp * 5; // Fallback

    // Update both maxHp and currentHp to keep them full or scale them
    await prisma.boss.update({
      where: { id: boss.id },
      data: {
        maxHp: newMaxHp,
        currentHp: newMaxHp // Reset to full HP to apply new balance
      }
    });
    console.log(`Updated ${boss.name}: ${boss.maxHp} -> ${newMaxHp} HP`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
