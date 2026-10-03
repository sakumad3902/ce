// src/hooks/useAppState.js
import { useState, useEffect } from "react";

export default function useAppState() {
  /* ============================================================
     ① originalSeries（React 側キャッシュ）
  ============================================================ */
  const [originalSeries, setOriginalSeries] = useState([]);

  /* ============================================================
     選択済みリスト
  ============================================================ */
  const [selectedList, setSelectedList] = useState([]);
  /* ============================================================
     FloatingSelected の開閉状態
  ============================================================ */
  const [openSelected, setOpenSelected] = useState(false);

  /* ============================================================
     ② ヘッダー
  ============================================================ */
  const [headerNames, setHeaderNames] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState([]);

  /* ============================================================
     ③ 系列メタ情報
  ============================================================ */
  const [seriesMeta, setSeriesMeta] = useState([]);

  /* ============================================================
     ④ 補正状態
  ============================================================ */
  const [zeroApplied, setZeroApplied] = useState(false);
  const [yApplied, setYApplied] = useState(false);
  const [xyApplied, setXyApplied] = useState(false);

  const [lastZeroX, setLastZeroX] = useState(null);
  const [lastRange, setLastRange] = useState({ x1: null, x2: null });

  /* ============================================================
     ⑤ 表示モード
  ============================================================ */
  const [currentSheet, setCurrentSheet] = useState("original");

  /* ============================================================
     ⑥ 補正モード（UI）
  ============================================================ */
  const [zeroMode, setZeroMode] = useState(false);
  const [rangeMode, setRangeMode] = useState(false);

  /* ============================================================
     ⑦ UI 状態
  ============================================================ */
  const [modeBannerVisible, setModeBannerVisible] = useState(false);
  const [modeText, setModeText] = useState("");
  const [uiLocked, setUiLocked] = useState(false);

  /* ============================================================
     ⑧ 補正結果キャッシュ
  ============================================================ */
  const [correctedZero, setCorrectedZero] = useState([]);
  const [correctedY, setCorrectedY] = useState([]);
  const [correctedXY, setCorrectedXY] = useState([]);

  /* ============================================================
     ⑨ originalSeries の lengths
  ============================================================ */
  const [lengths, setLengths] = useState([]);

  /* ============================================================
     ⑩ originalSeries の packed(base64)
  ============================================================ */
  const [originalPacked, setOriginalPacked] = useState(null);

  /* ============================================================
     軸モード（localStorage 永続化）
  ============================================================ */
  const [axisMode, setAxisMode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("axisMode")) || {
        x: "auto",
        y: "auto"
      };
    } catch {
      return { x: "auto", y: "auto" };
    }
  });

  /* ============================================================
     表示範囲（localStorage 永続化）
  ============================================================ */
  const [axisRange, setAxisRange] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("axisRange")) || {
        xMin: null,
        xMax: null,
        yMin: null,
        yMax: null
      };
    } catch {
      return { xMin: null, xMax: null, yMin: null, yMax: null };
    }
  });

  /* ============================================================
     localStorage に保存
  ============================================================ */
  useEffect(() => {
    localStorage.setItem("axisMode", JSON.stringify(axisMode));
  }, [axisMode]);

  useEffect(() => {
    localStorage.setItem("axisRange", JSON.stringify(axisRange));
  }, [axisRange]);

  return {
    /* original キャッシュ */
    originalSeries, setOriginalSeries,
    
    /* 選択済みリスト */
    selectedList, setSelectedList,

    /* フロート開閉 */
    openSelected, setOpenSelected,

    /* ヘッダー */
    headerNames, setHeaderNames,
    selectedOrder, setSelectedOrder,

    /* メタ情報 */
    seriesMeta, setSeriesMeta,

    /* 補正状態 */
    zeroApplied, setZeroApplied,
    yApplied, setYApplied,
    xyApplied, setXyApplied,

    lastZeroX, setLastZeroX,
    lastRange, setLastRange,

    /* 表示モード */
    currentSheet, setCurrentSheet,

    /* 補正モード（UI） */
    zeroMode, setZeroMode,
    rangeMode, setRangeMode,

    /* UI 状態 */
    modeBannerVisible, setModeBannerVisible,
    modeText, setModeText,
    uiLocked, setUiLocked,

    /* 補正キャッシュ */
    correctedZero, setCorrectedZero,
    correctedY, setCorrectedY,
    correctedXY, setCorrectedXY,

    /* originalSeries の補助情報 */
    lengths, setLengths,
    originalPacked, setOriginalPacked,

    /* Excel 出力用（軸設定） */
    axisMode, setAxisMode,
    axisRange, setAxisRange
  };
}
