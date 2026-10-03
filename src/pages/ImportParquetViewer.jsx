import { useState, useRef, useEffect } from "react";
import { apiImportParquetPreview, apiImportParquetApply } from "../useApi";

export default function ImportParquetViewer() {
  const params = new URLSearchParams(window.location.search);
  const project = params.get("project");

  const [previewSeries, setPreviewSeries] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // 既存データ
  const existingIdsRef = useRef(new Set());
  const existingNamesRef = useRef(new Set());
  const existingIdToNameRef = useRef(new Map());

  const fileInputRef = useRef(null);

  /* ----------------------------------------
     親ウィンドウから既存データを取得
  ---------------------------------------- */
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "existing_headers") {
        const headers = e.data.headers || [];

        existingIdsRef.current = new Set(headers.map(h => Number(h.id)));
        existingNamesRef.current = new Set(headers.map(h => String(h.name)));

        const map = new Map();
        headers.forEach(h => map.set(Number(h.id), String(h.name)));
        existingIdToNameRef.current = map;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  /* 別名生成 */
  function generateNewName(base, nameSet) {
    let n = 2;
    let name = `${base} (${n})`;
    while (nameSet.has(name)) {
      n++;
      name = `${base} (${n})`;
    }
    return name;
  }

  /* ドロップ処理 */
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) await loadPreview(file);
  };

  /* ファイル選択処理 */
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) await loadPreview(file);
  };

  /* プレビュー読み込み */
  const loadPreview = async (file) => {
    setSelectedFile(file);

    const res = await apiImportParquetPreview({ project, file });

    if (res.status === "OK") {
      const localNameSet = new Set(existingNamesRef.current);

      const preview = res.series.map(s => {
        const idNum = Number(s.id);
        const nameStr = String(s.name);

        const dupId = existingIdsRef.current.has(idNum);
        const dupName = existingNamesRef.current.has(nameStr);

        let finalName;

        if (dupId) {
          // UI 上では新規名のまま表示する
          finalName = nameStr;
        } else if (dupName) {
          // ID が違うが名前が同じ → 別名生成
          finalName = generateNewName(nameStr, localNameSet);
          localNameSet.add(finalName);
        } else {
          finalName = nameStr;
        }

        return {
          ...s,
          id: idNum,
          name: finalName,
          dupId,
          dupName,
          originalName: nameStr,          
          existingName: existingIdToNameRef.current.get(idNum) // 既存名
        };
      });

      setPreviewSeries(preview);
    } else {
      alert("読み込み失敗: " + res.error);
    }
  };

  /* インポート実行（重複IDは overrideSeries に含めない）*/
  const handleImport = async () => {
    if (!selectedFile) return alert("ファイルを読み込んでください");

    const overrideSeries = previewSeries.filter(s => !s.dupId);

    const res = await apiImportParquetApply({
      project,
      file: selectedFile,
      overrideSeries
    });

    if (res.status === "OK") {
      alert("インポート完了");
      window.opener?.postMessage({ type: "parquet_imported", project }, "*");
      window.close();
    } else {
      alert("エラー: " + res.error);
    }
  };

  /* ソート処理 */
  const sortedSeries = [...previewSeries];
  if (sortKey) {
    sortedSeries.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  /* 日付フォーマット */
  const formatTimestamp = (ts) => {
    const d = new Date(ts * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
  };

  /* UI */
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>インポート先： {project}</h2>

      {/* ドロップ領域 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "3px dashed #ccc",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
          background: "#fafafa",
          cursor: "pointer",
          fontSize: "18px",
          color: "#666",
          marginBottom: "20px"
        }}
      >
        ここに .parquet ファイルをドロップ  
        <br />
        または下のボタンから選択してください
      </div>

      <button onClick={() => fileInputRef.current.click()} style={{ marginBottom: "20px" }}>
        ファイルを選択
      </button>

      <input
        type="file"
        accept=".parquet"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {/* プレビュー */}
      <div style={{
        border: "1px solid #ddd",
        padding: "10px",
        borderRadius: "8px",
        background: "#fff",
        minHeight: "120px",
        maxHeight: "250px",
        overflowY: "auto"
      }}>
        <strong>プレビュー（全 {previewSeries.length} 件）</strong>

        {previewSeries.length === 0 && <div>ファイル未選択</div>}

        {previewSeries.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr>
                <th style={{ width: "80px", borderBottom: "1px solid #ccc", cursor: "pointer" }}
                    onClick={() => toggleSort("id")}>
                  ID {sortKey === "id" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th style={{ width: "200px", borderBottom: "1px solid #ccc", cursor: "pointer" }}
                    onClick={() => toggleSort("name")}>
                  名前 {sortKey === "name" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th style={{ width: "200px", borderBottom: "1px solid #ccc", cursor: "pointer" }}
                    onClick={() => toggleSort("timestamp")}>
                  登録日時 {sortKey === "timestamp" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedSeries.map(s => {

                const existingName = s.existingName;

                let hoverMessage = "";
                if (s.dupId) {
                  hoverMessage = `既存データと同一IDのため、保存時は既存名「${existingName}」が保持されます`;
                } else if (s.dupName) {
                  hoverMessage = "この行は既存データと同名ですがIDが異なるため、別名で追加されます";
                }

                let warnIcon = "";
                if (s.dupId || s.dupName) {
                  warnIcon = <span style={{ color: "red", marginRight: "6px" }}>⚠</span>;
                }

                const nameParts = s.name.match(/^(.*?)( \(\d+\))?$/);
                const baseName = nameParts[1];
                const suffix = nameParts[2];

                return (
                  <tr
                    key={`${s.id}-${s.name}`}
                    style={{
                      background: s.dupId
                        ? "#ffe0e0"     
                        : s.dupName
                          ? "#ffe0e0"     
                          : "transparent",
                      cursor: hoverMessage ? "help" : "default"
                    }}
                    title={hoverMessage}
                  >
                    <td style={{ borderBottom: "1px solid #eee", padding: "4px" }}>
                      {warnIcon}
                      {s.id}
                      {s.dupId && (
                        <span style={{ color: "red", marginLeft: "4px" }}>（重複ID）</span>
                      )}
                    </td>

                    <td style={{ borderBottom: "1px solid #eee", padding: "4px" }}>
                      {baseName}
                      {suffix && (
                        <span style={{ color: "blue", marginLeft: "4px" }}>{suffix}</span>
                      )}

                      {s.dupId && existingName && (
                        <>
                          <span style={{ color: "blue", marginLeft: "8px" }}>⇒{existingName}</span>
                          <span style={{ color: "red", marginLeft: "4px" }}>（既存名で保存）</span>
                        </>
                      )}

                      {s.dupName && !s.dupId && (
                        <span style={{ color: "red", marginLeft: "4px" }}>
                          （重複名のため別名保存）
                        </span>
                      )}
                    </td>

                    <td style={{ borderBottom: "1px solid #eee", padding: "4px" }}>
                      {formatTimestamp(s.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleImport} style={{ marginRight: "10px" }}>
          インポート実行
        </button>
        <button onClick={() => window.close()}>
          閉じる
        </button>
      </div>
    </div>
  );
}
