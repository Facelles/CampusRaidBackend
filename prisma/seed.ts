import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Починаємо наповнення бази даних (Seed)...');

  // 1. Створюємо Університет
  const uni = await prisma.university.upsert({
    where: { name: 'Дефолтний Університет (KNU)' },
    update: {},
    create: {
      name: 'Дефолтний Університет (KNU)',
    },
  });
  console.log(`Університет готовий: ${uni.name}`);

  // 2. Створюємо Босів та Пазли
  const bossesData = [
    {
      name: 'Зелений Жнець (Memory Leak)',
      imageUrl: '/assets/null_reaper_isolated_1784022346516.jpg',
      maxHp: 2000,
      puzzles: [
        {
          title: 'Рейд 1: WeakMap Кешування',
          description: 'Звичайний Map тримає посилання на DOM вузли вічно, викликаючи Memory Leak. Використай WeakMap для прив\'язки даних до об\'єкта, щоб Garbage Collector міг їх звільнити.',
          type: 'SORTING',
          correctOrder: 'reaper-1-1,reaper-1-2,reaper-1-3,reaper-1-4',
          blocks: [
            { id: 'reaper-1-1', text: 'const cache = new WeakMap();' },
            { id: 'reaper-1-2', text: 'function processNode(node) {' },
            { id: 'reaper-1-3', text: '  cache.set(node, { computed: true });' },
            { id: 'reaper-1-4', text: '}' }
          ]
        },
        {
          title: 'Рейд 2: Замикання та Пам\'ять',
          description: 'Що виведе цей код після виконання функції?\n\nfunction createClosure() {\n  let bigArray = new Array(1000).fill("data");\n  return function() {\n    console.log(bigArray[0]);\n  };\n}\nconst leak = createClosure();',
          type: 'MULTIPLE_CHOICE',
          correctOrder: 'reaper-2-B',
          blocks: [
            { id: 'reaper-2-A', text: 'A. GC одразу видалить bigArray після виклику createClosure()' },
            { id: 'reaper-2-B', text: 'B. bigArray залишатиметься в пам\'яті, поки існує leak' },
            { id: 'reaper-2-C', text: 'C. ReferenceError, бо масив недоступний ззовні' },
            { id: 'reaper-2-D', text: 'D. Помилка OutOfMemory' }
          ]
        },
        {
          title: 'Рейд 3: React AbortController',
          description: 'Компонент демонтується до завершення fetch запиту, спричиняючи витік стану. Скасуй запит правильно!',
          type: 'SORTING',
          correctOrder: 'reaper-3-1,reaper-3-2,reaper-3-3,reaper-3-4',
          blocks: [
            { id: 'reaper-3-1', text: 'useEffect(() => {' },
            { id: 'reaper-3-2', text: '  const controller = new AbortController();\n  fetchData(controller.signal);' },
            { id: 'reaper-3-3', text: '  return () => controller.abort();' },
            { id: 'reaper-3-4', text: '}, []);' }
          ]
        }
      ]
    },
    {
      name: 'Уроборос (Infinite Loop)',
      imageUrl: '/assets/loop_dragon_isolated_1784022338222.jpg',
      maxHp: 3500,
      puzzles: [
        {
          title: 'Рейд 1: Рекурсивний DFS Графа',
          description: 'Дракон зациклився у циклічному графі! Виправ функцію пошуку, щоб вона уникала нескінченного циклу за допомогою Set.',
          type: 'SORTING',
          correctOrder: 'dragon-1-1,dragon-1-2,dragon-1-3,dragon-1-4,dragon-1-5',
          blocks: [
            { id: 'dragon-1-1', text: 'function dfs(node, visited = new Set()) {' },
            { id: 'dragon-1-2', text: '  if (visited.has(node.id)) return;' },
            { id: 'dragon-1-3', text: '  visited.add(node.id);' },
            { id: 'dragon-1-4', text: '  for (const neighbor of node.edges) { dfs(neighbor, visited); }' },
            { id: 'dragon-1-5', text: '}' }
          ]
        },
        {
          title: 'Рейд 2: Event Loop Загадка',
          description: 'В якому порядку виконаються ці консоль-логи?\n\nconsole.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);',
          type: 'MULTIPLE_CHOICE',
          correctOrder: 'dragon-2-C',
          blocks: [
            { id: 'dragon-2-A', text: 'A. 1, 2, 3, 4' },
            { id: 'dragon-2-B', text: 'B. 1, 4, 2, 3' },
            { id: 'dragon-2-C', text: 'C. 1, 4, 3, 2' },
            { id: 'dragon-2-D', text: 'D. 1, 3, 4, 2' }
          ]
        },
        {
          title: 'Рейд 3: Exponential Backoff',
          description: 'Сервер дракона падає від спаму запитами. Реалізуй безпечний retry з експоненційним затримуванням.',
          type: 'SORTING',
          correctOrder: 'dragon-3-1,dragon-3-2,dragon-3-3,dragon-3-4',
          blocks: [
            { id: 'dragon-3-1', text: 'async function fetchWithRetry(url, attempt = 1) {' },
            { id: 'dragon-3-2', text: '  try { return await fetch(url); } catch (e) {' },
            { id: 'dragon-3-3', text: '    await new Promise(res => setTimeout(res, 2 ** attempt * 100));' },
            { id: 'dragon-3-4', text: '    return fetchWithRetry(url, attempt + 1); } }' }
          ]
        }
      ]
    },
    {
      name: 'Червоний Демон (Kernel Panic)',
      imageUrl: '/assets/syntax_boss_isolated_1784022329125.jpg',
      maxHp: 5000,
      puzzles: [
        {
          title: 'Рейд 1: Безпека JWT',
          description: 'Демон вкрав токени користувачів! Валідуй токен правильно, щоб запобігти падінню сервера від ExpiredTokenError.',
          type: 'SORTING',
          correctOrder: 'demon-1-1,demon-1-2,demon-1-3,demon-1-4',
          blocks: [
            { id: 'demon-1-1', text: 'try { const payload = jwt.verify(token, SECRET); }' },
            { id: 'demon-1-2', text: 'catch (err) { if (err.name === "TokenExpiredError") {' },
            { id: 'demon-1-3', text: '  return res.status(401).json({ error: "Token expired" });' },
            { id: 'demon-1-4', text: '} return res.status(403).json({ error: "Invalid token" }); }' }
          ]
        },
        {
          title: 'Рейд 2: Обробка Promise.all',
          description: 'Якщо один Promise в `Promise.all` падає - падає все. Як отримати результати ВСІХ запитів, навіть якщо деякі впали?',
          type: 'MULTIPLE_CHOICE',
          correctOrder: 'demon-2-D',
          blocks: [
            { id: 'demon-2-A', text: 'A. Використати Promise.race()' },
            { id: 'demon-2-B', text: 'B. Огорнути Promise.all в try...catch' },
            { id: 'demon-2-C', text: 'C. Використати await Promise.any()' },
            { id: 'demon-2-D', text: 'D. Використати Promise.allSettled()' }
          ]
        },
        {
          title: 'Рейд 3: SQL Injection',
          description: 'Демон намагається зламати базу даних (DROP TABLE users). Напиши безпечний Prepared Statement для Prisma.',
          type: 'SORTING',
          correctOrder: 'demon-3-1,demon-3-2,demon-3-3',
          blocks: [
            { id: 'demon-3-1', text: 'const userEmail = req.body.email;' },
            { id: 'demon-3-2', text: 'const users = await prisma.$queryRaw`' },
            { id: 'demon-3-3', text: '  SELECT * FROM User WHERE email = ${userEmail}`' }
          ]
        }
      ]
    }
  ];

  // 3. Очищення старих босів та пазлів
  await prisma.bossAttempt.deleteMany();
  await prisma.codeBlock.deleteMany();
  await prisma.puzzle.deleteMany();
  await prisma.boss.deleteMany();

  for (const b of bossesData) {
    let boss = await prisma.boss.findFirst({
      where: { name: b.name }
    });

    if (!boss) {
      boss = await prisma.boss.create({
        data: {
          name: b.name,
          imageUrl: b.imageUrl,
          maxHp: b.maxHp,
          currentHp: b.maxHp
        }
      });
      console.log(`Створено боса: ${boss.name}`);

      for (const puzzleData of b.puzzles) {
        await prisma.puzzle.create({
          data: {
            title: puzzleData.title,
            description: puzzleData.description,
            type: puzzleData.type,
            bossId: boss.id,
            correctOrder: puzzleData.correctOrder,
            blocks: {
              create: puzzleData.blocks
            }
          }
        });
      }
      console.log(`Пазли додані для: ${boss.name}`);
    }
  }

  // 4. Створюємо Товари для магазину
  const itemsCount = await prisma.shopItem.count();
  if (itemsCount === 0) {
    await prisma.shopItem.createMany({
      data: [
        { name: 'Вбивця Багів', description: 'Крутий титул для профі', price: 100, type: 'TITLE' },
        { name: 'Сеньйор-Помідор', description: 'Тільки для справжніх Senior Developer', price: 500, type: 'TITLE' },
        { name: 'Підказка', description: 'Дізнатися один правильний блок', price: 50, type: 'HINT' }
      ]
    });
    console.log(`Товари для магазину додані!`);
  }

  // 5. Адмін та Форум (Тема хакатону)
  const adminEmail = 'facellesit@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'SuperSecretAdmin123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      name: 'Студрада (Admin)',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      xp: 9999,
      coins: 9999,
      universityId: uni.id
    }
  });
  console.log(`Адмін оновлений/створений: ${adminEmail}`);

    const hackathonPosts = [
      {
        title: '💼 Допомога в пошуках роботи',
        content: 'Діліться своїми резюме, вакансіями та порадами щодо працевлаштування для студентів! Сюди можна скидати лінки на стажування.'
      },
      {
        title: '📚 Допомога в навчанні',
        content: 'Не можете розібратися з матаналізом чи алгоритмами? Запитуйте тут, старшокурсники та викладачі допоможуть розібрати складні теми.'
      },
      {
        title: '💡 Студентські ініціативи',
        content: 'Маєте ідею, як покращити життя в гуртожитку чи на кампусі? Пропонуйте свої проекти тут. Найкращі ідеї отримають підтримку Студради.'
      },
      {
        title: '🤝 Психологічна підтримка',
        content: 'Сесія близько? Вигорання? Заходьте сюди, щоб поділитися наболілим, знайти підтримку від інших студентів або звернутися до психолога університету.'
      }
    ];

    for (const post of hackathonPosts) {
      const existingPost = await prisma.post.findFirst({
        where: { title: post.title }
      });
      if (!existingPost) {
        await prisma.post.create({
          data: {
            title: post.title,
            content: post.content,
            universityId: uni.id,
            userId: admin.id
          }
        });
      }
    }
    console.log('Теми хакатону додані на форум!');

  console.log('✅ База успішно наповнена даними!');
}

main()
  .catch((e) => {
    console.error('Помилка під час сідінгу:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
