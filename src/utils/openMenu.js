// src/leftpane/utils/openMenu.js
import { adjustPos } from "./adjustPos";

export function openMenu(
  e,
  type,
  targetId,
  menuW,
  menuH,
  setContextMenu,
  extra = {}
) {
  e.preventDefault();

  const { x, y } = adjustPos({
    x: e.clientX,
    y: e.clientY,
    menuW,
    menuH,
    pad: 10,
  });

  setContextMenu({
    type,
    x,
    y,
    targetId,
    ...extra,
  });
}
