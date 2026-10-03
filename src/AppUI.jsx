// src/AppUI.jsx

import { Link } from "react-router-dom";
import { useState, useCallback } from "react";

import LeftPane from "./leftpane/LeftPane";
import ChartView from "./rightpane/ChartView";
import FloatingSelected from "./leftpane/FloatingSelected";

import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { useRightPaneLogic } from "./rightpane/RightPaneLogic";
import { getRoundedChartRange, isViewRangeSynced } from "./utils/chartRangeUtils";

import "./leftpane/css/LeftPane.css";
import "./rightpane/css/RightPane.css";
import "./auth/css/auth.css";

export default function AppUI(props) {
  const {
    /* 既存の UI 状態 */
    selectedOrder, setSelectedOrder,
    headerNames,
    setHeaderNames,
    modeBannerVisible, modeText, cancelMode,
    zeroApplied, yApplied, xyApplied,
    resetAll, startZeroMode, startRangeMode,
    currentSheet, setCurrentSheet,
    lastZeroX, lastRange,
    zeroMode, rangeMode,
    uiLocked,
    chartCanvasRef,
    axisMode, setAxisMode,
    axisRange, setAxisRange,
    isExporting,
    progress,
    api,
    username,
    onLogout,
    originalSeries
  } = props;

  /* ----------------------------------------
    フロート選択リスト表示の状態設定
  ---------------------------------------- */
  const [leftLogic, setLeftLogic] = useState(null); /*LeftPaneからロジック受取り */
  const handleLogicReady = useCallback((logic) => {
    setLeftLogic(logic);
  }, []);

  const [openSelected, setOpenSelected] = useState(false); /*マウスオン開閉 */

  /* ----------------------------------------
     RightPaneLogic
  ---------------------------------------- */
  const rightPane = useRightPaneLogic({
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
  });

  /* ----------------------------------------
     ガイド表示
  ---------------------------------------- */
  const [guideVisible, setGuideVisible] = useState(true);
  const toggleGuide = () => setGuideVisible(v => !v);
  const [showSyncNotice, setShowSyncNotice] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  /* ----------------------------------------
     現在のチャート範囲を適用
  ---------------------------------------- */
  const applyCurrentViewRange = useCallback(() => {
    const chart = chartCanvasRef.current?.chart;
    if (!chart) return;

    const newRange = getRoundedChartRange(chart);
    if (!newRange) return;

    setAxisRange(newRange);
    setAxisMode({ x: "manual", y: "manual" });

    setShowSyncNotice(true);
    setFadeOut(false);
    setTimeout(() => {
      setFadeOut(true);
    }, 2000);
    setTimeout(() => {
      setShowSyncNotice(false);
    }, 3000);

    chartCanvasRef.current.updateOriginalScaleLimits(newRange);
  }, [chartCanvasRef, setAxisRange, setAxisMode]);

  /* ----------------------------------------
     タブ表示
  ---------------------------------------- */
  const tabDefs = [
    { key: "original", label: "Original", enabled: true },
    { key: "zero", label: "Zero", enabled: zeroApplied },
    { key: "y", label: "Y", enabled: yApplied },
    { key: "xy", label: "XY", enabled: xyApplied }
  ];

  const tabs = (
    <>
      {tabDefs.map(t => (
        <button
          key={t.key}
          disabled={!t.enabled}
          className={currentSheet === t.key ? "btn-tab-active" : ""}
          onClick={() => t.enabled && setCurrentSheet(t.key)}
        >
          {t.label}
        </button>
      ))}
    </>
  );

  /* ----------------------------------------
     Layout（LeftPane / FloatingSelected / RightPane）
  ---------------------------------------- */
  return (
    <div id="container" className={uiLocked ? "ui-locked" : ""}>

      {/* 左ペイン */}
      <div
        id="leftPane"
        onMouseEnter={() => {
          if (leftLogic && leftLogic.selectedList.length > 0) {
            setOpenSelected(true);
          }
        }}
        onMouseLeave={(e) => {
          const leftPaneEl = document.getElementById("leftPane");
          const floatEl = document.getElementById("floatingSelectedWrapper");
          const rt = e.relatedTarget;
          if (!rt || !(rt instanceof Node)) {
            setOpenSelected(false);
            return;
          }
          if (leftPaneEl && leftPaneEl.contains(rt)) {
            return;
          }
          if (floatEl && floatEl.contains(rt)) {
            return;
          }
          setOpenSelected(false);
        }}
      >
        <LeftPane
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          headerNames={headerNames}
          setHeaderNames={setHeaderNames}
          originalSeries={originalSeries}
          onLogicReady={handleLogicReady}
          setOpenSelected={setOpenSelected}
          api={api}
        />
      </div>

      {/* フローティング選択パネル（LeftPaneLogic を利用） */}
      {leftLogic && (
        <div
          id="floatingSelectedWrapper"
          onMouseLeave={(e) => {
            const leftPaneEl = document.getElementById("leftPane");
            const rt = e.relatedTarget;
            if (!rt || !(rt instanceof Node)) {
              setOpenSelected(false);
              return;
            }
            if (leftPaneEl && leftPaneEl.contains(rt)) {
              return;
            }
            setOpenSelected(false);
          }}
        >
          <DndContext onDragEnd={leftLogic.handleDragEndSelected}>
            <SortableContext
              items={leftLogic.selectedList.map(h => h.id)}
              strategy={verticalListSortingStrategy}
            >
              <FloatingSelected
                selectedList={leftLogic.selectedList}
                selectedOrder={selectedOrder}
                toggleSeries={leftLogic.toggleSeries}
                handleRightClickSelected={leftLogic.handleRightClickSelected}
                handleDoubleClickSelected={leftLogic.handleDoubleClickSelected}
                handleDragEndSelected={leftLogic.handleDragEndSelected}
                openSelected={openSelected}
                setOpenSelected={setOpenSelected}
              />
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* 右ペイン */}
      <div id="rightPane">

        {/* ログインバー */}
        <div className="rightpane-loginbar">
          <div className="login-user">
            ログイン中:{" "}
            <Link to="/user-settings" className="auth-text-link">{username}</Link>
          </div>
          <button className="logout-btn" onClick={onLogout}>ログアウト</button>
        </div>

        {/* 補正ボタン */}
        <div id="buttonArea">
          <button
            className="btn-reset"
            disabled={!zeroApplied && !yApplied && !xyApplied}
            onClick={resetAll}
          >
            補正初期化
          </button>

          <button disabled={yApplied || xyApplied} onClick={startZeroMode}>
            ゼロ補正
          </button>

          <button
            disabled={!zeroApplied && !yApplied && !xyApplied}
            onClick={startRangeMode}
          >
            Y/XY補正
          </button>

          <button className="icon-button" onClick={rightPane.handleEvaluate}>
            <img src="../icons/wave.png" className="icon" alt="" />
            波形評価
          </button>

          <button
            className="icon-button"
            onClick={() => {
              const chart = chartCanvasRef.current?.chart;

              if (!isViewRangeSynced(chart, axisRange)) {
                const ok = window.confirm(
                  "現在の表示位置が反映されていません\n現在の表示位置を反映させますか？"
                );
                if (!ok) return;

                applyCurrentViewRange(); // 表示範囲を反映
                return;
              }

              rightPane.handleExportExcel(); // 同期している場合はそのまま出力
            }}
          >
            <img src="../icons/excel.png" className="icon" alt="" />
            出力
          </button>

          {isExporting && (
            <div className="export-progress">
              <div className="export-progress-bar" style={{ width: `${progress}%` }} />
              <div className="export-progress-text">
                Excel を生成中… {progress}%
              </div>
            </div>
          )}
        </div>

        {/* チャート */}
        <div id="chartArea">
          <ChartView
            chartCanvasRef={chartCanvasRef}
            zeroMode={zeroMode}
            rangeMode={rangeMode}
            zeroApplied={zeroApplied}
            yApplied={yApplied}
            xyApplied={xyApplied}
            lastZeroX={lastZeroX}
            lastRange={lastRange}
            axisMode={axisMode}
            setAxisMode={setAxisMode}
            axisRange={axisRange}
            setAxisRange={setAxisRange}
            applyCurrentViewRange={applyCurrentViewRange}
            guideVisible={guideVisible}
            toggleGuide={toggleGuide}
          />

          {showSyncNotice && (
            <div className={`sync-notice ${fadeOut ? "fade-out" : ""}`}>
              表示位置を反映しました。
              Excel 出力 可能です。
            </div>
          )}

          {modeBannerVisible && (
            <div id="modeBanner">
              <span id="modeText">{modeText}</span>
              <button id="modeCancel" onClick={cancelMode}>キャンセル</button>
            </div>
          )}
        </div>

        {/* タブ + ステータス */}
        <div id="tabs" style={{ marginLeft: "106px" }}>
          {tabs}
          <div id="statusBox">
            <>【 補正状態 】</>
            {!zeroApplied && !yApplied && !xyApplied && <>{"　"}なし（Original）</>}
            <br/>
            {zeroApplied && lastZeroX != null && <>{"　"}ゼロ補正: X = {lastZeroX.toFixed(1)}</>}
            <br/>
            {(yApplied || xyApplied) && lastRange.x1 != null && (
              <>{"　"}Y/XY補正: X範囲 = {lastRange.x1.toFixed(1)} ～ {lastRange.x2.toFixed(1)}</>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
