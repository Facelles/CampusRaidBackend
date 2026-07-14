import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Некоректний формат email'),
});

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'Акаунт не знайдено. Будь ласка, зареєструйтеся.' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера під час логіну' });
  }
};

const registerSchema = z.object({
  email: z.string().email('Некоректний формат email'),
  name: z.string().min(2, "Ім'я має містити хоча б 2 символи"),
  universityId: z.string().min(1, "Університет обов'язковий")
});

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { email, name, universityId } = parsed.data;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      return res.status(400).json({ error: 'Цей email вже зареєстрований.' });
    }

    user = await prisma.user.create({
      data: {
        email,
        name,
        universityId,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера під час реєстрації' });
  }
};

export const getUniversities = async (req: Request, res: Response) => {
  try {
    const universities = await prisma.university.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(universities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};
