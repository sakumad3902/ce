// src/leftpane/useProjectLogic.js

import { useProjectFilter } from "./useProjectFilter";
import { useProjectActions } from "./useProjectActions";
import { buildProjectModalActions } from "./projectModalActions";

export function useProjectLogic({
  api,
  projectList,
  reloadProjects,
  selectedProject,
  setSelectedProject,
  setOpenProject,
  ui
}) {
  /* ----------------------------------------
     1) プロジェクトフィルタ
  ---------------------------------------- */
  const projectFilter = useProjectFilter({
    projectList,
    setOpenProject
  });

  /* ----------------------------------------
     2) プロジェクトアクション（右クリックメニュー）
  ---------------------------------------- */
  const projectActions = useProjectActions({ ui });

  /* ----------------------------------------
     3) プロジェクトモーダル OK 処理
  ---------------------------------------- */
  const projectModalActions = buildProjectModalActions({
    ui,
    projectList,
    reloadProjects,
    setSelectedProject,
    setOpenProject,
    api
  });

  /* ----------------------------------------
     返却
  ---------------------------------------- */
  return {
    /* 1) フィルタ結果 */
    ...projectFilter,

    /* 2) アクション */
    ...projectActions,
    ...projectModalActions,

    /* 3) 選択中プロジェクト */
    projectList,
    selectedProject
  };
}
