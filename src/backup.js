export function exportBackup(userData) {
  const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), favorites: userData.favorites, theme: userData.theme };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `aloha-wisdom-backup-${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function parseBackup(file, validIds) {
  const value = JSON.parse(await file.text());
  if (value.schemaVersion !== 1 || !Array.isArray(value.favorites)) throw new Error('지원하지 않는 백업 형식이에요.');
  const imported = [...new Set(value.favorites.filter(id => validIds.has(id)))];
  const theme = ['system', 'light', 'dark'].includes(value.theme) ? value.theme : null;
  return { favorites: imported, theme };
}
