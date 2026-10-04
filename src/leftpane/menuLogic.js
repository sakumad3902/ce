// src/leftpane/menuLogic.js
import { openMenu } from "../utils/openMenu";

export function buildMenuLogic({ ui, menuRef }) {

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

  const setupOutsideClickClose = () => {
    if (!ui.contextMenu) return;

    const close = (e) =>
      menuRef.current &&
      !menuRef.current.contains(e.target) &&
      ui.setContextMenu(null);

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  };

  return {
    openDbMenu,
    openProjectMenu,
    setupOutsideClickClose,
  };
}
