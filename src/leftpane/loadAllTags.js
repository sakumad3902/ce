// src/leftpane/loadAllTags.js

export async function loadAllTags(api, currentProject, setAllTags, setCategories) {
  if (!currentProject) return;

  try {
    // ① タグ一覧
    const tagList = await api.fetchTags();

    // ② カテゴリ一覧
    const categoryList = await api.fetchCategories();
    setCategories(categoryList);  // ← LeftPaneLogic の state に反映

    // ③ シリーズ一覧（タグ使用数の計算用）
    const seriesRes = await api.getSeriesWithCreator(currentProject);

    if (!seriesRes || !Array.isArray(seriesRes.series)) {
      console.error("シリーズ情報の取得に失敗:", seriesRes);
      return;
    }

    // ④ タグ使用数の計算
    const usageMap = {};
    for (const series of seriesRes.series) {
      for (const tag of series.tags) {
        usageMap[tag.id] = (usageMap[tag.id] || 0) + 1;
      }
    }

    // ⑤ enriched タグ（タグ＋使用数）
    const enriched = tagList.map(tag => ({
      ...tag,
      usage: usageMap[tag.id] || 0
    }));

    setAllTags(enriched);

  } catch (err) {
    console.error("タグ一覧のロードに失敗:", err);
  }
}
