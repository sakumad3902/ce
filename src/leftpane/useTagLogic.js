// src/leftpane/useTagLogic.js

import { useState, useEffect, useMemo } from "react";
import { loadAllTags } from "./loadAllTags";

export function useTagLogic({ api, currentProject, ui }) {
  const [allTags, setAllTags] = useState([]);
  const [categories, setCategories] = useState([]);

  /* ----------------------------------------
     1) 全タグ・カテゴリのロード
  ---------------------------------------- */
  useEffect(() => {
    loadAllTags(api, currentProject, setAllTags, setCategories);
  }, [currentProject]);

  /* ----------------------------------------
     2) タグ候補（検索＋カテゴリ絞り込み）
  ---------------------------------------- */
  const sortedTagSuggestions = useMemo(() => {
    if (!Array.isArray(allTags)) return [];

    const keyword = (ui.tagFilter ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFKC");

    return allTags
      .filter(tag => {
        const name = tag.name.toLowerCase().normalize("NFKC");
        const matchName = name.includes(keyword);

        const matchCategory =
          ui.tagCategoryFilter == null ||
          tag.category_id === Number(ui.tagCategoryFilter);

        return matchName && matchCategory;
      })
      .sort((a, b) => (b.usage || 0) - (a.usage || 0));
  }, [allTags, ui.tagFilter, ui.tagCategoryFilter]);

  /* ----------------------------------------
     3) タグ選択トグル
  ---------------------------------------- */
  const toggleEditTag = (tag) => {
    ui.setEditTags(prev => {
      const exists = prev.some(t => t.id === tag.id);
      return exists
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag];
    });
  };

  /* ----------------------------------------
     4) タグ作成
  ---------------------------------------- */
  async function createTag({ name, normalized_name, category_id }) {
    const res = await api.createTag(name, normalized_name, category_id);

    if (res?.status !== "OK" || !res.tag_id) {
      alert("タグ作成に失敗しました");
      return;
    }

    const newTag = {
      id: Number(res.tag_id),
      name,
      normalized_name,
      category_id
    };

    setAllTags(prev => [...prev, newTag]);
    ui.setEditTags(prev => [...prev, newTag]);
  }

  /* ----------------------------------------
     5) タグ編集（高速版：部分更新）
  ---------------------------------------- */
  async function updateTag({ id, newName, normalized_name, category_id }) {
    const res = await api.updateTag(id, newName, normalized_name, category_id);

    if (res?.status !== "OK") {
      alert("タグ名の更新に失敗しました");
      return;
    }

    setAllTags(prev =>
      prev.map(t =>
      t.id === id
        ? { ...t, name: newName, normalized_name, category_id }
        : t
      )
    );

    ui.setShowEditTagDialog(false);
  }

  /* ----------------------------------------
     6) 未使用タグ削除
  ---------------------------------------- */
  async function openDeleteUnusedTagDialog() {
    const unused = await api.fetchUnusedTags();
    ui.setUnusedTags(unused);
    ui.setSelectedUnusedTagIds([]);
    ui.setShowDeleteUnusedTagDialog(true);
  }

  function toggleUnusedTagSelection(tagId) {
    ui.setSelectedUnusedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }

  
  async function handleDeleteUnusedTagsOk() {
    const ids = ui.selectedUnusedTagIds;

    if (!ids.length) {
      alert("削除するタグが選択されていません");
      return;
    }

    const res = await api.deleteTags(ids);

    if (res.status === "OK") {
      alert(`${res.deleted_count} 件の未使用タグを削除しました`);

      setAllTags(prev => prev.filter(t => !ids.includes(t.id)));

      ui.setShowDeleteUnusedTagDialog(false);
      ui.setSelectedUnusedTagIds([]);
    } else {
      alert("削除に失敗: " + res.reason);
    }
  }

  /* ----------------------------------------
     7) editTags を allTags に同期
  ---------------------------------------- */
  useEffect(() => {
    ui.setEditTags(prev =>
      prev
        .map(tag => allTags.find(t => t.id === tag.id) || tag)
        .filter(tag => allTags.some(t => t.id === tag.id))
    );
  }, [allTags]);

  /* ----------------------------------------
     返却
  ---------------------------------------- */
  return {
    allTags,
    categories,
    sortedTagSuggestions,
    toggleEditTag,
    createTag,
    updateTag,
    openDeleteUnusedTagDialog,
    toggleUnusedTagSelection,
    handleDeleteUnusedTagsOk,
    setTagFilter: ui.setTagFilter
  };
}
