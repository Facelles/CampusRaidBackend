import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Некоректний формат email'),
  name: z.string()
});

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { email, name } = parsed.data;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Для MVP хакатону просто беремо або створюємо дефолтний університет
      let university = await prisma.university.findFirst();
      if (!university) {
        university = await prisma.university.create({
          data: { name: 'KNU' }
        });
      }

      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Студент',
          universityId: university.id,
        },
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера під час логіну' });
  }
};
