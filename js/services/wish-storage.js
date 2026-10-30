const KEY = 'holy-merry:wishes:v1';
export const MAX_WISHES = 60;
export function readWishes() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.wishes) || data.wishes.length > MAX_WISHES) throw new Error('Invalid wish storage');
  const valid = data.wishes.every(wish =>
    typeof wish.id === 'string' && typeof wish.nickname === 'string' && wish.nickname.trim().length > 0 && wish.nickname.length <= 20 &&
    typeof wish.content === 'string' && wish.content.trim().length > 0 && wish.content.length <= 300 &&
    typeof wish.createdAt === 'string' && Number.isFinite(Date.parse(wish.createdAt))
  );
  if (!valid) throw new Error('Invalid wish data');
  return data.wishes;
}
export function saveWishes(wishes) {
  if (wishes.length > MAX_WISHES) throw new Error('Wish limit exceeded');
  localStorage.setItem(KEY, JSON.stringify({ version: 1, wishes }));
}
