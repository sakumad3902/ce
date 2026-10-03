export function parseDateCell(rawValue, now) {
  let timestamp = now;
  if (!rawValue) return timestamp;

  let raw = String(rawValue).trim();

  raw = raw
    .replace(/"/g, "")          // ダブルクォート除去
    .replace(/[^\x00-\x7F]/g, "/")
    .replace(/\s+/g, " ")       // 時刻のスペースは保持
    .replace(/\/+/g, "/");

  // ① UNIX 秒（10桁）
  if (/^\d{10}$/.test(raw)) {
    return parseInt(raw, 10);
  }

  // ② Excel シリアル値（整数 or 小数）
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = parseFloat(raw);
    const excelBase = 25569;
    const unix = (serial - excelBase) * 86400;
    if (!isNaN(unix) && unix > 0) {
      return Math.floor(unix);
    }
  }

  // ③ YYYY/MM/DD HH:MM:SS（日時・秒あり）
  let m = raw.match(
    /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/
  );
  if (m) {
    const parsed = new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      parseInt(m[4], 10),
      parseInt(m[5], 10),
      parseInt(m[6], 10)
    );
    if (!isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }

  // ④ YYYY/MM/DD HH:MM（秒なし）
  m = raw.match(
    /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\s+(\d{1,2}):(\d{1,2})$/
  );
  if (m) {
    const parsed = new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10),
      parseInt(m[4], 10),
      parseInt(m[5], 10),
      0
    );
    if (!isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }

  // ⑤ ISO 形式（YYYY-MM-DDTHH:MM:SS(.sss)?(Z)?) 
  // 例: 2026-09-04T11:22:06
  //     2026-09-04T11:22:06.123
  //     2026-09-04T11:22:06Z
  //     2026-09-04T11:22
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }

  // ⑥ YYYY/M/D（時刻なし）
  m = raw.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) {
    const parsed = new Date(
      parseInt(m[1], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[3], 10)
    );
    if (!isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }

  // ⑦ M/D/YY（短い日付形式）
  m = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/);
  if (m) {
    const parsed = new Date(
      2000 + parseInt(m[3], 10),
      parseInt(m[1], 10) - 1,
      parseInt(m[2], 10)
    );
    if (!isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }

  // ⑧ M/D/YY HH:MM（短い日付 + 時刻・秒なし）
  m = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})\s+(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const year = 2000 + parseInt(m[3], 10);   // 26 → 2026
    const month = parseInt(m[1], 10) - 1;     // JS 月は 0 始まり
    const day = parseInt(m[2], 10);
    const hour = parseInt(m[4], 10);
    const min = parseInt(m[5], 10);

    const parsed = new Date(year, month, day, hour, min, 0);
    if (!isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }

  return timestamp;
}
