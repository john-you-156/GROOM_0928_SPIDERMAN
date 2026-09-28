const BACKGROUND = './assets/backgrounds/hawaii-korean-woman-v4.webp';

export function shareTextFor(quote) {
  return `“${quote.text}”\n— ${quote.attribution || '비공식 창작 문장'} · ${quote.theme || '이웃의 지혜'}\n\n알로하, 이웃의 지혜`;
}

export async function shareQuote(quote) {
  const text = shareTextFor(quote);
  if (navigator.share) {
    try { await navigator.share({ title: '알로하, 이웃의 지혜', text }); return 'shared'; }
    catch (error) { if (error.name === 'AbortError') return 'cancelled'; }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}

export async function downloadQuoteCard(quote) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  const image = await loadImage(BACKGROUND);
  const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scale, height = image.height * scale;
  ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(6,10,20,.24)'); gradient.addColorStop(.45, 'rgba(6,10,20,.54)'); gradient.addColorStop(1, 'rgba(6,10,20,.95)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffc76a'; ctx.font = '700 28px sans-serif'; ctx.fillText('ALOHA · DAILY WISDOM', 92, 116);
  ctx.fillStyle = '#fffdf7'; ctx.font = '700 58px Georgia, serif';
  const lines = wrapText(ctx, quote.text, 890);
  const lineHeight = 88; let y = 420 - Math.max(0, lines.length - 4) * 30;
  for (const line of lines) { ctx.fillText(line, 92, y); y += lineHeight; }
  ctx.fillStyle = '#ffc76a'; ctx.font = '700 30px sans-serif'; ctx.fillText(`# ${quote.theme || '이웃의 지혜'}`, 92, y + 35);
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '24px sans-serif'; ctx.fillText('비공식 창작 문장 · 공식 작품 대사가 아닙니다', 92, 1250);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${quote.id}-hawaii.png`; link.click(); URL.revokeObjectURL(link.href);
}

function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
function wrapText(ctx, text, maxWidth) { const chars = [...text]; const lines = []; let line = ''; for (const char of chars) { const test = line + char; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = char; } else line = test; } if (line) lines.push(line); return lines; }
