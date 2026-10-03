export default function ContextMenu({ logic }) {
  const menuMap = {
    db: [
      { label: "一括選択（30件まで）", onClick: logic.handleSelectionAll },
      { label: "全て選択解除", onClick: logic.handleClearSelectionAll },
    ],
    selected: [
      { label: "全て選択解除", onClick: logic.handleClearSelectionAll },
    ],
    projectMenu: [
      { label: "名前変更", onClick: () => logic.handleProjectRename(logic.contextMenu.targetId) },
      { label: "削除", onClick: () => logic.handleProjectDelete(logic.contextMenu.targetId), danger: true },
    ],
  };

  const items = menuMap[logic.contextMenu.type] || [];

  return (
    <div
      ref={logic.menuRef}
      className="context-menu"
      style={{ top: logic.contextMenu.y, left: logic.contextMenu.x }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`context-menu-item ${item.danger ? "context-menu-danger" : ""}`}
          onClick={item.onClick}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
