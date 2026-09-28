const KEY = 'spider-quotes-user-data-v1';
const DEFAULTS = { schemaVersion: 1, favorites: [], theme: 'system', dailyAssignments: {} };

let memory = structuredClone(DEFAULTS);
let available = true;

export function loadUserData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(memory);
    const value = JSON.parse(raw);
    memory = sanitize(value);
  } catch (error) {
    available = false;
    console.warn('로컬 저장소를 사용할 수 없습니다.', error);
  }
  return structuredClone(memory);
}

export function saveUserData(value) {
  memory = sanitize(value);
  try { localStorage.setItem(KEY, JSON.stringify(memory)); }
  catch (error) { available = false; console.warn('설정을 저장하지 못했습니다.', error); }
  return structuredClone(memory);
}

export function resetUserData() {
  memory = structuredClone(DEFAULTS);
  try { localStorage.removeItem(KEY); } catch { available = false; }
  return structuredClone(memory);
}

export function storageAvailable() { return available; }

function sanitize(value = {}) {
  const favorites = Array.isArray(value.favorites) ? [...new Set(value.favorites.filter(id => typeof id === 'string'))] : [];
  const theme = ['system', 'light', 'dark'].includes(value.theme) ? value.theme : 'system';
  const dailyAssignments = value.dailyAssignments && typeof value.dailyAssignments === 'object' && !Array.isArray(value.dailyAssignments)
    ? Object.fromEntries(Object.entries(value.dailyAssignments).filter(([date, id]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof id === 'string')) : {};
  return { schemaVersion: 1, favorites, theme, dailyAssignments };
}
