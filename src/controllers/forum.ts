import { type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth';

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
        user: {
          select: { id: true, name: true, role: true, xp: true, coins: true, titles: true, universityId: true }
        },
        _count: {
          select: { comments: true, votes: true }
        },
        votes: {
          select: { type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Sort by upvotes count (upvotes - downvotes) descending
    const sorted = posts
      .map(post => ({
        ...post,
        upvoteCount: post.votes.filter(v => v.type === 'UP').length - post.votes.filter(v => v.type === 'DOWN').length,
      }))
      .sort((a, b) => b.upvoteCount - a.upvoteCount);

    res.json(sorted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const createPostSchema = z.object({
  title: z.string().min(1, 'Заголовок обов\'язковий'),
  content: z.string().min(1, 'Текст поста обов\'язковий'),
  userId: z.string().optional(),
  universityId: z.string().min(1, 'universityId обов\'язковий'),
});

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { title, content, universityId } = parsed.data;
    const userId = req.user!.id;

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
        user: { select: { name: true, titles: true } },
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { name: true, titles: true } },
            replies: {
              include: { user: { select: { name: true, titles: true } } },
              orderBy: { createdAt: 'asc' }
            }
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

const votePostSchema = z.object({
  type: z.enum(['UPVOTE', 'DOWNVOTE']),
  userId: z.string().optional(),
});

export const votePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ error: "ID поста обов'язковий" });
    }
    const parsed = votePostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Помилка валідації" });
    }

    const { type } = parsed.data;
    const userId = req.user!.id;

    // Check if user already voted
    const existingVote = await prisma.postVote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id
        }
      }
    });

    let incrementUp = 0;
    let incrementDown = 0;

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote
        await prisma.postVote.delete({ where: { id: existingVote.id } });
        if (type === 'UPVOTE') incrementUp = -1;
        else incrementDown = -1;
      } else {
        // Change vote
        await prisma.postVote.update({
          where: { id: existingVote.id },
          data: { type }
        });
        if (type === 'UPVOTE') {
          incrementUp = 1;
          incrementDown = -1;
        } else {
          incrementUp = -1;
          incrementDown = 1;
        }
      }
    } else {
      // New vote
      await prisma.postVote.create({
        data: {
          type,
          userId,
          postId: id
        }
      });
      if (type === 'UPVOTE') incrementUp = 1;
      else incrementDown = 1;
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        upvotes: { increment: incrementUp },
        downvotes: { increment: incrementDown },
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, xp: true, coins: true, titles: true, universityId: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

const commentSchema = z.object({
  content: z.string().min(1, 'Коментар не може бути порожнім'),
  userId: z.string().optional(),
  parentId: z.string().optional(),
});

export const getThreads = async (req: Request, res: Response) => {
  try {
    const universityId = req.query.universityId as string;

    const threads = await prisma.post.findMany({
      where: { universityId }
    });
    res.json(threads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string; // postId
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Помилка валідації' });
    }

    const { content, parentId } = parsed.data;
    const userId = req.user!.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: 'Пост не знайдено' });
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent) return res.status(404).json({ error: 'Батьківський коментар не знайдено' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: id,
        userId,
        parentId
      },
      include: {
        user: { select: { name: true, titles: true } },
        replies: { include: { user: { select: { name: true, titles: true } } } }
      }
    });

    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка при створенні коментаря' });
  }
};
