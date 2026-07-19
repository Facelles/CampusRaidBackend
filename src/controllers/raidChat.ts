import { type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth';

const sendMessageSchema = z.object({
  bossId: z.string().min(1, 'bossId обов\'язковий'),
  content: z.string().min(1, 'Повідомлення не може бути порожнім').max(300, 'Максимум 300 символів'),
});

// GET /raid-chat/:bossId — останні 50 повідомлень
export const getRaidMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bossId = req.params.bossId as string;

    const messages = await prisma.raidMessage.findMany({
      where: { bossId },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, currentStreak: true, avatar: true }
        }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка завантаження рейд-чату' });
  }
};

// POST /raid-chat — надіслати повідомлення
export const sendRaidMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { bossId, content } = parsed.data;
    const userId = req.user!.id;

    // Перевіряємо що бос існує
    const boss = await prisma.boss.findUnique({ where: { id: bossId } });
    if (!boss) return res.status(404).json({ error: 'Боса не знайдено' });

    const message = await prisma.raidMessage.create({
      data: { bossId, userId, content },
      include: {
        user: {
          select: { id: true, name: true, currentStreak: true, avatar: true }
        }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка надсилання повідомлення' });
  }
};
