//src/api/tagManager.js

export const tagManager = {
  
  async getAllTags(apiClient) {
    const reply = await apiClient.fetchTags();
    if (!Array.isArray(reply)) return [];
    return reply.map(t => ({ id: t.id, name: t.name }));
  },

  async createTag(apiClient, name, normalized_name) {
    return await apiClient.createTag(name, normalized_name);
  },

  async updateTag(apiClient, tag_id, name, normalized_name) {
    return await apiClient.updateTag(tag_id, name, normalized_name);
  },

  /*
   * 高速タグ検索のため、src/api/loadHeader.js で
   * headerNames の各 Series に tagSet を追加済　
   */

  searchByTags(tagIds, headerNames, projectId, mode = "AND") {
    if (!projectId) return [];
    if (!Array.isArray(tagIds) || tagIds.length === 0) return [];

    // tagIds を number に統一
    const normalizedTagIds = tagIds.map(id => Number(id));

    const seriesInProject = headerNames.filter(
      s => s.project_id === projectId
    );

    return seriesInProject.filter(s => {
      const tagSet = s.tagSet;
      if (!tagSet) return false;

      // tagSet も number に統一
      const normalizedTagSet = new Set(
        [...tagSet].map(id => Number(id))
      );

      if (mode === "AND") {
        return normalizedTagIds.every(id => normalizedTagSet.has(id));
      }

      if (mode === "OR") {
        return normalizedTagIds.some(id => normalizedTagSet.has(id));
      }

      return false;
    });
  }
};
