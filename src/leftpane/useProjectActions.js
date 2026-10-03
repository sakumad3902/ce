// src/leftpane/useProjectActions.js

export function useProjectActions({ ui }) {
  const {
    contextMenu,
    setContextMenu,

    setShowProjectAppendModal,
    setNewProjectName,

    setShowProjectRenameModal,
    setProjectRenameValue,
    setProjectRenameTarget,

    setShowProjectDeleteModal,
    setProjectDeleteTarget,

    setModalPos,
  } = ui;

  /* ----------------------------------------
     1) 装置追加
  ---------------------------------------- */
  const handleProjectAppendClick = () => {
    const pos = contextMenu
      ? { x: contextMenu.x, y: contextMenu.y }
      : { x: 280, y: 40 };

    setModalPos(pos);
    setNewProjectName("");
    setShowProjectAppendModal(true);
  };

  /* ----------------------------------------
     2) 装置名前変更
  ---------------------------------------- */
  const handleProjectRename = () => {
    if (!contextMenu || contextMenu.type !== "projectMenu") return;

    const target_id = contextMenu.project_id ?? contextMenu.targetId;
    if (!target_id) return;

    const name = contextMenu.name ?? "";
    setProjectRenameTarget(target_id);
    setProjectRenameValue(name);

    const pos = contextMenu
      ? { x: contextMenu.x, y: contextMenu.y }
      : { x: 280, y: 40 };

    setModalPos(pos);
    setShowProjectRenameModal(true);
    setContextMenu(null);
  };

  const handleProjectRenameCancel = () => {
    setShowProjectRenameModal(false);
    setProjectRenameTarget(null);
    setProjectRenameValue("");
  };

  /* ----------------------------------------
     4) 装置削除
  ---------------------------------------- */
  const handleProjectDelete = () => {
    if (!contextMenu || contextMenu.type !== "projectMenu") return;

    const target_id = contextMenu.project_id ?? contextMenu.targetId;
    if (!target_id) return;

    setProjectDeleteTarget(target_id);

    const pos = contextMenu
      ? { x: contextMenu.x, y: contextMenu.y }
      : { x: 280, y: 40 };

    setModalPos(pos);
    setShowProjectDeleteModal(true);
    setContextMenu(null);
  };

  const handleProjectDeleteCancel = () => {
    setShowProjectDeleteModal(false);
    setProjectDeleteTarget(null);
  };

  return {
    handleProjectAppendClick,
    handleProjectRename,
    handleProjectRenameCancel,
    handleProjectDelete,
    handleProjectDeleteCancel,
  };
}
