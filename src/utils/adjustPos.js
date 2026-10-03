// 位置補正ユーティリティ（固定サイズ・可変サイズ両対応）
export function adjustPos({ x, y, menuW, menuH, pad = 10 }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let newX = x;
  let newY = y;

  if (newX + menuW + pad > vw) newX = vw - menuW - pad;
  if (newY + menuH + pad > vh) newY = vh - menuH - pad;

  return { x: newX, y: newY };
}
