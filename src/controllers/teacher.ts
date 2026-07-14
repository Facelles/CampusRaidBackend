import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const teacherId = req.query.teacherId as string;
    if (!teacherId) return res.status(400).json({ error: 'teacherId обов\'язковий' });

    // Викладач бачить стату тільки по своїм створеним босам
    const myBosses = await prisma.boss.findMany({
      where: { creatorId: teacherId }
    });

    const myBossIds = myBosses.map(b => b.id);

    // Аналітика спроб: скільки загалом, скільки успішних
    const attempts = await prisma.bossAttempt.findMany({
      where: { bossId: { in: myBossIds } },
      include: { boss: { select: { name: true } }, user: { select: { name: true } } }
    });

    const successRateByBoss = new Map();
    myBosses.forEach(boss => {
      successRateByBoss.set(boss.name, { total: 0, successes: 0, students: new Set() });
    });

    attempts.forEach(attempt => {
      const bossName = attempt.boss.name;
      const stats = successRateByBoss.get(bossName);
      if (stats) {
        stats.total += 1;
        if (attempt.success) stats.successes += 1;
        stats.students.add(attempt.user.name);
      }
    });

    const bossAnalytics = Array.from(successRateByBoss.entries()).map(([name, stats]) => ({
      bossName: name,
      totalAttempts: stats.total,
      successRate: stats.total > 0 ? Math.round((stats.successes / stats.total) * 100) + '%' : '0%',
      uniqueStudentsTried: stats.students.size
    }));

    res.json({
      totalMyBosses: myBosses.length,
      bossAnalytics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання аналітики' });
  }
};

const createCustomBossSchema = z.object({
  creatorId: z.string().min(1, 'creatorId обов\'язковий'),
  name: z.string().min(1, 'Ім\'я боса обов\'язкове'),
  maxHp: z.number().positive(),
  puzzles: z.array(z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    correctOrder: z.string().min(1),
    blocks: z.array(z.object({
      id: z.string(),
      text: z.string()
    }))
  })).min(1, 'Потрібен хоча б один пазл')
});

export const createCustomBoss = async (req: Request, res: Response) => {
  try {
    const parsed = createCustomBossSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { creatorId, name, maxHp, puzzles } = parsed.data;

    // Генеруємо випадковий 6-значний код
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const newBoss = await prisma.boss.create({
      data: {
        name,
        maxHp,
        currentHp: maxHp,
        status: 'ACTIVE',
        creatorId,
        inviteCode,
        puzzles: {
          create: puzzles.map(p => ({
            title: p.title,
            description: p.description,
            correctOrder: p.correctOrder,
            blocks: {
              create: p.blocks
            }
          }))
        }
      }
    });

    res.json({ 
      success: true, 
      message: 'Бос успішно створений!', 
      inviteCode,
      boss: newBoss 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка створення боса' });
  }
};
