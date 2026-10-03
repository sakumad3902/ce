// src/utils/viewerActions.js

/**
 * Viewer を新しいタブで開き、payload を postMessage で送信する。
 * viewerType に応じて URL を自動生成する。
 *
 * @param {string} viewerType - "clipboard" | "import" | "export" | "evaluate"
 * @param {Object} project - { project_id, name }
 * @param {Object} payload - viewer に postMessage で送るデータ
 */
function launchViewer(viewerType, project, payload = {}) {
  if (!project) return;

  const { project_id, name } = project;

  // viewerType → URL の自動生成
  const viewerMap = {
    clipboard: `/clipboard-viewer.html?project_id=${project_id}&project_name=${encodeURIComponent(name)}`,
    import: `/import-parquet-viewer.html?project_id=${project_id}&project_name=${encodeURIComponent(name)}`,
    export: `/export-parquet-viewer.html?project_id=${project_id}`,
    evaluate: `/evaluate-viewer.html?project_id=${project_id}`
  };

  const url = viewerMap[viewerType];
  if (!url) return;

  const w = window.open(url, "_blank");

  // viewer 側の準備が整うまで postMessage をリトライ
  const timer = setInterval(() => {
    if (!w || w.closed) {
      clearInterval(timer);
      return;
    }
    w.postMessage(payload, "*");
    clearInterval(timer);
  }, 200);
}

/**
 * LeftPaneLogic 用の Viewer 起動アクションをまとめたユーティリティ。
 *
 * @param {Object[]} projectList - プロジェクト一覧
 * @param {number|string|null} currentProject - 現在選択中の project_id
 * @param {Object[]} headerNames - DB のヘッダー一覧（series）
 */
export function buildViewerActions({ projectList, currentProject, headerNames }) {
  const findCurrentProject = () =>
    projectList.find(pr => pr.project_id === currentProject);

  const onAppendClipboard = () => {
    const p = findCurrentProject();
    if (!p) return;

    launchViewer("clipboard", p, {
      type: "existing_headers",
      headers: headerNames
    });
  };

  const importParquet = () => {
    const p = findCurrentProject();
    if (!p) return;

    launchViewer("import", p, {
      type: "existing_headers",
      headers: headerNames
    });
  };

  const exportParquet = () => {
    const p = findCurrentProject();
    if (!p) return;

    launchViewer("export", p);
  };

  return {
    onAppendClipboard,
    importParquet,
    exportParquet
  };
}
