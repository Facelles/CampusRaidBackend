import { Router } from 'express';
import { login } from '../controllers/auth';
import { getPosts, createPost, getPostById, votePost } from '../controllers/forum';
import { getActiveBoss, attackBoss, joinBoss } from '../controllers/game';
import { getTopUsers, getTopUniversities } from '../controllers/leaderboard';
import { sendMessage, getChatHistory, getMyChats } from '../controllers/chat';
import { getShopItems, buyItem } from '../controllers/shop';
import { getDashboardStats, createCustomBoss } from '../controllers/teacher';

const router = Router();

// ==========================================
// 🔑 Блок 1: Авторизація
// ==========================================
router.post('/auth/login', login);

// ==========================================
// 📰 Блок 2: Форум (Reddit-style)
// ==========================================
router.get('/posts', getPosts);
router.post('/posts', createPost);
router.get('/posts/:id', getPostById);
router.post('/posts/:id/vote', votePost);

// ==========================================
// 👾 Блок 3: Ігрова логіка (Рейд на Боса)
// ==========================================
router.get('/boss/active', getActiveBoss);
router.post('/boss/attack', attackBoss);
router.get('/boss/join', joinBoss);

// Рейтинги (Лідерборд)
router.get('/leaderboard/users', getTopUsers);
router.get('/leaderboard/universities', getTopUniversities);

// Чати
router.post('/chat', sendMessage);
router.get('/chat/history', getChatHistory);
router.get('/chat/my', getMyChats);

// Магазин
router.get('/shop/items', getShopItems);
router.post('/shop/buy', buyItem);

// Викладач
router.get('/teacher/stats', getDashboardStats);
router.post('/teacher/boss', createCustomBoss);

export default router;
