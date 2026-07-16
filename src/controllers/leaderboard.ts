import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';

// Отримати топ-10 студентів
export const getTopUsers = async (req: Request, res: Response) => {
  try {
    const topUsers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        xp: 'desc',
      },
      select: {
        id: true,
        name: true,
        xp: true,
        university: {
          select: { name: true }
        }
      }
    });
    
    res.json(topUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання рейтингу студентів' });
  }
};

// Отримати рейтинг університетів
export const getTopUniversities = async (req: Request, res: Response) => {
  try {
    // Групуємо юзерів за університетом та рахуємо загальну суму XP
    const groupedData = await prisma.user.groupBy({
      by: ['universityId'],
      _sum: {
        xp: true,
      },
      orderBy: {
        _sum: {
          xp: 'desc'
        }
      },
      take: 10
    });

    // Підтягуємо імена університетів
    const universityIds = groupedData.map(g => g.universityId).filter(id => id !== null) as string[];
    const universities = await prisma.university.findMany({
      where: { id: { in: universityIds } }
    });

    // Формуємо фінальний результат
    const result = groupedData.map(group => {
      const uni = universities.find(u => u.id === group.universityId);
      return {
        universityId: group.universityId,
        name: uni ? uni.name : 'Невідомий',
        totalXp: group._sum.xp || 0
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання рейтингу університетів' });
  }
};

export const getBossLeaderboard = async (req: Request, res: Response) => {
  try {
    const bossId = req.params.bossId as string;
    const leaderboard = await prisma.bossAttempt.groupBy({
      by: ['userId'],
      where: { bossId },
      _sum: { damage: true },
      orderBy: { _sum: { damage: 'desc' } },
      take: 10
    });

    const userIds = leaderboard.map(lb => lb.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, titles: true }
    });

    const result = leaderboard.map(lb => {
      const user = users.find(u => u.id === lb.userId);
      return {
        ...lb,
        user
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання рейтингу боса' });
  }
};
