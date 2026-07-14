import { prisma } from '../src/lib/prisma';

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
      maxHp: 800,
      puzzles: [
        {
          title: 'Рейд 1: Очищення Пам\'яті',
          description: 'Жнець висмоктує оперативну пам\'ять! Віднови правильний порядок функції очищення, щоб зупинити витік.',
          correctOrder: 'reaper-1-1,reaper-1-2,reaper-1-3,reaper-1-4',
          blocks: [
            { id: 'reaper-1-1', text: 'function clearCache(data) {' },
            { id: 'reaper-1-2', text: '  if (data && data.length > 0) {' },
            { id: 'reaper-1-3', text: '    data.length = 0; // Очищуємо масив' },
            { id: 'reaper-1-4', text: '  }\n}' }
          ]
        },
        {
          title: 'Рейд 2: Відписка від подій',
          description: 'Сотні зомбі-лісенерів уповільнюють браузер. Видали слухача подій правильно!',
          correctOrder: 'reaper-2-1,reaper-2-2,reaper-2-3',
          blocks: [
            { id: 'reaper-2-1', text: 'function cleanup() {' },
            { id: 'reaper-2-2', text: '  window.removeEventListener("scroll", handleScroll);' },
            { id: 'reaper-2-3', text: '}' }
          ]
        },
        {
          title: 'Рейд 3: Зупинка Таймера',
          description: 'Таймер працює вічно і жере процесор. Використай clearInterval.',
          correctOrder: 'reaper-3-1,reaper-3-2,reaper-3-3,reaper-3-4',
          blocks: [
            { id: 'reaper-3-1', text: 'const timer = setInterval(() => {' },
            { id: 'reaper-3-2', text: '  console.log("Tick");' },
            { id: 'reaper-3-3', text: '}, 1000);' },
            { id: 'reaper-3-4', text: 'clearInterval(timer);' }
          ]
        },
        {
          title: 'Рейд 4: Закриття з\'єднання',
          description: 'База даних перевантажена відкритими сокетами! Закрий з\'єднання.',
          correctOrder: 'reaper-4-1,reaper-4-2,reaper-4-3',
          blocks: [
            { id: 'reaper-4-1', text: 'async function endSession(db) {' },
            { id: 'reaper-4-2', text: '  await db.disconnect();' },
            { id: 'reaper-4-3', text: '}' }
          ]
        }
      ]
    },
    {
      name: 'Уроборос (Infinite Loop)',
      imageUrl: '/assets/loop_dragon_isolated_1784022338222.jpg',
      maxHp: 1200,
      puzzles: [
        {
          title: 'Рейд 1: Розірвати Цикл',
          description: 'Дракон зациклився у нескінченності! Виправ умову виходу з циклу while.',
          correctOrder: 'dragon-1-1,dragon-1-2,dragon-1-3,dragon-1-4',
          blocks: [
            { id: 'dragon-1-1', text: 'let i = 0;' },
            { id: 'dragon-1-2', text: 'while (i < 10) {' },
            { id: 'dragon-1-3', text: '  console.log("Удар!");' },
            { id: 'dragon-1-4', text: '  i++;\n}' }
          ]
        },
        {
          title: 'Рейд 2: Базовий випадок рекурсії',
          description: 'Рекурсія без виходу викликає Stack Overflow. Додай умову зупинки.',
          correctOrder: 'dragon-2-1,dragon-2-2,dragon-2-3,dragon-2-4',
          blocks: [
            { id: 'dragon-2-1', text: 'function factorial(n) {' },
            { id: 'dragon-2-2', text: '  if (n <= 1) return 1;' },
            { id: 'dragon-2-3', text: '  return n * factorial(n - 1);' },
            { id: 'dragon-2-4', text: '}' }
          ]
        },
        {
          title: 'Рейд 3: Крок циклу For',
          description: 'Цикл ніколи не завершиться, якщо не збільшувати лічильник.',
          correctOrder: 'dragon-3-1,dragon-3-2,dragon-3-3',
          blocks: [
            { id: 'dragon-3-1', text: 'for (let k = 0; k < arr.length; k++) {' },
            { id: 'dragon-3-2', text: '  process(arr[k]);' },
            { id: 'dragon-3-3', text: '}' }
          ]
        },
        {
          title: 'Рейд 4: Запобігання дедлоку',
          description: 'Використай break, щоб екстрено вийти з нескінченного циклу.',
          correctOrder: 'dragon-4-1,dragon-4-2,dragon-4-3,dragon-4-4',
          blocks: [
            { id: 'dragon-4-1', text: 'while (true) {' },
            { id: 'dragon-4-2', text: '  if (isTargetFound()) {' },
            { id: 'dragon-4-3', text: '    break;' },
            { id: 'dragon-4-4', text: '  }\n}' }
          ]
        }
      ]
    },
    {
      name: 'Червоний Демон (Kernel Panic)',
      imageUrl: '/assets/syntax_boss_isolated_1784022329125.jpg',
      maxHp: 2000,
      puzzles: [
        {
          title: 'Рейд 1: Обробка Помилок',
          description: 'Демон спамить фатальними помилками! Напиши безпечний try-catch блок.',
          correctOrder: 'demon-1-1,demon-1-2,demon-1-3,demon-1-4,demon-1-5',
          blocks: [
            { id: 'demon-1-1', text: 'try {' },
            { id: 'demon-1-2', text: '  executeDangerousCode();' },
            { id: 'demon-1-3', text: '} catch (error) {' },
            { id: 'demon-1-4', text: '  console.error(error);' },
            { id: 'demon-1-5', text: '}' }
          ]
        },
        {
          title: 'Рейд 2: Null Check',
          description: 'Читання властивостей null ламає додаток. Додай перевірку.',
          correctOrder: 'demon-2-1,demon-2-2,demon-2-3,demon-2-4',
          blocks: [
            { id: 'demon-2-1', text: 'function getUserName(user) {' },
            { id: 'demon-2-2', text: '  if (!user) return "Guest";' },
            { id: 'demon-2-3', text: '  return user.name;' },
            { id: 'demon-2-4', text: '}' }
          ]
        },
        {
          title: 'Рейд 3: Promise Catch',
          description: 'Необроблений Promise Rejection знищить бекенд. Додай .catch()',
          correctOrder: 'demon-3-1,demon-3-2,demon-3-3',
          blocks: [
            { id: 'demon-3-1', text: 'fetchData()' },
            { id: 'demon-3-2', text: '  .then(res => res.json())' },
            { id: 'demon-3-3', text: '  .catch(err => console.log(err));' }
          ]
        },
        {
          title: 'Рейд 4: Throw Error',
          description: 'Краще кинути зрозумілу помилку, ніж отримати дивну поведінку.',
          correctOrder: 'demon-4-1,demon-4-2,demon-4-3',
          blocks: [
            { id: 'demon-4-1', text: 'if (age < 0) {' },
            { id: 'demon-4-2', text: '  throw new Error("Invalid age");' },
            { id: 'demon-4-3', text: '}' }
          ]
        }
      ]
    }
  ];

  for (const b of bossesData) {
    let boss = await prisma.boss.findFirst({ where: { name: b.name } });
    if (!boss) {
      boss = await prisma.boss.create({
        data: {
          name: b.name,
          imageUrl: b.imageUrl,
          maxHp: b.maxHp,
          currentHp: b.maxHp,
          inviteCode: `HACK-${b.name.substring(0, 3).toUpperCase()}` // Генеруємо умовний inviteCode
        }
      });
      console.log(`Бос створений: ${boss.name}`);

      for (const puzzleData of b.puzzles) {
        await prisma.puzzle.create({
          data: {
            title: puzzleData.title,
            description: puzzleData.description,
            bossId: boss.id,
            correctOrder: puzzleData.correctOrder,
            blocks: {
              create: puzzleData.blocks
            }
          }
        });
      }
      console.log(`Пазли додані для: ${boss.name}`);
    } else {
      await prisma.boss.update({
        where: { id: boss.id },
        data: { imageUrl: b.imageUrl }
      });
      console.log(`Бос вже існує, оновлено imageUrl: ${boss.name}`);
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
