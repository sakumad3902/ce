// src/leftpane/useSeriesLogic.js

import { useMemo } from "react";
import { useDbFilter } from "./useDbFilter";
import { useDbActions } from "./useDbActions";
import { buildSelectedList } from "./buildSelectedList";
import { buildSelectionStateLogic } from "./selectionStateLogic";
import { buildViewerActions } from "../utils/viewerActions";

export function useSeriesLogic({
  api,
  loadHeader,
  headerNames,
  setHeaderNames,
  originalSeries,
  selectedOrder,
  setSelectedOrder,
  currentProjectRef,
  projectList,
  ui,
  allTags
}) {
  /* ----------------------------------------
     1) DB フィルタ（シリーズ一覧のフィルタ）
  ---------------------------------------- */
  const dbFilter = useDbFilter({
    headerNames,
    selectedOrder,
    currentProjectRef,
    allTags
  });

  /* ----------------------------------------
     1) DB アクション
  ---------------------------------------- */
  const dbActions = useDbActions({
    ui,
    headerNames,
    selectedOrder,
    setSelectedOrder,
    dbFilter,
    api
  });

  /* ----------------------------------------
     2) 選択状態ロジック
  ---------------------------------------- */
  const selectionStateLogic = buildSelectionStateLogic({
    setSelectedOrder,
    dbFilter,
    setOpenSelected: ui.setOpenSelected
  });

  /* ----------------------------------------
     3) 選択中データ（UI表示用）
  ---------------------------------------- */
  const selectedList = useMemo(() => {
    return buildSelectedList(selectedOrder, originalSeries, projectList);
  }, [selectedOrder, originalSeries, projectList]);

  /* ----------------------------------------
     4) Viewer 起動
  ---------------------------------------- */
  const viewerActions = buildViewerActions({
    projectList,
    currentProject: currentProjectRef.current,
    headerNames
  });

  /* ----------------------------------------
     5) 編集モーダル OK（シリーズ編集）　※部分更新
  ---------------------------------------- */
  const handleEditOk = async () => {
    const h = ui.editTarget;
    if (!h) return;

    const newName = (ui.editName ?? "").trim();
    if (!newName) return alert("名前が空です");

    const newComment = (ui.editComment ?? "").trim();
    const safeTags = Array.isArray(ui.editTags) ? ui.editTags : [];
    const newTagIds = safeTags.map(t => t.id).filter(id => id != null);

    const newTimestamp = ui.editDate
      ? Math.floor(new Date(ui.editDate).getTime() / 1000)
      : 0;

    // --- 編集 API 呼び出し ---
    await api.renameSeries(h.id, newName);
    await api.updateComment(h.id, newComment);
    await api.updateSeriesTags({ series_id: h.id, tagIds: newTagIds });
    await api.updateTimestamp(h.id, newTimestamp);

    // --- ★ 部分更新：シリーズ1件だけ最新化 ---
    const updated = await api.getSeriesById(h.id);

    if (updated?.status === "OK" && updated.series) {
      setHeaderNames(prev =>
        prev.map(s =>
          s.id === updated.series.id ? updated.series : s
        )
      );
    } else {
      console.warn("部分更新失敗 → fallback getSeriesById");
      const fallback = await api.getSeriesById(h.id);

      if (fallback?.status === "OK" && fallback.series) {
        setHeaderNames(prev =>
          prev.map(s =>
            s.id === fallback.series.id ? fallback.series : s
          )
        );
      }
    }

    ui.setShowEditModal(false);
  };

  /* ----------------------------------------
     6) 選択データの移動
  ---------------------------------------- */
  const handleMoveSelectedOk = async () => {
    if (!ui.moveSelectedIds.length) return;
    if (!ui.moveTargetProjectId) {
      return alert("移動先が未選択です");
    }

    const validIds = ui.moveSelectedIds.filter(id =>
      originalSeries.some(s => s.id === id)
    );

    const ok = await api.onMoveSelected(validIds, ui.moveTargetProjectId);
    if (ok) {
      alert("選択中データを全て移動しました");
      ui.setMoveSelectedIds([]);
    }
  };

  /* ----------------------------------------
     7) 選択データの削除
  ---------------------------------------- */
  const handleDeleteSelectedOk = async () => {
    if (!ui.deleteSelectedIds.length) return;

    const validIds = ui.deleteSelectedIds.filter(id =>
      originalSeries.some(s => s.id === id)
    );

    const ok = await api.onDeleteSelected(validIds);
    if (ok) {
      alert("選択中データを全て削除しました");
      ui.setDeleteSelectedIds([]);
    }
  };

  /* ----------------------------------------
     返却
  ---------------------------------------- */
  return {
    /* 1) フィルタ結果 */
    ...dbFilter,

    /* 2) DB アクション */
    ...dbActions,

    /* 3) 選択状態 */
    ...selectionStateLogic,

    /* 4) リスト */
    dbList: dbFilter.dbList,
    selectedList,

    /* 5) Viewer */
    ...viewerActions,

    /* 6) 編集 */
    handleEditOk,

    /* 7) 移動・削除 */
    handleMoveSelectedOk,
    handleDeleteSelectedOk
  };
}
