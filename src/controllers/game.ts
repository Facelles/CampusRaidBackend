import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export const getActiveBoss = async (req: Request, res: Response) => {
  try {
    const boss = await prisma.boss.findFirst({
      include: { 
        puzzles: { 
          include: { blocks: true } 
        } 
      }
    });

    if (!boss) {
      return res.status(404).json({ message: 'Активного боса не знайдено' });
    }

    // Віддаємо перший знайдений пазл і перемішуємо блоки для фронтенду
    const puzzle = boss.puzzles[0];
    if (puzzle && puzzle.blocks) {
      puzzle.blocks = puzzle.blocks.sort(() => Math.random() - 0.5);
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

    const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    
    if (!puzzle) {
      return res.status(404).json({ message: 'Пазл не знайдено' });
    }

    // Перетворюємо масив від фронта у рядок для порівняння
    const userOrderString = blockIds.join(',');

    if (userOrderString === puzzle.correctOrder) {
      // 1. Зменшуємо HP боса
      await prisma.boss.update({
        where: { id: puzzle.bossId },
        data: { currentHp: { decrement: 20 } }
      });

      // 2. Нараховуємо XP та коіни юзеру
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: 50 }, coins: { increment: 10 } }
      });

      // Логування успішної спроби
      await prisma.bossAttempt.create({
        data: { userId, bossId: puzzle.bossId, success: true }
      });

      return res.json({ success: true, damage: 20, message: 'Критичний удар по Босу!' });
    } else {
      // Логування невдалої спроби
      await prisma.bossAttempt.create({
        data: { userId, bossId: puzzle.bossId, success: false }
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
