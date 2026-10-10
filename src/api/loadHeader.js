import { post, API } from "./http";

export async function loadHeaderApi(project_id) {

  // ① Series メタ情報（tags入り）
  const metaData = await post("get_series_with_creator", { project_id });
  const metaSeries = metaData.series || [];
  const metaMap = new Map(metaSeries.map(s => [s.id, s]));

  // ② raw bytes の波形データ
  const res = await fetch(`${API}/load_raw`, {
    method: "POST",
    body: JSON.stringify({ project_id })
  });

  // ---- metaBase64 と rawBytes を body から分離する ----
  const buf = await res.arrayBuffer();
  const all = new Uint8Array(buf);

  // metaBase64 は body の先頭行（改行まで）
  let i = 0;
  while (i < all.length && all[i] !== 10) i++; // 10 = '\n'

  const metaBase64 = new TextDecoder().decode(all.slice(0, i));
  const rawBytes = all.slice(i + 1);

  const metaJson = atob(metaBase64);
  const meta = JSON.parse(metaJson);
  const lengths = meta.lengths;

  const f32 = new Float32Array(rawBytes.buffer);

  // ③ packed を x,y に展開
  let offset = 0;
  const waveSeries = [];

  for (let i = 0; i < lengths.length; i++) {
    const n = lengths[i];

    const x = f32.slice(offset, offset + n);
    const y = f32.slice(offset + n, offset + n + n);

    offset += n * 2;

    const meta = metaMap.get(metaSeries[i].id) || {};

    waveSeries.push({
      id: meta.id,
      name: meta.name,
      timestamp: meta.timestamp,
      comment: meta.comment,
      x,
      y,
      tags: meta.tags || [],
      project_id
    });
  }

  // ④ tagSet
  return waveSeries.map(ws => ({
    ...ws,
    tagSet: new Set(ws.tags.map(t => t.id))
  }));
}
