import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export const getShopItems = async (req: Request, res: Response) => {
  try {
    const items = await prisma.shopItem.findMany();
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання товарів' });
  }
};

const buyItemSchema = z.object({
  userId: z.string().min(1, 'userId обов\'язковий'),
  itemId: z.string().min(1, 'itemId обов\'язковий'),
});

export const buyItem = async (req: Request, res: Response) => {
  try {
    const parsed = buyItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { userId, itemId } = parsed.data;

    // 1. Отримуємо юзера і товар
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });

    if (!user || !item) {
      return res.status(404).json({ error: 'Юзера або товар не знайдено' });
    }

    // 2. Перевіряємо баланс
    if (user.coins < item.price) {
      return res.status(400).json({ error: 'Недостатньо монет' });
    }

    // 3. Перевіряємо чи юзер вже має цей титул
    if (item.type === 'TITLE' && user.titles.includes(item.name)) {
      return res.status(400).json({ error: 'У вас вже є цей титул' });
    }

    // 4. Проводимо транзакцію (віднімаємо гроші і додаємо предмет)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { decrement: item.price },
        titles: item.type === 'TITLE' ? { push: item.name } : undefined
      }
    });

    res.json({ success: true, message: `Ви успішно придбали: ${item.name}`, user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка купівлі товару' });
  }
};
