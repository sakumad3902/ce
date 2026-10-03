// src/components/RangeModeHandler.jsx
import { useEffect } from "react";

export default function RangeModeHandler({
  rangeMode,
  chartCanvasRef,
  onRangeSelect
}) {
  useEffect(() => {
    if (!rangeMode) return;
    if (!chartCanvasRef.current) return;

    const chart = chartCanvasRef.current.chart;
    if (!chart) return;

    const canvas = chart.canvas;

    let dragging = false;
    let startX = null;

    /* ============================================================
       プレビュー用の box annotation を初期化
    ============================================================ */
    const ann = chart.options.plugins.annotation.annotations;

    ann.rangeBox = {
      type: "box",
      xMin: 0,
      xMax: 0,
      yMin: null,
      yMax: null,
      backgroundColor: "rgba(0, 180, 255, 0.18)",
      borderColor: "#00aaff",
      borderWidth: 1,
      display: false
    };

    chart.update("none");

    /* ============================================================
       ドラッグ開始
    ============================================================ */
    const handleMouseDown = (e) => {
      dragging = true;

      const rect = canvas.getBoundingClientRect();
      const xPixel = e.clientX - rect.left;

      const xScale = chart.scales.x;
      const x = xScale.getValueForPixel(xPixel);
      if (!Number.isFinite(x)) return;

      startX = x;

      ann.rangeBox.display = true;
      ann.rangeBox.xMin = x;
      ann.rangeBox.xMax = x;

      chart.update("none");
    };

    /* ============================================================
       ドラッグ中：プレビュー更新
    ============================================================ */
    const handleMouseMove = (e) => {
      if (!dragging) return;

      const rect = canvas.getBoundingClientRect();
      const xPixel = e.clientX - rect.left;

      const xScale = chart.scales.x;
      const x = xScale.getValueForPixel(xPixel);
      if (!Number.isFinite(x)) return;

      const x1 = Math.min(startX, x);
      const x2 = Math.max(startX, x);

      ann.rangeBox.display = true;
      ann.rangeBox.xMin = x1;
      ann.rangeBox.xMax = x2;

      chart.update("none");
    };

    /* ============================================================
       ドラッグ終了：確定 → useCorrection に委譲
    ============================================================ */
    const handleMouseUp = (e) => {
      if (!dragging) return;
      dragging = false;

      const rect = canvas.getBoundingClientRect();
      const xPixel = e.clientX - rect.left;

      const xScale = chart.scales.x;
      const endX = xScale.getValueForPixel(xPixel);
      if (!Number.isFinite(endX)) return;

      const x1 = Math.min(startX, endX);
      const x2 = Math.max(startX, endX);

      // プレビュー box を消す
      ann.rangeBox.display = false;
      chart.update("none");

      // useCorrection の handleRangeSelect を呼ぶ
      onRangeSelect(x1, x2);
    };

    /* ============================================================
       イベント登録
    ============================================================ */
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    /* ============================================================
       クリーンアップ
    ============================================================ */
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);

      if (ann.rangeBox) {
        ann.rangeBox.display = false;
        chart.update("none");
      }
    };
  }, [rangeMode, chartCanvasRef, onRangeSelect]);

  return null;
}
