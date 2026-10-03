// src/components/AxisControl.jsx

import React, { useState, useRef } from "react";

export default function AxisControl({
  axisMode,
  range,
  setMode,
  updateRange,
  applyCurrentViewRange,
  guideVisible,
  toggleGuide
}) {
  const [pos, setPos] = useState({ x: 740, y: 100 });

  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      className="axis-control"
      ref={dragRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{ left: pos.x, top: pos.y }}
    >
      <h4 className="axis-control-title">表示範囲設定</h4>

      {/* X軸 */}
      <div className="axis-block">
        <span>X軸：</span>

        <label htmlFor="x-auto" style={{ marginLeft: 6 }}>
          <input
            id="x-auto"
            type="radio"
            name="x-axis-mode"
            checked={axisMode.x === "auto"}
            onChange={() => setMode("x", "auto")}
          />
          自動
        </label>

        <label htmlFor="x-manual" style={{ marginLeft: 10 }}>
          <input
            id="x-manual"
            type="radio"
            name="x-axis-mode"
            checked={axisMode.x === "manual"}
            onChange={() => setMode("x", "manual")}
          />
          手動
        </label>

        <div className="axis-input-row">
          <label htmlFor="x-min" style={{ display: "none" }}>X最小</label>
          <input
            id="x-min"
            type="number"
            placeholder="最小"
            value={range.xMin}
            disabled={axisMode.x === "auto"}
            onChange={(e) => updateRange("xmin", e.target.value)}
          />

          <label htmlFor="x-max" style={{ display: "none" }}>X最大</label>
          <input
            id="x-max"
            type="number"
            placeholder="最大"
            value={range.xMax}
            disabled={axisMode.x === "auto"}
            onChange={(e) => updateRange("xmax", e.target.value)}
          />
        </div>
      </div>

      {/* Y軸 */}
      <div className="axis-block">
        <span>Y軸：</span>

        <label htmlFor="y-auto" style={{ marginLeft: 6 }}>
          <input
            id="y-auto"
            type="radio"
            name="y-axis-mode"
            checked={axisMode.y === "auto"}
            onChange={() => setMode("y", "auto")}
          />
          自動
        </label>

        <label htmlFor="y-manual" style={{ marginLeft: 10 }}>
          <input
            id="y-manual"
            type="radio"
            name="y-axis-mode"
            checked={axisMode.y === "manual"}
            onChange={() => setMode("y", "manual")}
          />
          手動
        </label>

        <div className="axis-input-row">
          <label htmlFor="y-min" style={{ display: "none" }}>Y最小</label>
          <input
            id="y-min"
            type="number"
            placeholder="最小"
            value={range.yMin}
            disabled={axisMode.y === "auto"}
            onChange={(e) => updateRange("ymin", e.target.value)}
          />

          <label htmlFor="y-max" style={{ display: "none" }}>Y最大</label>
          <input
            id="y-max"
            type="number"
            placeholder="最大"
            value={range.yMax}
            disabled={axisMode.y === "auto"}
            onChange={(e) => updateRange("ymax", e.target.value)}
          />
        </div>
      </div>

      <button onClick={applyCurrentViewRange}>
        現在の表示範囲を反映
      </button>

      <button
        onClick={toggleGuide}
        className={guideVisible ? "guide-on" : ""}
      >
        補正ガイド {guideVisible ? "オン" : "オフ"}
      </button>
    </div>
  );
}

