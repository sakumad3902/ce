// src/leftpane/menuLogic.js
import { openMenu } from "../utils/openMenu";

export function buildMenuLogic({ ui, menuRef }) {

  const openDbMenu = (e, id) =>
    openMenu(e, "dbMenu", id, 240, 180, ui.setContextMenu);

  const openProjectMenu = (e, projectId, projectName) =>
    openMenu(e, "projectMenu", projectId, 240, 180, ui.setContextMenu, {
      project_id: projectId,
      name: projectName,
    });

  return {
    openDbMenu,
    openProjectMenu,
  };
}
