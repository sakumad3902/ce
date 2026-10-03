import { useState, useEffect } from "react";

export default function FilterModal(props) {
  const {
    title,
    onCancel,
    onReset, 
    x,
    y,
    zIndex,
    children
  } = props;

  // モーダル位置（ドラッグで更新）
  const [pos, setPos] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const startDrag = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    });
  };

  return (
    <div
      className="filter-modal-window"
      style={{
        position: "absolute",
        top: pos.y,
        left: pos.x,
        zIndex: zIndex
      }}
    >
      <div
        className="modal-title"
        onMouseDown={startDrag} 
        style={{ cursor: "move" }}
      >
        {title}
      </div>

      <div className="modal-content">{children}</div>

      <div className="modal-buttons">
        <button onClick={onReset}>リセット</button>
        <button onClick={onCancel}>リセットして閉じる</button>
      </div>
    </div>
  );
}
