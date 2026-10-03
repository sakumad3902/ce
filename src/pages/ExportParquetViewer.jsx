import { useState, useEffect } from "react";
import { apiExportParquetPreview, apiExportParquetApply } from "../useApi";

export default function ExportParquetViewer() {
  const params = new URLSearchParams(window.location.search);
  const project = params.get("project");

  const [previewSeries, setPreviewSeries] = useState([]);
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  /* ----------------------------------------
     起動時に export_parquet_preview を呼ぶ
     → Python が parquet を読み、series を返す
  ---------------------------------------- */
  useEffect(() => {
    const load = async () => {
      const res = await apiExportParquetPreview({ project });
      if (res.status === "OK") {
        setPreviewSeries(res.series || []);
      } else {
        alert("プレビュー取得失敗: " + res.error);
      }
    };
    load();
  }, [project]);

  /* ----------------------------------------
     エクスポート実行
     → python → parquet生成 → downloads保存 → ダウンロード
  ---------------------------------------- */
  const handleExport = async () => {
    const res = await apiExportParquetApply({ project });

    if (res.status === "OK") {
      const filename = res.download;
      if (filename) {
        const url = `/downloads/${filename}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      }
      alert("エクスポート完了");
      window.close();
    } else {
      alert("エラー: " + res.error);
    }
  };

  /* ----------------------------------------
     ソート処理
  ---------------------------------------- */
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

  /* ----------------------------------------
     日付フォーマット
  ---------------------------------------- */
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

  /* ----------------------------------------
     UI
  ---------------------------------------- */
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>エクスポート対象： {project}</h2>

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

        {previewSeries.length === 0 && <div>データがありません</div>}

        {previewSeries.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr>
                <th
                  style={{ width: "80px", borderBottom: "1px solid #ccc", cursor: "pointer" }}
                  onClick={() => toggleSort("id")}
                >
                  ID {sortKey === "id" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ width: "200px", borderBottom: "1px solid #ccc", cursor: "pointer" }}
                  onClick={() => toggleSort("name")}
                >
                  名前 {sortKey === "name" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ width: "200px", borderBottom: "1px solid #ccc", cursor: "pointer" }}
                  onClick={() => toggleSort("timestamp")}
                >
                  登録日時 {sortKey === "timestamp" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedSeries.map(s => {
                const nameParts = s.name.match(/^(.*?)( \(\d+\))?$/);
                const baseName = nameParts[1];
                const suffix = nameParts[2];

                return (
                  <tr key={s.id}>
                    <td style={{ borderBottom: "1px solid #eee", padding: "4px" }}>
                      {s.id}
                    </td>

                    <td style={{ borderBottom: "1px solid #eee", padding: "4px" }}>
                      {baseName}
                      {suffix && (
                        <span style={{ color: "blue", marginLeft: "4px" }}>{suffix}</span>
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

      {/* ボタン */}
      <div style={{ marginTop: "20px" }}>
        <button onClick={handleExport} style={{ marginRight: "10px" }}>
          エクスポート実行
        </button>
        <button onClick={() => window.close()}>
          閉じる
        </button>
      </div>
    </div>
  );
}
