// src/leftpane/Modal.jsx
import { useEffect, useRef, useState } from "react";
import { adjustPos } from "../utils/adjustPos";

export default function Modal({
  title,
  children,
  onCancel,
  onOk,
  okText = "OK",
  cancelText = "Cancel",
  x = null,
  y = null,
  pad = 10
}) {
  const boxRef = useRef(null);

  // 初期位置をそのまま使う（中央に出さない）
  const [pos, setPos] = useState(
    x !== null && y !== null
      ? { left: x, top: y }
      : { left: null, top: null }
  );

  useEffect(() => {
    if (x === null || y === null) return;

    const box = boxRef.current;
    if (!box) return;

    const menuW = box.offsetWidth;
    const menuH = box.offsetHeight;

    const { x: newX, y: newY } = adjustPos({
      x,
      y,
      menuW,
      menuH,
      pad,
    });

    // 初期位置から補正位置へ「上書き」するだけ
    setPos({ left: newX, top: newY });
  }, [x, y, pad]);

  const boxStyle =
    pos.left !== null && pos.top !== null
      ? { position: "absolute", left: pos.left, top: pos.top }
      : {};

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        ref={boxRef}
        className="modal-box"
        style={boxStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="modal-title">{title}</div>}

        <div className="modal-content">{children}</div>

        <div className="modal-buttons">
          <button onClick={onCancel}>{cancelText}</button>
          <button onClick={onOk}>{okText}</button>
        </div>
      </div>
    </div>
  );
}
