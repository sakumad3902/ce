// src/leftpane/LeftPaneLogic.js

import { useState, useEffect, useRef, useMemo } from "react";
import { useLeftPaneUIState } from "./useLeftPaneUIState";
import { loadAllTags } from "./loadAllTags";
import { useDbFilter } from "./useDbFilter";
import { useProjectFilter } from "./useProjectFilter";
import { useDbActions } from "./useDbActions";
import { useProjectActions } from "./useProjectActions";
import { useCategoryActions } from "./useCategoryActions";
import { buildProjectModalActions } from "./projectModalActions";
import { buildSelectedList } from "./buildSelectedList";
import { buildSelectionStateLogic } from "./selectionStateLogic";
import { buildMenuLogic } from "./menuLogic";
import { buildViewerActions } from "../utils/viewerActions";

export function useLeftPaneLogic({
  loadHeader,
  headerNames,
  setHeaderNames,
  originalSeries,
  selectedOrder,
  setSelectedOrder,
  setOpenProject,
  setOpenSelected,

  selectedProject,
  setSelectedProject,
  currentProjectRef,

  reloadProjects,
  currentProject,
  projectList,
  api
}) {
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);

/* ----------------------------------------
  0) UI state（useLeftPaneUIState に集約）
---------------------------------------- */
const ui = useLeftPaneUIState();

const {
  editName, setEditName,
  editComment, setEditComment,
  editTags, setEditTags,
  editDate, setEditDate,
  editTarget, setEditTarget,
  showEditModal, setShowEditModal,
  tagValueLocal, setTagValueLocal,
  tagFilter, setTagFilter,
  showCreateTagDialog, setShowCreateTagDialog,
  showEditTagDialog, setShowEditTagDialog,
  editingTag, setEditingTag,
} = ui;

  /* ----------------------------------------
    1) 全タグ、全カテゴリーのロード
  ---------------------------------------- */
  useEffect(() => {
    loadAllTags(api, currentProject, setAllTags, setCategories);
  }, [currentProject]);

  /* ----------------------------------------
     2) refs
  ---------------------------------------- */
  const dbListRef = useRef(null);
  const selectedListRef = useRef(null);
  const menuRef = useRef(null);
  const projectMenuRef = useRef(null);

  /* ----------------------------------------
     3) フィルタ
  ---------------------------------------- */
  const dbFilter = useDbFilter({
    headerNames,
    selectedOrder,
    currentProjectRef,
    allTags
  });
  const projectFilter = useProjectFilter({ projectList, setOpenProject });

  /* ----------------------------------------
     4) メニュー・選択状態ロジック（外部化）
  ---------------------------------------- */
  const menuLogic = buildMenuLogic({ ui, menuRef });

  const selectionStateLogic = buildSelectionStateLogic({
    setSelectedOrder,
    dbFilter,
    setOpenSelected,
  });

  /* ----------------------------------------
     5) 選択中データ（UI表示用に整形）
  ---------------------------------------- */
  const selectedList = useMemo(() => {
    return buildSelectedList(selectedOrder, originalSeries, projectList);
  }, [selectedOrder, originalSeries, projectList]);

  /* ----------------------------------------
     6) 装置、DBアクション
  ---------------------------------------- */
  const projectActions = useProjectActions({ ui });
  const dbActions = useDbActions({
    ui,
    headerNames,
    selectedOrder,
    setSelectedOrder,
    dbFilter,
    api
  });

  const categoryActions = useCategoryActions({
    api,
    setCategories,
    ui,
    categories
  });

  /* ----------------------------------------
     7) 装置モーダル OK 処理
  ---------------------------------------- */
  const projectModalActions = buildProjectModalActions({
    ui,
    projectList,
    reloadProjects,
    setSelectedProject,
    setOpenProject,
    api,    
  });

  const handleMoveSelectedOk = async () => {
    if (!ui.moveSelectedIds.length) return;
    if (!ui.moveTargetProjectId) {
      return alert("移動先が未選択です");
    }
    const validIds = ui.moveSelectedIds.filter(id =>
      originalSeries.some(s => s.id === id)
    );
    const targetProjectId = ui.moveTargetProjectId;
    ui.setShowMoveSelectedModal(false);
    const ok = await api.onMoveSelected(validIds, targetProjectId);
    if (ok) {
      alert("選択中データを全て移動しました");
      ui.setMoveSelectedIds([]);
    }
  };

  const handleDeleteSelectedOk = async () => {
    if (!ui.deleteSelectedIds.length) return;
    const validIds = ui.deleteSelectedIds.filter(id =>
      originalSeries.some(s => s.id === id)
    );
    ui.setShowDeleteSelectedModal(false);
    const ok = await api.onDeleteSelected(validIds);
    if (ok) {
      alert("選択中データを全て削除しました");
      ui.setDeleteSelectedIds([]);
    }
  };

  /* ----------------------------------------
     8) Viewer 起動
  ---------------------------------------- */
  const viewerActions = buildViewerActions({
    projectList,
    currentProject,
    headerNames
  });

  /* ----------------------------------------
     9) 統合編集モーダルロジック
  ---------------------------------------- */
  const handleEditOk = async () => {
    const h = editTarget;
    if (!h) return;

    const newName = (editName ?? "").trim();
    if (!newName) return alert("名前が空です");

    const newComment = (editComment ?? "").trim();
    const safeTags = Array.isArray(editTags) ? editTags : [];
    const newTagIds = safeTags.map(t => t.id).filter(id => id != null);

    const newTimestamp = editDate
      ? Math.floor(new Date(editDate).getTime() / 1000)
      : 0;

    await api.renameSeries(h.id, newName);
    await api.updateComment(h.id, newComment);
    await api.updateSeriesTags({ series_id: h.id, tagIds: newTagIds });
    await api.updateTimestamp(h.id, newTimestamp);

    // 選択解除せず loadHeader → Tag 紐づけ更新
    await loadHeader({ resetSelection: false });

    setShowEditModal(false);
  };

  /* ----------------------------------------
      10) タグ候補の並び替え（検索＋カテゴリ絞り込み対応）
  ---------------------------------------- */
  const sortedTagSuggestions = useMemo(() => {
    if (!Array.isArray(allTags)) return [];

    const keyword = (tagFilter ?? "")
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
  }, [allTags, tagFilter, ui.tagCategoryFilter]);

  /* ----------------------------------------
      10.5) タグ選択トグル（再定義）
  ---------------------------------------- */
  const toggleEditTag = (tag) => {
    setEditTags(prev => {
      const exists = prev.some(t => t.id === tag.id);
      return exists
        ? prev.filter(t => t.id !== tag.id)
        : [...prev, tag];
    });
  };

  /* ----------------------------------------
      11) タグ作成
  ---------------------------------------- */
  async function createTag({ name, normalized_name, category_id }) {
    const res = await api.createTag(name, normalized_name, category_id);


    if (res?.status !== "OK" || !res.tag_id) {
      alert("タグ作成に失敗しました");
      return;
    }

    const newTag = { id: Number(res.tag_id), name };

    setAllTags(prev => [...prev, newTag]);
    setEditTags(prev => [...prev, newTag]);
  }

  /* ----------------------------------------
      12) タグ編集
  ---------------------------------------- */
  async function updateTag({ id, newName, normalized_name, category_id }) {
    const res = await api.updateTag(id, newName, normalized_name, category_id);

    if (res?.status !== "OK") {
      alert("タグ名の更新に失敗しました");
      return;
    }
    await loadAllTags(api, currentProject, setAllTags, setCategories);
    setShowEditTagDialog(false);
  }

  /* ----------------------------------------
      13) タグ削除
  ---------------------------------------- */
  async function openDeleteUnusedTagDialog() {
    const unused = await api.fetchUnusedTags();   // 未使用タグだけ取得
    ui.setUnusedTags(unused);
    ui.setSelectedUnusedTagIds([]);               // 初期化
    ui.setShowDeleteUnusedTagDialog(true);        // ダイアログ表示
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

      await loadAllTags(api, currentProject, setAllTags, setCategories);

      ui.setShowDeleteUnusedTagDialog(false);
      ui.setSelectedUnusedTagIds([]);
    } else {
      alert("削除に失敗: " + res.reason);
    }
  }

  /* ----------------------------------------
     14) タグ作成・編集後に editTags を同期
  ---------------------------------------- */
  useEffect(() => {
    setEditTags(prev =>
      prev
        .map(tag => allTags.find(t => t.id === tag.id) || tag)
        .filter(tag => allTags.some(t => t.id === tag.id))
    );
  }, [allTags]);

  /* ----------------------------------------
     15) 欄外クリックでモーダル閉じる
  ---------------------------------------- */  
  useEffect(() => {
    if (!ui.contextMenu) return;

    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        ui.setContextMenu(null);
      }
    };

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ui.contextMenu]);

  /* ----------------------------------------
     返却
  ---------------------------------------- */
  return {
    /* 1) フィルタ */
    ...dbFilter,
    ...projectFilter,

    /* 2) リスト */
    dbList: dbFilter.dbList,
    selectedList,

    /* 3) refs */
    dbListRef,
    selectedListRef,
    menuRef,
    projectMenuRef,

    /* 4) プロジェクト・選択状態 */
    projectList,
    selectedProject,

    /* 5) 外部化ロジック */
    ...selectionStateLogic,
    ...menuLogic,

    /* 6) DB / プロジェクト / モーダル / Viewer アクション */
    ...dbActions,
    ...projectActions,
    ...projectModalActions,
    ...viewerActions,

    /* 7) 選択系アクション */
    handleMoveSelectedOk,
    handleDeleteSelectedOk,

    /* 8) 編集モーダル */
    handleEditOk,

    /* 9) カテゴリ系 */
    categories,
    ...categoryActions,

    /* 10) タグ系 */
    sortedTagSuggestions,
    toggleEditTag,
    setTagFilter,
    allTags,
    createTag,
    updateTag,
    toggleUnusedTagSelection,
    openDeleteUnusedTagDialog,
    handleDeleteUnusedTagsOk,

    /* 11) UI state */
    ...ui
  };
}
