// src/leftpane/LeftPaneLogic.js

import { useLeftPaneUIState } from "./useLeftPaneUIState";
import { useTagLogic } from "./useTagLogic";
import { useSeriesLogic } from "./useSeriesLogic";
import { useProjectLogic } from "./useProjectLogic";

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
  /* ----------------------------------------
     0) UI state（LeftPane 全体の UI 状態）
  ---------------------------------------- */
  const ui = useLeftPaneUIState();

  /* ----------------------------------------
     1) タグロジック（タグ一覧・候補・作成・編集）
  ---------------------------------------- */
  const tagLogic = useTagLogic({
    api,
    currentProject,
    ui
  });

  /* ----------------------------------------
     2) シリーズロジック（フィルタ・編集・Viewer）
        ※ loadHeader の副作用はここに集約
  ---------------------------------------- */
  const seriesLogic = useSeriesLogic({
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
    allTags: tagLogic.allTags
  });

  /* ----------------------------------------
     3) プロジェクトロジック（プロジェクト一覧・操作）
  ---------------------------------------- */
  const projectLogic = useProjectLogic({
    api,
    projectList,
    reloadProjects,
    selectedProject,
    setSelectedProject,
    setOpenProject,
    ui
  });

  /* ----------------------------------------
     返却（LeftPaneLogic は統合ハブとして機能）
  ---------------------------------------- */
  return {
    /* 1) シリーズ系 */
    ...seriesLogic,

    /* 2) タグ系 */
    ...tagLogic,

    /* 3) プロジェクト系 */
    ...projectLogic,

    /* 4) UI state */
    ...ui
  };
}
