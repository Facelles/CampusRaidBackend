import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email('Некоректний формат email'),
  password: z.string().min(1, "Пароль обов'язковий"),
});

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'Акаунт не знайдено. Будь ласка, зареєструйтеся.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Невірний пароль.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера під час логіну' });
  }
};

const registerSchema = z.object({
  email: z.string().email('Некоректний формат email'),
  password: z.string().min(6, 'Пароль має містити хоча б 6 символів'),
  name: z.string().min(2, "Ім'я має містити хоча б 2 символи"),
  universityName: z.string().min(1, "Назва університету обов'язкова")
});

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { email, password, name, universityName } = parsed.data;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      return res.status(400).json({ error: 'Цей email вже зареєстрований.' });
    }

    let university = await prisma.university.findUnique({
      where: { name: universityName }
    });

    if (!university) {
      university = await prisma.university.create({
        data: { name: universityName }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        universityId: university.id,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
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

const updateUniversitySchema = z.object({
  userId: z.string().min(1, 'userId обов\'язковий'),
  universityId: z.string().min(1, 'universityId обов\'язковий'),
});

export const updateUniversity = async (req: Request, res: Response) => {
  try {
    const parsed = updateUniversitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { userId, universityId } = parsed.data;

    // Перевіримо, чи існує універ
    const university = await prisma.university.findUnique({ where: { id: universityId } });
    if (!university) {
      return res.status(404).json({ error: 'Університет не знайдено' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { universityId },
      include: { university: true }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера при оновленні університету' });
  }
};
