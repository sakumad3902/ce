// src/hooks/useChartController.js
import { useEffect, useRef, useMemo, useCallback } from "react";

export default function useChartController(state) {
  const {
    selectedOrder,          // id ベース（number 想定）
    currentSheet,           // "original" | "zero" | "y" | "xy"

    // original は React 側キャッシュ
    originalSeries,

    // 補正キャッシュ（useCorrection がセット）
    correctedZero,
    correctedY,
    correctedXY,

    // Excel 出力用
    setLengths,
    setOriginalPacked,

    // UI モード
    zeroMode,
    rangeMode
  } = state;

  const chartCanvasRef = useRef(null);

  /* ============================================================
     ① 現在の表示モードに応じて src を決定
  ============================================================ */
  const srcSeries = useMemo(() => {
    switch (currentSheet) {
      case "zero":
        return correctedZero ?? [];
      case "y":
        return correctedY ?? [];
      case "xy":
        return correctedXY ?? [];
      case "original":
      default:
        return originalSeries ?? [];
    }
  }, [currentSheet, originalSeries, correctedZero, correctedY, correctedXY]);

  /* ============================================================
     ② Chart.js 用 series[] を組み立てる
  ============================================================ */
  const seriesForChart = useMemo(() => {
    if (!srcSeries || srcSeries.length === 0) return [];

    const result = [];

    for (const id of selectedOrder) {
      const s = srcSeries.find((x) => x.id === id);
      if (!s) continue;

      const x = s.x ?? [];
      const y = s.y ?? [];
      const n = x.length;

      const data = new Array(n);
      for (let k = 0; k < n; k++) {
        data[k] = { x: x[k], y: y[k] };
      }

      result.push({
        name: s.name ?? `Series ${id}`,
        data
      });
    }

    return result;
  }, [srcSeries, selectedOrder]);


  /* ============================================================
     ③ 共通再描画関数
  ============================================================ */
  const refreshChart = useCallback(() => {
    const inst = chartCanvasRef.current;
    if (!inst || !inst.updateSeries) return;

    inst.updateSeries(seriesForChart);
  }, [seriesForChart]);

  /* ============================================================
     ④ seriesForChart が変わったら自動で再描画
  ============================================================ */
  useEffect(() => {
    refreshChart();
  }, [refreshChart]);

  /* ============================================================
     ⑤ originalSeries が更新されたときは lengths / packed を更新
  ============================================================ */
  useEffect(() => {
    if (!originalSeries || originalSeries.length === 0) return;

    // lengths
    const lengths = originalSeries.map((s) => s.x.length);
    setLengths(lengths);

    // packed(base64)
    const total = originalSeries.reduce(
      (sum, s) => sum + s.x.length * 2,
      0
    );
    const f32 = new Float32Array(total);

    let offset = 0;
    for (const s of originalSeries) {
      const n = s.x.length;
      f32.set(s.x, offset);
      f32.set(s.y, offset + n);
      offset += n * 2;
    }

    const bytes = new Uint8Array(f32.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const packed = btoa(binary);

    setOriginalPacked(packed);
  }, [originalSeries, setLengths, setOriginalPacked]);

  /* ============================================================
     ChartCanvas に渡すべき値を返す
  ============================================================ */
  return {
    chartCanvasRef,
    refreshChart,

    // UI モード
    zeroMode,
    rangeMode
  };
}
