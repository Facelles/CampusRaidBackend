import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const sendMessageSchema = z.object({
  senderId: z.string().min(1, 'senderId обов\'язковий'),
  receiverId: z.string().min(1, 'receiverId обов\'язковий'),
  content: z.string().min(1, 'Повідомлення не може бути порожнім'),
});

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { senderId, receiverId, content } = parsed.data;

    // Перевірка чи вони друзі
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId }
        ]
      }
    });

    if (!friendship) {
      return res.status(403).json({ error: 'Ви можете писати лише своїм друзям' });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content
      }
    });

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка відправки повідомлення' });
  }
};

const getChatHistorySchema = z.object({
  user1Id: z.string().min(1, 'user1Id обов\'язковий'),
  user2Id: z.string().min(1, 'user2Id обов\'язковий'),
});

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const parsed = getChatHistorySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { user1Id, user2Id } = parsed.data;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id }
        ]
      },
      include: {
        sender: { select: { titles: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages sent by user2Id to user1Id as read
    await prisma.message.updateMany({
      where: {
        senderId: user2Id,
        receiverId: user1Id,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання історії чату' });
  }
};

export const getMyChats = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId обов\'язковий' });

    // Отримуємо всі повідомлення, де юзер був відправником або отримувачем
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { id: true, name: true, titles: true } },
        receiver: { select: { id: true, name: true, titles: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Формуємо унікальний список співрозмовників
    const chatPartnersMap = new Map();
    
    messages.forEach(msg => {
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!chatPartnersMap.has(partner.id)) {
        chatPartnersMap.set(partner.id, {
          id: partner.id,
          name: partner.name,
          titles: partner.titles,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0
        });
      }
      
      if (msg.receiverId === userId && !msg.isRead) {
        chatPartnersMap.get(partner.id).unreadCount += 1;
      }
    });

    res.json(Array.from(chatPartnersMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання списку чатів' });
  }
};

const markAsReadSchema = z.object({
  userId: z.string().min(1),
  partnerId: z.string().min(1),
});

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const parsed = markAsReadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Помилка валідації' });

    const { userId, partnerId } = parsed.data;

    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка оновлення статусу повідомлень' });
  }
};
