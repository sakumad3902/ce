// src/App.jsx
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import AppUI from "./AppUI";
import UserSettings from "./auth/UserSettings";

import useApi from "./useApi";
import useAppState from "./hooks/useAppState";
import useChartController from "./hooks/useChartController";
import useCorrection from "./hooks/useCorrection";
import { useRightPaneLogic } from "./rightpane/RightPaneLogic";

import ZeroModeHandler from "./rightpane/ZeroModeHandler";
import RangeModeHandler from "./rightpane/RangeModeHandler";

export default function App() {
  const state = useAppState();
  const api = useApi(state);

  const correction = useCorrection(state, api);
  const chart = useChartController(state);

  const rightPane = useRightPaneLogic({
    selectedOrder: state.selectedOrder,
    zeroApplied: state.zeroApplied,
    yApplied: state.yApplied,
    xyApplied: state.xyApplied,
    lastZeroX: state.lastZeroX,
    lastRange: state.lastRange,
    currentSheet: state.currentSheet,
    axisMode: state.axisMode,
    axisRange: state.axisRange,
    api
  });

  /* ----------------------------------------
     Viewer からのメッセージ受信
  ---------------------------------------- */
  useEffect(() => {
    function handleMessage(e) {
      if (!e.data || !e.data.type) return;

      if (e.data.type === "clipboard_added") {
        api.setProject(e.data.project_id);
        api.loadHeader({ resetSelection: false });
      }

      if (e.data.type === "parquet_imported") {
        api.setProject(e.data.project_id);
        api.loadHeader({ resetSelection: false });
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const username = localStorage.getItem("username");

  /* ----------------------------------------
     ログアウト処理
  ---------------------------------------- */
  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.reload();
  };

  /* ----------------------------------------
     UI（ルーティング対応）
  ---------------------------------------- */
  return (
    <Routes>

      {/* ▼ メイン画面 */}
      <Route
        path="/"
        element={
          <>
            <AppUI
              username={username}
              onLogout={onLogout}
              {...state}
              {...correction}
              selectedList={state.selectedList}
              setSelectedList={state.setSelectedList}
              toggleSeries={correction.toggleSeries}
              handleRightClickSelected={correction.handleRightClickSelected}
              handleDoubleClickSelected={correction.handleDoubleClickSelected}
              handleDragEndSelected={correction.handleDragEndSelected}
              openSelected={state.openSelected}
              setOpenSelected={state.setOpenSelected}
              handleEvaluate={rightPane.handleEvaluate}
              handleExportExcel={rightPane.handleExportExcel}
              chartCanvasRef={chart.chartCanvasRef}
              isExporting={api.isExporting}
              progress={api.progress}
              api={api}
            />

            <ZeroModeHandler
              zeroMode={state.zeroMode}
              chartCanvasRef={chart.chartCanvasRef}
              onZeroClick={correction.handleZeroClick}
            />

            <RangeModeHandler
              rangeMode={state.rangeMode}
              chartCanvasRef={chart.chartCanvasRef}
              onRangeSelect={correction.handleRangeSelect}
            />
          </>
        }
      />

      {/* ▼ ユーザー設定画面 */}
      <Route path="/user-settings" element={<UserSettings />} />

    </Routes>
  );
}
