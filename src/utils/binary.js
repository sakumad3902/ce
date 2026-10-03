// src/utils/binary.js

/* ============================================================
   base64 → Float32Array
============================================================ */
export function decodeFloat32FromBase64(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

/* ============================================================
   Float32Array → base64
============================================================ */
export function encodeFloat32ToBase64(f32) {
  const bytes = new Uint8Array(f32.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/* ============================================================
   series[] → packed(base64) + lengths
============================================================ */
export function packSeriesToBinary(series) {
  const lengths = series.map(s => s.x.length);
  const total = lengths.reduce((a, b) => a + b, 0) * 2;

  const buf = new Float32Array(total);
  let offset = 0;

  series.forEach(s => {
    const n = s.x.length;
    buf.set(s.x, offset);
    buf.set(s.y, offset + n);
    offset += n * 2;
  });

  const packed = encodeFloat32ToBase64(buf);
  return { packed, lengths };
}
