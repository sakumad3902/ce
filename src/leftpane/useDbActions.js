// src/leftpane/useDbActions.js
import { openMenu } from "../utils/openMenu";
import { tagManager } from "../api/tagManager";

export function useDbActions({
  ui,
  headerNames,
  selectedOrder,
  setSelectedOrder,
  dbFilter,
  api
}) {
  // ui から必要な state を展開
  const {
    contextMenu,
    setContextMenu,

    // edit modal
    setEditName,
    setEditComment,
    setEditTags,
    setEditDate,
    setEditTarget,
    setShowEditModal,
    tagValueLocal,
    tagSuggestions,
    setTagSuggestions,

    // modal position
    modalPos,
    setModalPos,

    // move modal
    showMoveSelectedModal,
    setShowMoveSelectedModal,
    moveSelectedIds,
    setMoveSelectedIds,

    // delete modal
    showDeleteSelectedModal,
    setShowDeleteSelectedModal,
    deleteSelectedIds,
    setDeleteSelectedIds,

    // tag input
    setTagValueLocal,
  } = ui;

  /* ----------------------------------------
     1) 全選択
  ---------------------------------------- */
  const handleSelectionAll = () => {
    const alreadySelected = new Set(selectedOrder);
    const unselected = dbFilter.dbList
      .map(h => h.id)
      .filter(id => !alreadySelected.has(id));

    const already = selectedOrder.length;
    const remain = 30 - already;

    if (remain <= 0) {
      alert("選択できるのは最大 30 件までです");
      return;
    }

    const limited = unselected.slice(0, remain);
    setSelectedOrder(prev => [...prev, ...limited]);

    if (limited.length >= remain) {
      alert(`上限 30 件まで選択しました（${limited.length} 件追加）`);
    }

    setContextMenu(null);
  };

  /* ----------------------------------------
     2) 並び替え
  ---------------------------------------- */
  const reorderSelected = (activeId, overId) => {
    if (!overId || activeId === overId) return;

    setSelectedOrder(prev => {
      const oldIndex = prev.indexOf(activeId);
      const newIndex = prev.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const newOrder = [...prev];
      const moved = newOrder.splice(oldIndex, 1)[0];
      newOrder.splice(newIndex, 0, moved);
      return newOrder;
    });
  };

  const handleDragEndSelected = ({ active, over }) => {
    if (over) reorderSelected(active.id, over.id);
  };

  /* ----------------------------------------
     3) 右クリックメニュー
  ---------------------------------------- */
  const handleRightClickDb = (e, id) =>
    openMenu(e, "db", id, 180, 140, setContextMenu);

  const handleRightClickSelected = (e, id) =>
    openMenu(e, "selected", id, 180, 60, setContextMenu);

  /* ----------------------------------------
     4) ダブルクリック選択解除
  ---------------------------------------- */
  const handleDoubleClickSelected = (id) => {
    setSelectedOrder(prev => prev.filter(x => x !== id));
  };

  /* ----------------------------------------
     5) 全選択解除
  ---------------------------------------- */
  const handleClearSelectionAll = () => {
    setSelectedOrder([]);
    setContextMenu(null);
  };

  /* ----------------------------------------
     編集確定
  ---------------------------------------- */
  const handleEditConfirm = async () => {
    const series = ui.editTarget;
    if (!series) return;

    const tagIds = (ui.editTags || []).map(t => t.id);

    const res = await api.updateSeriesTags(series.id, tagIds);
    if (res?.status !== "OK") {
      alert("タグ更新に失敗しました");
      return;
    }

    // UI 更新：headerNames の tags を更新
    headerNames.set(prev =>
      prev.map(s =>
        s.id === series.id
          ? { ...s, tags: ui.editTags, tagSet: new Set(tagIds) }
          : s
      )
    );

    setShowEditModal(false);
  };

  /* ----------------------------------------
     統合編集モーダルを開く
  ---------------------------------------- */
  const openEditModal = async (series) => {
    if (!series) return;

    setEditTarget(series);
    setEditName(series.name);
    setEditComment(series.comment ?? "");
    setEditTags(series.tags ?? []);

    const allTags = await tagManager.getAllTags(api);
    setTagSuggestions(allTags);

    const ts = series.timestamp;
    const tsMs = ts && ts < 10_000_000_000 ? ts * 1000 : ts ?? Date.now();
    const yyyyMMdd = new Date(tsMs).toISOString().slice(0, 10);
    setEditDate(yyyyMMdd);

    setModalPos({ x: 300, y: 100 });
    setShowEditModal(true);
  };

  /* ----------------------------------------
     統合編集モーダルキャンセル
  ---------------------------------------- */
  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditTarget(null);

    setEditName("");
    setEditComment("");
    setEditTags([]);
    setEditDate("");

    setTagValueLocal("");
  };

  /* ----------------------------------------
     9) 選択移動
  ---------------------------------------- */
  const handleMoveSelected = () => {
    if (selectedOrder.length === 0) {
      alert("移動するデータが選択されていません");
      return;
    }

    const pos = contextMenu
      ? { x: contextMenu.x, y: contextMenu.y }
      : { x: 280, y: 40 };

    setMoveSelectedIds(selectedOrder);
    setModalPos(pos);
    setShowMoveSelectedModal(true);
    setContextMenu(null);
  };

  const handleMoveSelectedCancel = () => {
    setShowMoveSelectedModal(false);
    setMoveSelectedIds([]);
  };

  /* ----------------------------------------
     10) 選択削除
  ---------------------------------------- */
  const handleDeleteSelected = () => {
    if (selectedOrder.length === 0) {
      alert("削除するデータが選択されていません");
      return;
    }

    const pos = contextMenu
      ? { x: contextMenu.x, y: contextMenu.y }
      : { x: 280, y: 40 };

    setDeleteSelectedIds(selectedOrder);
    setModalPos(pos);
    setShowDeleteSelectedModal(true);
    setContextMenu(null);
  };

  const handleDeleteSelectedCancel = () => {
    setShowDeleteSelectedModal(false);
    setDeleteSelectedIds([]);
  };

  return {
    handleSelectionAll,
    reorderSelected,
    handleDragEndSelected,

    handleRightClickDb,
    handleRightClickSelected,

    handleDoubleClickSelected,
    handleClearSelectionAll,

    handleEditCancel,
    openEditModal,
    handleEditConfirm,

    handleMoveSelected,
    handleMoveSelectedCancel,

    handleDeleteSelected,
    handleDeleteSelectedCancel,
  };
}
