import { Router } from 'express';
import { login, register, getUniversities, updateUniversity, updateAvatar } from '../controllers/auth';
import { getPosts, createPost, getPostById, votePost, addComment } from '../controllers/forum';
import { getActiveBoss, attackBoss, joinBoss } from '../controllers/game';
import { getTopUsers, getTopUniversities, getBossLeaderboard } from '../controllers/leaderboard';
import { sendMessage, getChatHistory, getMyChats, markAsRead } from '../controllers/chat';
import { sendFriendRequest, respondFriendRequest, getFriends } from '../controllers/friends';
import { getShopItems, buyItem, equipItem } from '../controllers/shop';
import { getDashboardStats, createCustomBoss } from '../controllers/teacher';
import { getRaidMessages, sendRaidMessage } from '../controllers/raidChat';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ==========================================
// 🔑 Блок 1: Авторизація та Дані (Публічні)
// ==========================================
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/universities', getUniversities);

// Всі наступні маршрути потребують JWT авторизації
router.use(authenticateToken);

router.put('/user/university', updateUniversity);
router.put('/user/avatar', updateAvatar);

// ==========================================
// 📰 Блок 2: Форум (Reddit-style)
// ==========================================
router.get('/posts', getPosts);
router.post('/posts', createPost);
router.get('/posts/:id', getPostById);
router.post('/posts/:id/vote', votePost);
router.post('/posts/:id/comments', addComment);

// ==========================================
// 👾 Блок 3: Ігрова логіка (Рейд на Боса)
// ==========================================
router.get('/boss/active', getActiveBoss);
router.post('/boss/attack', attackBoss);
router.get('/boss/join', joinBoss);

// Рейтинги (Лідерборд)
router.get('/leaderboard/users', getTopUsers);
router.get('/leaderboard/universities', getTopUniversities);
router.get('/leaderboard/boss/:bossId', getBossLeaderboard);

// Чати (приватні)
router.post('/chat', sendMessage);
router.get('/chat/history', getChatHistory);
router.get('/chat/my', getMyChats);
router.post('/chat/read', markAsRead);

// Рейд-чат (публічний, під час боса)
router.get('/raid-chat/:bossId', getRaidMessages);
router.post('/raid-chat', sendRaidMessage);

// ==========================================
// 🤝 Блок 6: Друзі
// ==========================================
router.post('/friends/request', sendFriendRequest);
router.post('/friends/respond', respondFriendRequest);
router.get('/friends/:userId', getFriends);

// Магазин
router.get('/shop/items', getShopItems);
router.post('/shop/buy', buyItem);
router.post('/shop/equip', equipItem);

// Викладач
router.get('/teacher/stats', getDashboardStats);
router.post('/teacher/boss', createCustomBoss);

export default router;
