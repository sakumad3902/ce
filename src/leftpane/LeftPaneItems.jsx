// src/leftpane/LeftPaneItems.jsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ============================================
   Project Item
============================================ */
export function ProjectItem({
  project,
  isSelected,
  onSelect,
  logic,
}) {
  return (
    <div
      className={`leftpane-project-row ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="leftpane-row-main">
        <span className="leftpane-project-row-name">{project.name}</span>
        <div
          className="leftpane-btnarea"
          title="装置名変更、装置削除"        
          onClick={(e) => {
            e.stopPropagation();
            logic.openProjectMenu(e, project.project_id, project.name);
          }}
        >
          <img src="/icons/edit.png" className="leftpane-row-iconbtn" />
        </div>
      </div>

      {project.updated_at && (
        <div className="leftpane-row-sub">
          更新日：
          {new Date(project.updated_at * 1000).toLocaleDateString("ja-JP")}
          {"　"}
          更新者：{project.updated_by_username ?? "不明"}
        </div>
      )}
    </div>
  );
}

/* ============================================
   DB Item
============================================ */
export function DBItem({
  h,
  selectedOrder,
  toggleSeries,
  handleRightClickDb,
  logic
}) {
  const isSelected = selectedOrder.includes(h.id);

  return (
    <div
      className="leftpane-row"
      title={h.comment || ""}
      onClick={() => toggleSeries(h.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRightClickDb(e, h.id);
      }}
    >
      {/* 上段 */}
      <div className="leftpane-row-main">
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSeries(h.id)}
        />

        <span className="leftpane-row-name">{h.name}</span>

        <div
          className="leftpane-btnarea"
          title="データ編集"
          onClick={(e) => {
            e.stopPropagation();
            logic.openEditModal(h);
          }}
        >
          <img src="/icons/edit.png" className="leftpane-row-iconbtn" />
        </div>
      </div>

      {/* 中段：タグ表示 */}
      {h.tags && h.tags.length > 0 && (
        <div className="leftpane-row-tags">
          {h.tags.map(tag => (
            <span key={tag.id} className="leftpane-tag">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* 下段 */}
      {h.timestamp > 0 && (
        <div className="leftpane-row-sub">
          登録日：
          {new Date(h.timestamp * 1000).toLocaleDateString("ja-JP")}
          {"　"}
          登録者：{h.created_by_username}
        </div>
      )}
    </div>
  );
}


/* ============================================
   SortableItem
============================================ */
export function SortableItem({
  h,
  indexNumber,
  toggleSeries,
  handleRightClickSelected,
  handleDoubleClickSelected
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: h.id,
      animateLayoutChanges: () => false
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="leftpane-row"
      onClick={() => toggleSeries(h.id)}
      onDoubleClick={() => handleDoubleClickSelected(h.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRightClickSelected(e, h.id);
      }}
      {...attributes}
      {...listeners}
    >
      {/* 上段 */}
      <div className="leftpane-row-main">
        <span className="order-number">({indexNumber})</span>
        <span className="leftpane-row-name">{h.name}</span>
      </div>

      {/* 下段 */}
      {h.project_name && (
        <div className="leftpane-row-sub">
          【{h.project_name}】
        </div>
      )}
    </div>
  );
}
