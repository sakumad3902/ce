// src/components/ZeroModeHandler.jsx
import { useEffect } from "react";

export default function ZeroModeHandler({
  zeroMode,
  chartCanvasRef,
  onZeroClick
}) {
  useEffect(() => {
    if (!zeroMode) return;
    if (!chartCanvasRef.current) return;

    const chart = chartCanvasRef.current.chart;
    if (!chart) return;

    // ゼロ補正モード開始時に cursorLine を初期化
    const cursorLine = chart.options.plugins.annotation.annotations.cursorLine;
    cursorLine.display = false;
    cursorLine.xMin = 0;
    cursorLine.xMax = 0;
    cursorLine.borderWidth = 1;
    chart.update("none");

    /* ------------------------------------------------------------
       マウス移動：縦線を追従
    ------------------------------------------------------------ */
    const handleMove = (e) => {
      const rect = chart.canvas.getBoundingClientRect();
      const xPixel = e.clientX - rect.left;

      const xScale = chart.scales.x;
      if (!xScale) return;

      const x = xScale.getValueForPixel(xPixel);
      if (!Number.isFinite(x)) return;

      cursorLine.display = true;
      cursorLine.xMin = x;
      cursorLine.xMax = x;

      chart.update("none");
    };

    /* ------------------------------------------------------------
       クリック：縦線を確定 → useCorrection に委譲
    ------------------------------------------------------------ */
    const handleClick = (e) => {
      const rect = chart.canvas.getBoundingClientRect();
      const xPixel = e.clientX - rect.left;

      const xScale = chart.scales.x;
      if (!xScale) return;

      const x = xScale.getValueForPixel(xPixel);
      if (!Number.isFinite(x)) return;

      cursorLine.display = true;
      cursorLine.borderWidth = 1;
      cursorLine.xMin = x;
      cursorLine.xMax = x;

      chart.update("none");

      // useCorrection の handleZeroClick を呼ぶ
      onZeroClick(x);
    };

    const canvas = chart.canvas;
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("click", handleClick);

    /* ------------------------------------------------------------
       cleanup：イベント解除 & 縦線を消す
    ------------------------------------------------------------ */
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("click", handleClick);

      cursorLine.display = false;
      chart.update("none");
    };
  }, [zeroMode, chartCanvasRef, onZeroClick]);

  return null;
}
