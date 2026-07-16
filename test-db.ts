import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const puzzles = await prisma.puzzle.findMany();
  console.log(puzzles);
}
main().catch(console.error).finally(() => prisma.$disconnect());
