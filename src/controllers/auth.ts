import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { type AuthenticatedRequest } from '../middleware/auth';

const generateToken = (userId: string, role: string) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'super-secret-key-12345',
    { expiresIn: '30d' }
  );
};

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
      include: { university: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Акаунт не знайдено. Будь ласка, зареєструйтеся.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Невірний пароль.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id, user.role);

    res.json({ token, user: userWithoutPassword });
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

    const trimmedUniversityName = universityName.trim();

    let university = await prisma.university.findFirst({
      where: { 
        name: {
          equals: trimmedUniversityName,
          mode: 'insensitive'
        }
      }
    });

    if (!university) {
      university = await prisma.university.create({
        data: { name: trimmedUniversityName }
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
      include: { university: true }
    });

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id, user.role);

    res.json({ token, user: userWithoutPassword });
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
  universityId: z.string().min(1, 'universityId обов\'язковий'),
});

export const updateUniversity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = updateUniversitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { universityId } = parsed.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Неавторизовано' });
    }

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

const updateAvatarSchema = z.object({
  avatar: z.string().min(1, 'Аватар обов\'язковий').max(5, 'Максимальна довжина 5 символів (для емоджі)'),
});

export const updateAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = updateAvatarSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { avatar } = parsed.data;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Неавторизовано' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
      include: { university: true }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера при оновленні аватара' });
  }
};

