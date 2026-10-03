// src/leftpane/loadAllTags.js

export async function loadAllTags(api, currentProject, setAllTags) {
  if (!currentProject) return;

  try {
    const tagList = await api.fetchTags();
    const seriesRes = await api.getSeriesWithCreator(currentProject);

    if (!seriesRes || !Array.isArray(seriesRes.series)) {
      console.error("シリーズ情報の取得に失敗:", seriesRes);
      return;
    }

    const usageMap = {};
    for (const series of seriesRes.series) {
      for (const tag of series.tags) {
        usageMap[tag.id] = (usageMap[tag.id] || 0) + 1;
      }
    }

    const enriched = tagList.map(tag => ({
      ...tag,
      usage: usageMap[tag.id] || 0
    }));

    setAllTags(enriched);
  } catch (err) {
    console.error("タグ一覧のロードに失敗:", err);
  }
}
