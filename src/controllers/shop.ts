import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';

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
  userId: z.string().optional(),
  itemId: z.string().min(1, 'itemId обов\'язковий'),
});

export const buyItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = buyItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { itemId } = parsed.data;
    const userId = req.user!.id;

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

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({ success: true, message: `Ви успішно придбали: ${item.name}`, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка купівлі товару' });
  }
};

const equipItemSchema = z.object({
  userId: z.string().optional(),
  itemId: z.string().min(1, 'itemId обов\'язковий'),
});

export const equipItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = equipItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { itemId } = parsed.data;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });

    if (!user || !item) {
      return res.status(404).json({ error: 'Юзера або товар не знайдено' });
    }

    if (item.type !== 'TITLE' || !user.titles.includes(item.name)) {
      return res.status(400).json({ error: 'Ви не маєте цього предмету' });
    }

    const newTitles = [item.name, ...user.titles.filter(t => t !== item.name)];

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { titles: newTitles }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({ success: true, message: `Екіпіровано: ${item.name}`, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка екіпіровки' });
  }
};
