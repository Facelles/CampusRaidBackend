import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const getPostsQuerySchema = z.object({
  universityId: z.string().optional(),
});

export const getPosts = async (req: Request, res: Response) => {
  try {
    const parsed = getPostsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { universityId } = parsed.data;
    
    const posts = await prisma.post.findMany({
      where: universityId ? { universityId: String(universityId) } : undefined,
      include: {
        user: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const createPostSchema = z.object({
  title: z.string().min(1, 'Заголовок обов\'язковий'),
  content: z.string().min(1, 'Текст поста обов\'язковий'),
  userId: z.string().min(1, 'userId обов\'язковий'),
  universityId: z.string().min(1, 'universityId обов\'язковий'),
});

export const createPost = async (req: Request, res: Response) => {
  try {
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { title, content, userId, universityId } = parsed.data;

    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        userId,
        universityId,
      },
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const getPostByIdParamsSchema = z.object({
  id: z.string().min(1, 'ID поста обов\'язковий'),
});

export const getPostById = async (req: Request, res: Response) => {
  try {
    const parsed = getPostByIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { id } = parsed.data;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        comments: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Пост не знайдено' });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};
