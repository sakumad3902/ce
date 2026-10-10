import { post } from "./http";

export async function loadHeaderApi(project_id) {

  // ① Series メタ情報（tags入り）
  const metaData = await post("get_series_with_creator", { project_id });
  const metaSeries = Array.isArray(metaData?.series)
    ? metaData.series.map(s => ({ ...s, project_id }))
    : [];

  const metaMap = new Map(metaSeries.map(s => [s.id, s]));

  // ② 波形データ（packed float32）
  const rawData = await post("load", { project_id });

  // rawData.raw は base64
  const rawBytes = Uint8Array.from(atob(rawData.raw), c => c.charCodeAt(0));
  const f32 = new Float32Array(rawBytes.buffer);

  const lengths = rawData.lengths;

  // ③ packed を x,y に展開
  let offset = 0;
  const waveSeries = [];

  for (let i = 0; i < lengths.length; i++) {
    const n = lengths[i];

    const x = f32.slice(offset, offset + n);
    const y = f32.slice(offset + n, offset + n + n);

    offset += n * 2;

    const meta = metaMap.get(rawData.series[i].id) || {};

    waveSeries.push({
      id: rawData.series[i].id,
      name: meta.name,
      timestamp: meta.timestamp,
      comment: meta.comment,
      x,
      y,
      tags: meta.tags || [],
      project_id
    });
  }

  // ④ tagSet を付ける
  const merged = waveSeries.map(ws => {
    ws.tagSet = new Set((ws.tags || []).map(t => t.id));
    return ws;
  });

  return merged;
}
