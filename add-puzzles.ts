/**
 * add-puzzles.ts
 * Додає по 17 нових питань до кожного боса (до 20 разом зі стартовими 3).
 * Запуск: bun add-puzzles.ts
 */
import { prisma } from './src/lib/prisma';
import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Типи
// ─────────────────────────────────────────────────────────────────────────────
type PuzzleData = {
  title: string;
  description: string;
  type: 'SORTING' | 'MULTIPLE_CHOICE';
  correctOrder: string;
  blocks: { id: string; text: string }[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Допоміжна функція: замінює людські ID на UUID
// ─────────────────────────────────────────────────────────────────────────────
function resolveIds(puzzles: PuzzleData[]): PuzzleData[] {
  return puzzles.map(p => {
    const idMap = new Map<string, string>();
    const blocks = p.blocks.map(b => {
      const newId = crypto.randomUUID();
      idMap.set(b.id, newId);
      return { ...b, id: newId };
    });
    const correctOrder = p.correctOrder
      .split(',')
      .map(id => idMap.get(id) ?? id)
      .join(',');
    return { ...p, blocks, correctOrder };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Боси 1: Зелений Жнець (Memory Leak) — 17 нових питань
// ─────────────────────────────────────────────────────────────────────────────
const reaperPuzzles: PuzzleData[] = [
  // EASY
  {
    title: 'Рейд 4: Що таке Memory Leak?',
    description: 'Виберіть найточніше визначення memory leak:',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r4-B',
    blocks: [
      { id: 'r4-A', text: 'A. Помилка синтаксису у JavaScript коді' },
      { id: 'r4-B', text: "B. Пам'ять виділяється, але ніколи не звільняється" },
      { id: 'r4-C', text: 'C. Повільне читання файлів з диску' },
      { id: 'r4-D', text: 'D. Перевантаження CPU серверу' },
    ],
  },
  {
    title: 'Рейд 5: Очистити setTimeout',
    description: 'Ти запустив setInterval у компоненті. Як уникнути memory leak при розмонтуванні?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r5-C',
    blocks: [
      { id: 'r5-A', text: 'A. Встановити interval=null' },
      { id: 'r5-B', text: 'B. Перезавантажити сторінку' },
      { id: 'r5-C', text: 'C. Повернути clearInterval з useEffect cleanup' },
      { id: 'r5-D', text: 'D. Використати useState замість useEffect' },
    ],
  },
  {
    title: 'Рейд 6: EventListener Витік',
    description: "Склади правильний порядок коду для уникнення витоку пам'яті при слуханні подій:",
    type: 'SORTING',
    correctOrder: 'r6-1,r6-2,r6-3,r6-4',
    blocks: [
      { id: 'r6-1', text: 'const handler = () => console.log("click");' },
      { id: 'r6-2', text: 'document.addEventListener("click", handler);' },
      { id: 'r6-3', text: 'return () => {' },
      { id: 'r6-4', text: '  document.removeEventListener("click", handler); };' },
    ],
  },
  {
    title: 'Рейд 7: Garbage Collector',
    description: "Коли JavaScript Garbage Collector звільняє пам'ять об'єкту?",
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r7-A',
    blocks: [
      { id: 'r7-A', text: "A. Коли на об'єкт більше не існує жодного посилання" },
      { id: 'r7-B', text: 'B. Коли викликається delete obj' },
      { id: 'r7-C', text: 'C. Після кожної функції автоматично' },
      { id: 'r7-D', text: 'D. Раз на секунду в фоні' },
    ],
  },
  // MEDIUM
  {
    title: 'Рейд 8: WeakRef Об\'єкт',
    description: 'Склади код, що перевіряє чи WeakRef ще живий перед використанням:',
    type: 'SORTING',
    correctOrder: 'r8-1,r8-2,r8-3,r8-4',
    blocks: [
      { id: 'r8-1', text: 'const ref = new WeakRef(someObject);' },
      { id: 'r8-2', text: 'const obj = ref.deref();' },
      { id: 'r8-3', text: 'if (obj !== undefined) {' },
      { id: 'r8-4', text: '  obj.doWork(); }' },
    ],
  },
  {
    title: 'Рейд 9: Витік у замиканні',
    description: "Що НЕ буде зібрано GC через замикання?\n\nfunction outer() {\n  const data = new Array(1000).fill(42);\n  return function inner() {\n    return data[0];\n  };\n}",
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r9-B',
    blocks: [
      { id: 'r9-A', text: 'A. Функція outer' },
      { id: 'r9-B', text: 'B. Масив data (бо inner тримає посилання)' },
      { id: 'r9-C', text: 'C. Нічого, GC очистить все' },
      { id: 'r9-D', text: 'D. Функція inner' },
    ],
  },
  {
    title: 'Рейд 10: FinalizationRegistry',
    description: 'Склади код реєстрації callback при GC збиранні:',
    type: 'SORTING',
    correctOrder: 'r10-1,r10-2,r10-3',
    blocks: [
      { id: 'r10-1', text: 'const registry = new FinalizationRegistry(val => {' },
      { id: 'r10-2', text: "  console.log(val + ' was collected');" },
      { id: 'r10-3', text: "});\nregistry.register(myObject, 'myObject');" },
    ],
  },
  {
    title: 'Рейд 11: DOM Витік через Map',
    description: 'Чому зберігання DOM-елементів у звичайному Map може спричинити витік?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r11-C',
    blocks: [
      { id: 'r11-A', text: 'A. Map не підтримує збереження DOM-елементів' },
      { id: 'r11-B', text: 'B. DOM елементи стають null в Map' },
      { id: 'r11-C', text: 'C. Map тримає сильне посилання — видалений з DOM елемент не збирається GC' },
      { id: 'r11-D', text: 'D. Це нормальна поведінка без наслідків' },
    ],
  },
  {
    title: 'Рейд 12: React useCallback Витік',
    description: 'Склади порядок використання useCallback щоб не захоплювати старі замикання:',
    type: 'SORTING',
    correctOrder: 'r12-1,r12-2,r12-3',
    blocks: [
      { id: 'r12-1', text: 'const handleClick = useCallback(() => {' },
      { id: 'r12-2', text: '  console.log(count);' },
      { id: 'r12-3', text: '}, [count]);' },
    ],
  },
  // HARD
  {
    title: 'Рейд 13: Профілювання витоків',
    description: 'Який Chrome DevTools інструмент найкраще виявляє memory leaks?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r13-B',
    blocks: [
      { id: 'r13-A', text: 'A. Network вкладка → XHR запити' },
      { id: 'r13-B', text: 'B. Memory → Heap Snapshot порівняння' },
      { id: 'r13-C', text: 'C. Console → console.memory()' },
      { id: 'r13-D', text: 'D. Sources → Breakpoints' },
    ],
  },
  {
    title: 'Рейд 14: Node.js Stream Витік',
    description: 'Склади правильний код для закриття readable stream після помилки:',
    type: 'SORTING',
    correctOrder: 'r14-1,r14-2,r14-3,r14-4',
    blocks: [
      { id: 'r14-1', text: 'const stream = fs.createReadStream("file.txt");' },
      { id: 'r14-2', text: 'stream.on("error", (err) => {' },
      { id: 'r14-3', text: '  console.error(err);' },
      { id: 'r14-4', text: '  stream.destroy(); });' },
    ],
  },
  {
    title: 'Рейд 15: Що поверне WeakRef після GC?',
    description: "let obj = { x: 1 };\nconst weak = new WeakRef(obj);\nobj = null;\n// ... GC runs ...\nconsole.log(weak.deref());",
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r15-D',
    blocks: [
      { id: 'r15-A', text: 'A. { x: 1 }' },
      { id: 'r15-B', text: 'B. null' },
      { id: 'r15-C', text: 'C. ReferenceError' },
      { id: 'r15-D', text: 'D. undefined (якщо GC вже зібрав об\'єкт)' },
    ],
  },
  {
    title: 'Рейд 16: SharedArrayBuffer Витік',
    description: 'Що потрібно зробити з SharedArrayBuffer після завершення роботи Worker?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r16-A',
    blocks: [
      { id: 'r16-A', text: 'A. Видалити всі посилання на нього в головному потоці та Workers' },
      { id: 'r16-B', text: 'B. Зателефонувати .close() на буфері' },
      { id: 'r16-C', text: 'C. Нічого — він автоматично очищається' },
      { id: 'r16-D', text: 'D. Викликати gc() вручну' },
    ],
  },
  {
    title: 'Рейд 17: Observer Витік',
    description: 'Склади код IntersectionObserver без витоку при unmount:',
    type: 'SORTING',
    correctOrder: 'r17-1,r17-2,r17-3,r17-4,r17-5',
    blocks: [
      { id: 'r17-1', text: 'const observer = new IntersectionObserver(callback);' },
      { id: 'r17-2', text: 'observer.observe(element);' },
      { id: 'r17-3', text: 'return () => {' },
      { id: 'r17-4', text: '  observer.unobserve(element);' },
      { id: 'r17-5', text: '  observer.disconnect(); };' },
    ],
  },
  {
    title: 'Рейд 18: Розмір масиву в V8',
    description: "Скільки приблизно займе в пам'яті масив з 1 000 000 об'єктів { x: 1 }?",
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r18-C',
    blocks: [
      { id: 'r18-A', text: 'A. ~1 КБ' },
      { id: 'r18-B', text: 'B. ~1 МБ' },
      { id: 'r18-C', text: "C. ~32–64 МБ (через overhead об'єктів V8)" },
      { id: 'r18-D', text: 'D. ~1 ГБ' },
    ],
  },
  {
    title: 'Рейд 19: Promise.race та Витік',
    description: 'Склади Promise.race де повільний Promise не тримає ресурси:',
    type: 'SORTING',
    correctOrder: 'r19-1,r19-2,r19-3',
    blocks: [
      { id: 'r19-1', text: 'const controller = new AbortController();' },
      { id: 'r19-2', text: 'const result = await Promise.race([fetch(url, { signal: controller.signal }), timeout]);' },
      { id: 'r19-3', text: 'controller.abort(); // скасовуємо повільний fetch' },
    ],
  },
  {
    title: 'Рейд 20: V8 Heap Snapshot',
    description: 'Що означає "Detached DOM tree" у Heap Snapshot Chrome DevTools?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'r20-B',
    blocks: [
      { id: 'r20-A', text: 'A. Елемент правильно видалено з DOM' },
      { id: 'r20-B', text: 'B. Елемент видалений з DOM, але JavaScript тримає посилання — витік!' },
      { id: 'r20-C', text: 'C. Shadow DOM елемент' },
      { id: 'r20-D', text: 'D. Елемент у process.nextTick черзі' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Бос 2: Уроборос (Infinite Loop) — 17 нових питань
// ─────────────────────────────────────────────────────────────────────────────
const dragonPuzzles: PuzzleData[] = [
  // EASY
  {
    title: 'Рейд 4: Що таке нескінченний цикл?',
    description: 'Яка умова спричинить нескінченний цикл?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd4-A',
    blocks: [
      { id: 'd4-A', text: 'A. while(true) { ... } без break' },
      { id: 'd4-B', text: 'B. for(let i=0; i<10; i++) { ... }' },
      { id: 'd4-C', text: 'C. Array.forEach() з великим масивом' },
      { id: 'd4-D', text: 'D. setTimeout з delay=0' },
    ],
  },
  {
    title: 'Рейд 5: Базова рекурсія',
    description: 'Склади правильний порядок рекурсивної факторіальної функції:',
    type: 'SORTING',
    correctOrder: 'd5-1,d5-2,d5-3,d5-4',
    blocks: [
      { id: 'd5-1', text: 'function factorial(n) {' },
      { id: 'd5-2', text: '  if (n <= 1) return 1;' },
      { id: 'd5-3', text: '  return n * factorial(n - 1);' },
      { id: 'd5-4', text: '}' },
    ],
  },
  {
    title: 'Рейд 6: Стек Викликів',
    description: 'Що станеться при нескінченній рекурсії без базового випадку?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd6-C',
    blocks: [
      { id: 'd6-A', text: 'A. Програма зупиниться через 1 секунду' },
      { id: 'd6-B', text: 'B. JavaScript автоматично зупинить рекурсію' },
      { id: 'd6-C', text: 'C. RangeError: Maximum call stack size exceeded' },
      { id: 'd6-D', text: 'D. Функція поверне undefined' },
    ],
  },
  {
    title: 'Рейд 7: React useEffect Цикл',
    description: 'Чому цей код спричинює нескінченний цикл?\n\nuseEffect(() => {\n  setCount(count + 1);\n}, [count]);',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd7-B',
    blocks: [
      { id: 'd7-A', text: 'A. setCount не дозволений у useEffect' },
      { id: 'd7-B', text: 'B. Кожен setCount оновлює count → запускає effect → знов setCount' },
      { id: 'd7-C', text: 'C. [count] — неправильна залежність' },
      { id: 'd7-D', text: 'D. useEffect не підтримує числові залежності' },
    ],
  },
  // MEDIUM
  {
    title: 'Рейд 8: BFS обхід графа',
    description: 'Склади BFS без зациклення через visited set:',
    type: 'SORTING',
    correctOrder: 'd8-1,d8-2,d8-3,d8-4,d8-5',
    blocks: [
      { id: 'd8-1', text: 'function bfs(start) {' },
      { id: 'd8-2', text: '  const visited = new Set([start]);' },
      { id: 'd8-3', text: '  const queue = [start];' },
      { id: 'd8-4', text: '  while (queue.length) { const node = queue.shift();' },
      { id: 'd8-5', text: '    node.neighbors.filter(n => !visited.has(n)).forEach(n => { visited.add(n); queue.push(n); }); } }' },
    ],
  },
  {
    title: 'Рейд 9: Хвостова рекурсія',
    description: 'Що таке tail call optimization (TCO)?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd9-A',
    blocks: [
      { id: 'd9-A', text: 'A. Оптимізація, що дозволяє рекурсивному виклику в хвостовій позиції не додавати новий кадр стека' },
      { id: 'd9-B', text: 'B. Компіляція рекурсії в цикл автоматично для всіх функцій' },
      { id: 'd9-C', text: 'C. Мемоізація результатів рекурсії' },
      { id: 'd9-D', text: 'D. Обмеження глибини стека до 10 рівнів' },
    ],
  },
  {
    title: 'Рейд 10: Generator зупинка',
    description: 'Склади нескінченний generator, що БЕЗПЕЧНО генерує числа:',
    type: 'SORTING',
    correctOrder: 'd10-1,d10-2,d10-3,d10-4',
    blocks: [
      { id: 'd10-1', text: 'function* counter(start = 0) {' },
      { id: 'd10-2', text: '  while (true) {' },
      { id: 'd10-3', text: '    yield start++;' },
      { id: 'd10-4', text: '  }\n}' },
    ],
  },
  {
    title: 'Рейд 11: Mutex у JS',
    description: 'Як уникнути race condition при одночасних async операціях у Node.js?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd11-D',
    blocks: [
      { id: 'd11-A', text: 'A. Використати process.lock()' },
      { id: 'd11-B', text: 'B. Обгорнути в setImmediate' },
      { id: 'd11-C', text: 'C. Node.js однопотоковий — race conditions неможливі' },
      { id: 'd11-D', text: 'D. Використати черги (queue) або async-mutex бібліотеку' },
    ],
  },
  {
    title: 'Рейд 12: Memoize рекурсії',
    description: 'Склади мемоізований варіант Fibonacci:',
    type: 'SORTING',
    correctOrder: 'd12-1,d12-2,d12-3,d12-4',
    blocks: [
      { id: 'd12-1', text: 'const memo = new Map();' },
      { id: 'd12-2', text: 'function fib(n) {' },
      { id: 'd12-3', text: '  if (memo.has(n)) return memo.get(n);' },
      { id: 'd12-4', text: '  const result = n <= 1 ? n : fib(n-1) + fib(n-2);\n  memo.set(n, result);\n  return result; }' },
    ],
  },
  // HARD
  {
    title: 'Рейд 13: Порядок черги мікрозавдань',
    description: 'В якому порядку виконаються логи?\n\nasync function a() {\n  console.log("A1");\n  await null;\n  console.log("A2");\n}\na();\nconsole.log("B");',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd13-C',
    blocks: [
      { id: 'd13-A', text: 'A. A1, A2, B' },
      { id: 'd13-B', text: 'B. B, A1, A2' },
      { id: 'd13-C', text: 'C. A1, B, A2' },
      { id: 'd13-D', text: 'D. A2, A1, B' },
    ],
  },
  {
    title: 'Рейд 14: Deadlock у Promise',
    description: 'Чому цей код зависне навічно?\n\nconst p = new Promise(resolve => {\n  p.then(() => resolve(true));\n});',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd14-A',
    blocks: [
      { id: 'd14-A', text: 'A. p.then не може бути викликано поки p не resolved, а resolve залежить від p.then — дедлок' },
      { id: 'd14-B', text: 'B. Promise не можна вкладати самі в себе' },
      { id: 'd14-C', text: 'C. resolve очікує булеве значення' },
      { id: 'd14-D', text: 'D. Це нормальний код без проблем' },
    ],
  },
  {
    title: 'Рейд 15: requestAnimationFrame Цикл',
    description: 'Склади безпечний анімаційний цикл через rAF:',
    type: 'SORTING',
    correctOrder: 'd15-1,d15-2,d15-3,d15-4',
    blocks: [
      { id: 'd15-1', text: 'let rafId;' },
      { id: 'd15-2', text: 'function animate() {' },
      { id: 'd15-3', text: '  draw();\n  rafId = requestAnimationFrame(animate);' },
      { id: 'd15-4', text: '}\nrafId = requestAnimationFrame(animate);\n// cleanup: cancelAnimationFrame(rafId)' },
    ],
  },
  {
    title: 'Рейд 16: Стек vs Черга',
    description: 'DFS використовує стек, BFS — чергу. Яка структура дає LIFO поведінку?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd16-B',
    blocks: [
      { id: 'd16-A', text: 'A. Queue (черга)' },
      { id: 'd16-B', text: 'B. Stack (стек)' },
      { id: 'd16-C', text: 'C. Linked List' },
      { id: 'd16-D', text: 'D. Set' },
    ],
  },
  {
    title: 'Рейд 17: Async Iterator',
    description: 'Склади async for-of цикл для читання рядків з файлу:',
    type: 'SORTING',
    correctOrder: 'd17-1,d17-2,d17-3',
    blocks: [
      { id: 'd17-1', text: 'const stream = fs.createReadStream("file.txt").setEncoding("utf8");' },
      { id: 'd17-2', text: 'for await (const chunk of stream) {' },
      { id: 'd17-3', text: '  process(chunk);\n}' },
    ],
  },
  {
    title: 'Рейд 18: Цикломатична складність',
    description: 'Що вимірює цикломатична складність коду?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd18-C',
    blocks: [
      { id: 'd18-A', text: 'A. Час виконання функції в мілісекундах' },
      { id: 'd18-B', text: "B. Використану пам'ять функції" },
      { id: 'd18-C', text: 'C. Кількість незалежних шляхів виконання (if, while, &&)' },
      { id: 'd18-D', text: 'D. Кількість рядків коду' },
    ],
  },
  {
    title: 'Рейд 19: Трамплін',
    description: 'Що таке trampoline-функція для уникнення stack overflow?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'd19-B',
    blocks: [
      { id: 'd19-A', text: 'A. Рекурсивна функція з мемоізацією' },
      { id: 'd19-B', text: 'B. Функція, що повторно викликає повернуту функцію в циклі, доки не отримає значення (не функцію)' },
      { id: 'd19-C', text: 'C. setTimeout-обгортка для рекурсії' },
      { id: 'd19-D', text: 'D. Патерн Observer для рекурсивних подій' },
    ],
  },
  {
    title: 'Рейд 20: Видалення взаємозалежних обробників',
    description: 'Склади правильний порядок видалення взаємозалежних обробників подій:',
    type: 'SORTING',
    correctOrder: 'd20-1,d20-2,d20-3',
    blocks: [
      { id: 'd20-1', text: 'emitter.removeAllListeners("data");' },
      { id: 'd20-2', text: 'emitter.removeAllListeners("error");' },
      { id: 'd20-3', text: 'emitter.removeAllListeners("end");' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Бос 3: Червоний Демон (Kernel Panic) — 17 нових питань
// ─────────────────────────────────────────────────────────────────────────────
const demonPuzzles: PuzzleData[] = [
  // EASY
  {
    title: 'Рейд 4: Що таке XSS?',
    description: 'Що означає Cross-Site Scripting (XSS) атака?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm4-B',
    blocks: [
      { id: 'dm4-A', text: 'A. Зупинка серверу через надмірне навантаження' },
      { id: 'dm4-B', text: 'B. Впровадження шкідливого JS у веб-сторінку через ненадійний ввід' },
      { id: 'dm4-C', text: 'C. Перехоплення HTTPS трафіку' },
      { id: 'dm4-D', text: 'D. Повільний SQL-запит' },
    ],
  },
  {
    title: 'Рейд 5: CSRF Токен',
    description: 'Для чого використовується CSRF токен?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm5-A',
    blocks: [
      { id: 'dm5-A', text: 'A. Захист від підробки запитів від імені аутентифікованого користувача' },
      { id: 'dm5-B', text: 'B. Шифрування паролів у базі даних' },
      { id: 'dm5-C', text: 'C. Прискорення REST API запитів' },
      { id: 'dm5-D', text: 'D. Верифікація JWT підпису' },
    ],
  },
  {
    title: 'Рейд 6: bcrypt Хешування',
    description: 'Склади правильний порядок хешування пароля за допомогою bcrypt:',
    type: 'SORTING',
    correctOrder: 'dm6-1,dm6-2,dm6-3',
    blocks: [
      { id: 'dm6-1', text: 'const saltRounds = 10;' },
      { id: 'dm6-2', text: 'const salt = await bcrypt.genSalt(saltRounds);' },
      { id: 'dm6-3', text: 'const hash = await bcrypt.hash(password, salt);' },
    ],
  },
  {
    title: 'Рейд 7: HTTP vs HTTPS',
    description: 'Яка головна різниця між HTTP і HTTPS?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm7-C',
    blocks: [
      { id: 'dm7-A', text: 'A. HTTPS швидший за HTTP' },
      { id: 'dm7-B', text: 'B. HTTPS дозволяє передавати файли' },
      { id: 'dm7-C', text: 'C. HTTPS шифрує трафік за допомогою TLS/SSL' },
      { id: 'dm7-D', text: 'D. HTTPS тільки для API, HTTP для веб-сторінок' },
    ],
  },
  // MEDIUM
  {
    title: 'Рейд 8: Rate Limiting',
    description: 'Склади middleware для rate limiting за допомогою express-rate-limit:',
    type: 'SORTING',
    correctOrder: 'dm8-1,dm8-2,dm8-3,dm8-4',
    blocks: [
      { id: 'dm8-1', text: 'import rateLimit from "express-rate-limit";' },
      { id: 'dm8-2', text: 'const limiter = rateLimit({' },
      { id: 'dm8-3', text: '  windowMs: 15 * 60 * 1000, max: 100' },
      { id: 'dm8-4', text: '});\napp.use(limiter);' },
    ],
  },
  {
    title: 'Рейд 9: JWT Структура',
    description: 'З яких 3 частин складається JWT токен?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm9-B',
    blocks: [
      { id: 'dm9-A', text: 'A. Username, Password, Expiry' },
      { id: 'dm9-B', text: 'B. Header, Payload, Signature (розділені крапками)' },
      { id: 'dm9-C', text: 'C. Public Key, Private Key, Algorithm' },
      { id: 'dm9-D', text: 'D. Session ID, User ID, CSRF token' },
    ],
  },
  {
    title: 'Рейд 10: Helmet.js',
    description: 'Склади код підключення helmet.js для захисту Express додатку:',
    type: 'SORTING',
    correctOrder: 'dm10-1,dm10-2,dm10-3',
    blocks: [
      { id: 'dm10-1', text: 'import helmet from "helmet";' },
      { id: 'dm10-2', text: 'const app = express();' },
      { id: 'dm10-3', text: 'app.use(helmet());' },
    ],
  },
  {
    title: 'Рейд 11: Sensitive Data Exposure',
    description: 'Що з наведеного НІКОЛИ не варто зберігати у відкритому вигляді в БД?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm11-D',
    blocks: [
      { id: 'dm11-A', text: 'A. Email адреса' },
      { id: 'dm11-B', text: 'B. Username' },
      { id: 'dm11-C', text: 'C. Created_at дата' },
      { id: 'dm11-D', text: 'D. Пароль користувача' },
    ],
  },
  {
    title: 'Рейд 12: Environment Variables',
    description: 'Склади правильний порядок завантаження .env файлу у Node.js:',
    type: 'SORTING',
    correctOrder: 'dm12-1,dm12-2,dm12-3',
    blocks: [
      { id: 'dm12-1', text: 'import dotenv from "dotenv";' },
      { id: 'dm12-2', text: 'dotenv.config();' },
      { id: 'dm12-3', text: 'const secret = process.env.JWT_SECRET;' },
    ],
  },
  // HARD
  {
    title: 'Рейд 13: SQL Injection вектори',
    description: 'Яка з наступних вразливостей НЕ є різновидом SQL Injection?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm13-C',
    blocks: [
      { id: 'dm13-A', text: 'A. UNION-based injection' },
      { id: 'dm13-B', text: 'B. Blind boolean injection' },
      { id: 'dm13-C', text: 'C. DOM Clobbering' },
      { id: 'dm13-D', text: 'D. Time-based injection' },
    ],
  },
  {
    title: 'Рейд 14: Content Security Policy',
    description: "Склади CSP заголовок, що дозволяє тільки власні скрипти (no inline):",
    type: 'SORTING',
    correctOrder: 'dm14-1,dm14-2',
    blocks: [
      { id: 'dm14-1', text: "res.setHeader('Content-Security-Policy'," },
      { id: 'dm14-2', text: "  \"default-src 'self'; script-src 'self'\");" },
    ],
  },
  {
    title: 'Рейд 15: OWASP Top 10',
    description: 'Яка вразливість очолює OWASP Top 10 2021?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm15-A',
    blocks: [
      { id: 'dm15-A', text: 'A. Broken Access Control' },
      { id: 'dm15-B', text: 'B. SQL Injection' },
      { id: 'dm15-C', text: 'C. XSS (Cross-Site Scripting)' },
      { id: 'dm15-D', text: 'D. Insecure Deserialization' },
    ],
  },
  {
    title: 'Рейд 16: Timing Attack',
    description: 'Чому для порівняння хешів паролів треба використовувати crypto.timingSafeEqual, а не ===?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm16-B',
    blocks: [
      { id: 'dm16-A', text: 'A. === не підтримує Buffer порівняння' },
      { id: 'dm16-B', text: 'B. === зупиняється при першому неспівпадаючому байті, час відповіді розкриває довжину співпадіння' },
      { id: 'dm16-C', text: 'C. timingSafeEqual швидший' },
      { id: 'dm16-D', text: 'D. Немає різниці між ними' },
    ],
  },
  {
    title: 'Рейд 17: Refresh Token Ротація',
    description: 'Склади правильний порядок видачі нового access token через refresh token:',
    type: 'SORTING',
    correctOrder: 'dm17-1,dm17-2,dm17-3,dm17-4',
    blocks: [
      { id: 'dm17-1', text: 'const { refreshToken } = req.cookies;' },
      { id: 'dm17-2', text: 'const payload = jwt.verify(refreshToken, REFRESH_SECRET);' },
      { id: 'dm17-3', text: "const newAccessToken = jwt.sign({ id: payload.id }, ACCESS_SECRET, { expiresIn: '15m' });" },
      { id: 'dm17-4', text: 'res.json({ accessToken: newAccessToken });' },
    ],
  },
  {
    title: 'Рейд 18: SSRF Атака',
    description: 'Що таке Server-Side Request Forgery (SSRF)?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm18-C',
    blocks: [
      { id: 'dm18-A', text: 'A. XSS через серверний рендеринг' },
      { id: 'dm18-B', text: 'B. Підробка відповіді API сервера' },
      { id: 'dm18-C', text: 'C. Змушення сервера робити запити до внутрішньої мережі або довільних URL' },
      { id: 'dm18-D', text: 'D. DDoS атака через форми' },
    ],
  },
  {
    title: 'Рейд 19: Secure Cookie',
    description: 'Склади правильне встановлення безпечної cookie з HttpOnly та Secure:',
    type: 'SORTING',
    correctOrder: 'dm19-1,dm19-2',
    blocks: [
      { id: 'dm19-1', text: 'res.cookie("session", token, {' },
      { id: 'dm19-2', text: "  httpOnly: true, secure: true, sameSite: 'strict' });" },
    ],
  },
  {
    title: 'Рейд 20: Privilege Escalation',
    description: 'Яка перевірка запобігає горизонтальній ескалації привілеїв (доступ до чужих даних)?',
    type: 'MULTIPLE_CHOICE',
    correctOrder: 'dm20-D',
    blocks: [
      { id: 'dm20-A', text: 'A. Перевірка що req.user.role === "ADMIN"' },
      { id: 'dm20-B', text: 'B. Rate limiting' },
      { id: 'dm20-C', text: 'C. JWT підпис' },
      { id: 'dm20-D', text: 'D. Порівняння resource.ownerId === req.user.id перед поверненням даних' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ГОЛОВНА ФУНКЦІЯ
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Починаємо додавання нових питань до босів...\n');

  const bossMap: Record<string, PuzzleData[]> = {
    'Зелений Жнець (Memory Leak)': resolveIds(reaperPuzzles),
    'Уроборос (Infinite Loop)': resolveIds(dragonPuzzles),
    'Червоний Демон (Kernel Panic)': resolveIds(demonPuzzles),
  };

  try {
    for (const [bossName, puzzles] of Object.entries(bossMap)) {
      const boss = await prisma.boss.findFirst({ where: { name: bossName } });

      if (!boss) {
        console.error(`Боса "${bossName}" не знайдено. Запустіть seed.ts спочатку.`);
        continue;
      }

      const existingCount = await prisma.puzzle.count({ where: { bossId: boss.id } });
      console.log(`${bossName}: поточна кількість питань = ${existingCount}`);

      let added = 0;
      for (const puzzleData of puzzles) {
        const exists = await prisma.puzzle.findFirst({
          where: { bossId: boss.id, title: puzzleData.title },
        });
        if (exists) {
          console.log(`  Вже існує: "${puzzleData.title}"`);
          continue;
        }

        await prisma.puzzle.create({
          data: {
            title: puzzleData.title,
            description: puzzleData.description,
            type: puzzleData.type,
            bossId: boss.id,
            correctOrder: puzzleData.correctOrder,
            blocks: { create: puzzleData.blocks },
          },
        });
        console.log(`  Додано: "${puzzleData.title}"`);
        added++;
      }

      const newCount = await prisma.puzzle.count({ where: { bossId: boss.id } });
      console.log(`  Тепер: ${newCount} питань (додано ${added})\n`);
    }

    console.log('Готово! Всі нові питання додано до босів.');
  } catch (err) {
    console.error('Помилка:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
