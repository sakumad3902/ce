// src/api/parseSeries.js

import { decodeFloat32FromBase64 } from "../utils/binary";

export function parseSeries(items) {
  if (!items) return [];
  return items.map(item => {
    const f32 = decodeFloat32FromBase64(item.b64);
    const n = f32.length / 2;
    return {
      id: item.id,
      name: item.name,
      timestamp: item.timestamp,
      comment: item.comment,
      created_by: item.created_by,
      x: f32.slice(0, n),
      y: f32.slice(n)
    };
  });
}