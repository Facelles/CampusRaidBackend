import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

export const getActiveBoss = async (req: Request, res: Response) => {
  try {
    const { universityId } = req.query;
    if (!universityId || typeof universityId !== 'string') {
      return res.status(400).json({ message: 'universityId is required' });
    }

    let boss = await prisma.boss.findFirst({
      where: { universityId, status: 'ACTIVE' },
      include: { 
        puzzles: { 
          include: { blocks: true } 
        } 
      }
    });

    if (!boss) {
      // Find a template boss (no university assigned)
      // Pick random template boss
      let templates = await prisma.boss.findMany({
        where: { universityId: null },
        include: { puzzles: { include: { blocks: true } } }
      });

      if (templates.length === 0) {
        // Fallback: get ANY boss to use as a template
        templates = await prisma.boss.findMany({
          take: 3,
          include: { puzzles: { include: { blocks: true } } }
        });
        if (templates.length === 0) {
           return res.status(404).json({ message: 'No bosses in database to copy from' });
        }
      }

      const templateBoss = templates[Math.floor(Math.random() * templates.length)];
      if (!templateBoss) {
        return res.status(404).json({ message: 'No template boss found' });
      }

      const createdBoss = await prisma.boss.create({
        data: {
          name: templateBoss.name,
          imageUrl: templateBoss.imageUrl,
          maxHp: templateBoss.maxHp,
          currentHp: templateBoss.maxHp,
          universityId,
          status: 'ACTIVE'
        }
      });

      for (const p of templateBoss.puzzles) {
        let newCorrectOrder = p.correctOrder;
        const blocksData = p.blocks.map(b => {
          const newId = crypto.randomUUID();
          newCorrectOrder = newCorrectOrder.replace(b.id, newId);
          return { id: newId, text: b.text };
        });

        await prisma.puzzle.create({
          data: {
            title: p.title,
            description: p.description,
            type: p.type,
            correctOrder: newCorrectOrder,
            bossId: createdBoss.id,
            blocks: {
              create: blocksData
            }
          }
        });
      }
      
      const fullBoss = await prisma.boss.findUnique({
        where: { id: createdBoss.id },
        include: { puzzles: { include: { blocks: true } } }
      });
      if (!fullBoss) throw new Error('Failed to load created boss');
      boss = fullBoss;
    }

    // Віддаємо пазл на основі HP, щоб всі юзери в університеті бачили одне і те ж питання
    if (boss.puzzles.length > 0) {
      const puzzleIndex = boss.currentHp % boss.puzzles.length;
      const puzzle = boss.puzzles[puzzleIndex];
      if (puzzle && puzzle.blocks) {
        puzzle.blocks = puzzle.blocks.sort(() => Math.random() - 0.5);
        boss.puzzles = [puzzle];
      } else {
        boss.puzzles = [];
      }
    }

    res.json(boss);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const attackBossSchema = z.object({
  userId: z.string().min(1, 'userId обов\'язковий'),
  puzzleId: z.string().min(1, 'puzzleId обов\'язковий'),
  blockIds: z.array(z.string()).min(1, 'Масив блоків не може бути порожнім'),
});

export const attackBoss = async (req: Request, res: Response) => {
  try {
    const parsed = attackBossSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { userId, puzzleId, blockIds } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    if (user.role !== 'ADMIN') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const failedAttemptsToday = await prisma.bossAttempt.count({
        where: {
          userId,
          success: false,
          createdAt: {
            gte: today
          }
        }
      });

      if (failedAttemptsToday >= 7) {
        return res.status(403).json({ message: 'Ви використали всі 7 невдалих спроб на сьогодні. Спробуйте завтра!' });
      }
    }

    const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    
    if (!puzzle) {
      return res.status(404).json({ message: 'Пазл не знайдено' });
    }

    // Перетворюємо масив від фронта у рядок для порівняння
    const userOrderString = blockIds.join(',');

    console.log('--- DEBUG ATTACK BOSS ---');
    console.log('userOrderString:', userOrderString);
    console.log('puzzle.correctOrder:', puzzle.correctOrder);
    console.log('-------------------------');

    if (userOrderString === puzzle.correctOrder) {
      const damage = 20;
      
      const updatedBoss = await prisma.boss.update({
        where: { id: puzzle.bossId },
        data: { currentHp: { decrement: damage } }
      });

      if (updatedBoss.currentHp <= 0) {
        await prisma.boss.update({
          where: { id: puzzle.bossId },
          data: { status: 'DEFEATED' }
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: 50 }, coins: { increment: 10 } }
      });

      await prisma.bossAttempt.create({
        data: { userId, bossId: puzzle.bossId, success: true, damage }
      });

      return res.json({ success: true, damage, message: 'Критичний удар по Босу!' });
    } else {
      // Логування невдалої спроби
      await prisma.bossAttempt.create({
        data: { userId, bossId: puzzle.bossId, success: false, damage: 0 }
      });

      return res.json({ success: false, message: 'Код не скомпілювався. Бос контратакує!' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const joinBossSchema = z.object({
  inviteCode: z.string().min(1, 'inviteCode обов\'язковий'),
});

export const joinBoss = async (req: Request, res: Response) => {
  try {
    const parsed = joinBossSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { inviteCode } = parsed.data;

    const boss = await prisma.boss.findUnique({
      where: { inviteCode },
      include: { 
        puzzles: { 
          include: { blocks: true } 
        } 
      }
    });

    if (!boss) {
      return res.status(404).json({ message: 'Боса за таким кодом не знайдено' });
    }

    // Перемішуємо блоки для фронтенду
    const puzzle = boss.puzzles[0];
    if (puzzle && puzzle.blocks) {
      puzzle.blocks = puzzle.blocks.sort(() => Math.random() - 0.5);
    }

    res.json(boss);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка підключення до боса' });
  }
};
