import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const friendRequestSchema = z.object({
  user1Id: z.string().min(1, 'user1Id обов\'язковий'),
  user2Id: z.string().min(1, 'user2Id обов\'язковий'),
});

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const parsed = friendRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { user1Id, user2Id } = parsed.data;

    if (user1Id === user2Id) {
      return res.status(400).json({ error: 'Не можна додати себе в друзі' });
    }

    // Перевірка існуючого зв'язку
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Запит вже надіслано або ви вже друзі' });
    }

    const friendship = await prisma.friendship.create({
      data: {
        user1Id,
        user2Id,
        status: 'PENDING'
      }
    });

    res.json(friendship);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const acceptFriendSchema = z.object({
  friendshipId: z.string().min(1, 'friendshipId обов\'язковий'),
  status: z.enum(['ACCEPTED', 'REJECTED'])
});

export const respondFriendRequest = async (req: Request, res: Response) => {
  try {
    const parsed = acceptFriendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { friendshipId, status } = parsed.data;

    const friendship = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status }
    });

    res.json(friendship);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId обов\'язковий' });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: { select: { id: true, name: true, titles: true } },
        user2: { select: { id: true, name: true, titles: true } }
      }
    });

    res.json(friendships);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};
