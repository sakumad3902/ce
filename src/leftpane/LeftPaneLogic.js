// src/leftpane/LeftPaneLogic.js

import { useState, useEffect, useRef, useMemo } from "react";
import { useLeftPaneUIState } from "./useLeftPaneUIState";
import { loadAllTags } from "./loadAllTags";
import { useDbFilter } from "./useDbFilter";
import { useProjectFilter } from "./useProjectFilter";
import { useDbActions } from "./useDbActions";
import { useProjectActions } from "./useProjectActions";
import { buildProjectModalActions } from "./projectModalActions";
import { buildSelectedList } from "./buildSelectedList";
import { buildViewerActions } from "../utils/viewerActions";
import { openMenu } from "../utils/openMenu";

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
  const [allTags, setAllTags] = useState([]); //全タグ用の空配列定義

  /* ----------------------------------------
    0) 全タグ一覧のロード（Tag テーブル全件）
  ---------------------------------------- */
  useEffect(() => {
    loadAllTags(api, currentProject, setAllTags);
  }, [currentProject]);

  /* ----------------------------------------
     1) refs
  ---------------------------------------- */
  const dbListRef = useRef(null);
  const selectedListRef = useRef(null);
  const menuRef = useRef(null);
  const projectMenuRef = useRef(null);

  /* ----------------------------------------
     2) フィルタ
  ---------------------------------------- */
  const dbFilter = useDbFilter({ headerNames, selectedOrder, currentProjectRef, allTags });
  const projectFilter = useProjectFilter({ projectList, setOpenProject });

  /* ----------------------------------------
     3) UI state（useLeftPaneUIState に集約）
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
     4) 選択中データ（UI表示用に整形）
  ---------------------------------------- */
  const selectedList = useMemo(() => {
    return buildSelectedList(selectedOrder, originalSeries, projectList);
  }, [selectedOrder, originalSeries, projectList]);

  /* ----------------------------------------
     5) 左ペインロジック
  ---------------------------------------- */
  const openDbMenu = (e, id) =>
    openMenu(e, "dbMenu", id, 240, 180, ui.setContextMenu);

  const openProjectMenu = (e, projectId, projectName) => {
    ui.setContextMenu({
      type: "projectMenu",
      x: e.clientX,
      y: e.clientY,
      targetId: projectId,
      project_id: projectId,
      name: projectName,
    });
  };

  const toggleSeries = (id) => {
    setSelectedOrder(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 30
          ? [...prev, id]
          : (alert("選択できるのは最大 30 件までです。"), prev)
    );
    if (setOpenSelected) setOpenSelected(true);
  };

  const clearSelectionAndReload = () => {
    setSelectedOrder([]);
    dbFilter.applyAllCorrections?.();
    if (setOpenSelected) setOpenSelected(false);
  };

  const clearAllSelectionAndReload = () => {
    setSelectedOrder(headerNames.map(h => h.id));
    dbFilter.applyAllCorrections?.();
    if (setOpenSelected) setOpenSelected(false);
  };

  /* ----------------------------------------
     6) 装置、DBアクション
  ---------------------------------------- */
  const projectActions = useProjectActions({ ui });
  const dbActions = useDbActions({ ui, headerNames, selectedOrder, setSelectedOrder, dbFilter, api });

  /* ----------------------------------------
     7) 装置モーダル OK 処理
  ---------------------------------------- */
  const projectModalActions = buildProjectModalActions({
    ui,
    projectList,
    reloadProjects,
    api,
    setSelectedProject,
    setOpenProject
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
    10) タグ候補の並び替え
  ---------------------------------------- */
  const sortedTagSuggestions = useMemo(() => {
    if (!Array.isArray(allTags)) return [];
    return [...allTags]
      .sort((a, b) => (b.usage || 0) - (a.usage || 0))
  }, [allTags]);

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
  async function createTag({ name, normalized_name }) {
    const res = await api.createTag(name, normalized_name);

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
  async function updateTag({ id, newName, normalized_name }) {
    const res = await api.updateTag(id, newName, normalized_name);

    if (res?.status !== "OK") {
      alert("タグ名の更新に失敗しました");
      return;
    }

    // UI 更新
    setAllTags(prev =>
      prev.map(t => t.id === id ? { ...t, name: newName } : t)
    );

    // 編集モーダルを閉じる
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

      // 全タグ再ロード
      await loadAllTags(api, currentProject, setAllTags);

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
        // ① existingTags（= allTags）から最新のタグ情報を反映
        .map(tag => allTags.find(t => t.id === tag.id) || tag)
        // ② 削除されたタグを editTags から除外
        .filter(tag => allTags.some(t => t.id === tag.id))
    );
  }, [allTags]);
  
  /* ----------------------------------------
     15) 外側クリックでメニュー閉じる
  ---------------------------------------- */
  useEffect(() => {
    if (!ui.contextMenu) return;

    const close = (e) =>
      menuRef.current &&
      !menuRef.current.contains(e.target) &&
      ui.setContextMenu(null);

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [ui.contextMenu]);

  /* ----------------------------------------
     返却
  ---------------------------------------- */
  return {
    ...dbFilter,
    ...projectFilter,

    dbList: dbFilter.dbList,
    selectedList,
    dbListRef,
    selectedListRef,
    menuRef,
    projectMenuRef,
    projectList,
    selectedProject,

    toggleSeries,
    clearSelectionAndReload,
    clearAllSelectionAndReload,

    ...dbActions,
    ...projectActions,
    ...projectModalActions,
    ...viewerActions,

    openDbMenu,
    openProjectMenu,

    handleMoveSelectedOk,
    handleDeleteSelectedOk,

    handleEditOk,
    sortedTagSuggestions,
    toggleEditTag,
    setTagFilter,
  
    allTags,
    createTag,
    updateTag,
    
    toggleUnusedTagSelection,
    openDeleteUnusedTagDialog,
    handleDeleteUnusedTagsOk,

    ...ui
  };
}
