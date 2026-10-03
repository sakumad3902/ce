// src/rightpane/RightPaneLogic.js
import { useCallback } from "react";

export function useRightPaneLogic({
  selectedOrder,
  api,
  zeroApplied,
  yApplied,
  xyApplied,
  lastZeroX,
  lastRange,
  currentSheet,
  axisMode,
  axisRange
}) {

  /* ----------------------------------------
     Excel Export
  ---------------------------------------- */
  const handleExportExcel = useCallback(async () => {
    if (!selectedOrder.length) {
      alert("データが選択されていません");
      return;
    }

    const ok = await api.onExportExcel({
      selectedOrder,
      zeroApplied,
      yApplied,
      xyApplied,
      lastZeroX,
      lastRange,
      currentSheet,
      axisMode,
      axisRange
    });

    if (!ok) {
      alert("Excel 出力に失敗しました");
    }
  }, [
    selectedOrder,
    api,
    zeroApplied,
    yApplied,
    xyApplied,
    lastZeroX,
    lastRange,
    currentSheet,
    axisMode,
    axisRange
  ]);

  /* ----------------------------------------
     Evaluate Series
  ---------------------------------------- */
  const handleEvaluate = useCallback(async () => {
    if (!selectedOrder.length) {
      alert("データが選択されていません");
      return;
    }

    const ok = await api.onEvaluateSeries({
      selectedOrder,
      zeroApplied,
      yApplied,
      xyApplied,
      lastZeroX,
      lastRange,
      currentSheet,
      axisMode,
      axisRange
    });

    if (!ok) {
      alert("波形評価に失敗しました");
    }
  }, [
    selectedOrder,
    api,
    zeroApplied,
    yApplied,
    xyApplied,
    lastZeroX,
    lastRange,
    currentSheet,
    axisMode,
    axisRange
  ]);

  return {
    handleExportExcel,
    handleEvaluate
  };
}
