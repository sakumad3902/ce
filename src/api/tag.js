// src/api/tag.js

// comment から #タグ を抽出
export function extractTagsFromComment(comment) {
  if (!comment) return [];
  return comment.match(/#\S+/g) || [];
}

// 全 series からタグ一覧を抽出（重複除去）
export function extractAllTags(seriesList) {
  const tagSet = new Set();
  seriesList.forEach(s => {
    extractTagsFromComment(s.comment).forEach(tag => tagSet.add(tag));
  });
  return [...tagSet];
}

// タグ検索（AND 検索）
export function filterSeriesByTags(seriesList, tags) {
  if (!tags || tags.length === 0) return seriesList;
  return seriesList.filter(s =>
    tags.every(tag => s.comment?.includes(tag))
  );
}
