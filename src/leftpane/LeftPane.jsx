// src/leftpane/LeftPane.jsx

import { useState, useEffect, useRef } from "react";
import LeftPaneDialogs from "./LeftPaneDialogs";
import { useLeftPaneLogic } from "./LeftPaneLogic";
import { DBItem, ProjectItem } from "./LeftPaneItems";
import { AccordionTitle } from "./LeftPaneAccordion";
import { Virtuoso } from "react-virtuoso";
import "./css/LeftPane.css";
import "./css/Tag.css";

export default function LeftPane({
  headerNames,
  setHeaderNames,
  originalSeries,
  selectedOrder,
  setSelectedOrder,
  onLogicReady,
  setOpenSelected,
  api
}) {
  const { setProject, loadHeader, getProjects } = api;

  /* ----------------------------------------
     装置一覧と状態
  ---------------------------------------- */
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openProject, setOpenProject] = useState(true);
  const [openDB, setOpenDB] = useState(false);

  const currentProjectRef = useRef(null);

  /* ----------------------------------------
     装置一覧＋メタ再取得
  ---------------------------------------- */
  const reloadProjects = async () => {
    const list = await getProjects();
    setProjects(list);
  };

  /* ----------------------------------------
     LeftPaneLogic 初期化
  ---------------------------------------- */
  const logic = useLeftPaneLogic({
    loadHeader,
    headerNames,
    setHeaderNames,
    originalSeries,
    selectedOrder,
    setSelectedOrder,
    setOpenProject,
    selectedProject,
    setSelectedProject,
    reloadProjects,
    currentProjectRef,  
    currentProject: selectedProject,
    projectList: projects,
    setProjects,
    setOpenSelected,
    api
  });

  const {
    dbListRef,

    dbList,
    selectedList,

    // フィルタ
    setShowFilterModal,
    setFilterModalPos,

    // 右クリック
    handleRightClickProject,
    handleRightClickDb,
    handleRightClickSelected,

    // 選択トグル
    toggleSeries,

    // DnD
    handleDragEndSelected,

    // ダブルクリック
    handleDoubleClickSelected,

    // クリップボード / Parquet / Excel
    onAppendClipboard,
    importParquet,
    exportParquet,
  } = logic;

  /* ----------------------------------------
     初回ロード ※本番環境も開発環境も1回だけロード
  ---------------------------------------- */
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    reloadProjects();
  }, []);

  /* ----------------------------------------
     装置選択時：ヘッダ読み込み
  ---------------------------------------- */
  useEffect(() => {
    if (!selectedProject) {
      setProject(null);
      return;
    }

    setProject(selectedProject);

    loadHeader({ resetSelection: false });

  }, [selectedProject]);

  useEffect(() => {
    currentProjectRef.current = selectedProject;
  }, [selectedProject]);

  /* ----------------------------------------
     データ検索開始時：ヘッダ読み込み
  ---------------------------------------- */
  const handleOpenFilterModal = async (e) => {
    if (!selectedProject) return;
    const rect = e.currentTarget.getBoundingClientRect();
    e.stopPropagation();

    setOpenDB(true);
    setFilterModalPos({
      x: rect.right + 10,
      y: rect.top + 10,
    });
    setShowFilterModal(prev => !prev);
  };
  
  /* ----------------------------------------
     選択中データが増えたら開く
  ---------------------------------------- */
  useEffect(() => {
    if (selectedOrder.length > 0) {
      // 開く
      setOpenSelected(true);
    } else {
      // 閉じる
      setOpenSelected(false);
    }
  }, [selectedOrder.length]);

  /* ----------------------------------------
     ロジックを親(AppUI)へ渡す
  ---------------------------------------- */
  useEffect(() => {
    onLogicReady?.({
      selectedList,
      toggleSeries,
      handleRightClickSelected,
      handleDoubleClickSelected,
      handleDragEndSelected,
    });
  }, [selectedList]);

  /* ----------------------------------------
     UI
  ---------------------------------------- */
  return (
    <div>
      {/* 装置一覧 */}
      <AccordionTitle
        open={openProject}
        setOpen={setOpenProject}
      >
        装置
      </AccordionTitle>

      {openProject && (
        <>
          <div className="leftpane-toolbar">
            <div className="leftpane-toolbar-left">
              表示 {logic.projectListFiltered.length} 件／全 {projects.length} 件
            </div>

            <div className="leftpane-toolbar-right">
              <div
                className="leftpane-btnarea"
                title="装置を検索"
                onClick={logic.handleProjectFilterClick}
              >
                <img src="/icons/search.png" className="leftpane-iconbtn" />
              </div>
            </div>
          </div>

          <div className="leftpane-add-bar">
            <div
              className="leftpane-btnarea"
              title="装置毎のフォルダを作成"
              onClick={logic.handleProjectAppendClick}
            >
              <img src="/icons/add.png" className="leftpane-iconbtn" />
              新規作成
            </div>
          </div>
        </>
      )}

      {!openProject && selectedProject && (
        <div className="selected-project-label">
          ✔{"　"}{projects.find(p => p.project_id === selectedProject)?.name}
        </div>
      )}

      {openProject && (
        <>
          <Virtuoso
            style={{ height: "136px" }}
            totalCount={logic.projectListFiltered.length}
            itemContent={(index) => {
              const p = logic.projectListFiltered[index];
              return (
                <ProjectItem
                  key={p.project_id}
                  project={p}
                  isSelected={p.project_id === selectedProject}
                  onSelect={() => {
                    setSelectedProject(p.project_id);
                    logic.handleProjectFilterReset();
                    logic.setShowProjectSearchModal(false);
                    setOpenProject(false);
                    setOpenDB(true);
                  }}
                  logic={logic}
                  handleRightClickProject={handleRightClickProject}
                />
              );
            }}
          />
        </>
      )}

      {/* 登録データ */}
      <AccordionTitle
        open={openDB}
        setOpen={setOpenDB}
      >
        登録データ
      </AccordionTitle>

      {openDB && (
        <>
          <div className="leftpane-toolbar">
            <div className="leftpane-toolbar-left">
              表示 {dbList.length} 件／全 {headerNames.length} 件
            </div>
            <div className="leftpane-toolbar-right">
              <div
                className="leftpane-btnarea"
                title="選択中データを削除"
                onClick={() => logic.handleDeleteSelected()}
              >        
                <img src="/icons/trash.png" className="leftpane-iconbtn" />
              </div>
              <div
                className="leftpane-btnarea"
                title="選択中データを移動"
                onClick={() => logic.handleMoveSelected()}
              >
                <img src="/icons/move.png" className="leftpane-iconbtn" />  
              </div>
              <div
                className="leftpane-btnarea"
                title="選択中データに一括タグ付け"
                onClick={() => logic.handleMoveSelected()}
              >
                <img src="/icons/tag.png" className="leftpane-iconbtn" />  
              </div>
              <div
                className="leftpane-btnarea"
                title="登録データを検索"
                onClick={(e) => handleOpenFilterModal(e)}
              >  
                <img src="/icons/search.png" className="leftpane-iconbtn" />
              </div>                
            </div>
          </div>
          <div className="leftpane-add-bar">
            <div className="leftpane-btnarea"
              title="クリップボードまたはファイルから追加"
              onClick={onAppendClipboard}
            >
              <img src="/icons/add.png" className="leftpane-iconbtn" />
              データ追加
            </div>
          </div>

          <div ref={dbListRef} className="db-list-wrapper">
            <Virtuoso
              className="db-list-virtuoso"
              totalCount={dbList.length}
              itemContent={(index) => (
                <DBItem
                  h={dbList[index]}
                  selectedOrder={selectedOrder}
                  toggleSeries={toggleSeries}
                  handleRightClickDb={handleRightClickDb}
                  logic={logic}
                />
              )}
            />
          </div>
        </>
      )}

      {/* ダイアログ */}
      <LeftPaneDialogs
        logic={logic}
        headerNames={headerNames}
        contextMenu={logic.contextMenu}
      />
    </div>
  );
}

/*
            <img
              src="/icons/import.png"
              title="Parquet ファイルをインポート"
              className={`leftpane-iconbtn ${!selectedProject ? "disabled" : ""}`}
              onClick={importParquet}
            />

            <img
              src="/icons/export.png"
              title="Parquet ファイルをエクスポート"
              className={`leftpane-iconbtn ${!selectedProject ? "disabled" : ""}`}
              onClick={exportParquet}
            />*/