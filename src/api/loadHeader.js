// src/api/loadHeader.js

import { post } from "./http";
import { parseSeries } from "./parseSeries";

export async function loadHeaderApi(project_id) {

  // ① Series メタ情報（ここに tags が入っている）
  const metaData = await post("get_series_with_creator", { project_id });

  const metaSeries = Array.isArray(metaData?.series)
    ? metaData.series.map(s => ({ ...s, project_id }))
    : [];

  // ② 波形データ（tags は入っていない）
  const rawData = await post("load", { project_id });
  const waveSeries = parseSeries(rawData?.series || []).map(s => ({ ...s, project_id }));

  // ③ JOIN（tagSet を付ける）
  const merged = waveSeries.map(ws => {
    const meta = metaSeries.find(ms => ms.id === ws.id) || {};

    const series = { ...ws, ...meta };
    series.tagSet = new Set((series.tags || []).map(t => t.id));

    return series;
  });

  return merged;
}