import { useState, useRef, useEffect } from "react";
import { apiAppendClipboard } from "../useApi";
import { parseDateCell } from "../utils/parseDate";
import * as XLSX from "xlsx";
import "./css/pages.css";

function generateNewName(base, nameSet) {
  let n = 2;
  let name = `${base} (${n})`;
  while (nameSet.has(name)) {
    n++;
    name = `${base} (${n})`;
  }
  return name;
}

export default function ClipboardViewer() {
  const params = new URLSearchParams(window.location.search);
  const project_id = params.get("project_id");
  const project_name = params.get("project_name");

  const username = localStorage.getItem("username");

  const [text, setText] = useState("");
  const [previewSeries, setPreviewSeries] = useState([]);
  const [status, setStatus] = useState("");
  const [showSample, setShowSample] = useState(false);

  const existingNamesRef = useRef(new Set());

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "existing_headers") {
        const headers = e.data.headers || [];
        existingNamesRef.current = new Set(headers.map(h => String(h.name)));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  /* ============================================
     共通パーサー：テキスト → rows へ変換
  ============================================ */
  function parseTextToRows(rawText) {
    const lines = rawText.split(/\r?\n/).filter(line => line.trim() !== "");
    return lines.map(line => line.split(/\t|,/)); // CSV も対応
  }

  /* ============================================
     ファイルドロップ処理
  ============================================ */
  async function handleFileDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "txt" || ext === "csv") {
      const raw = await file.text();
      setText(raw);
    }

    else if (ext === "xlsx" || ext === "xlsm") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const sheetName = workbook.SheetNames[0]; // 最初のシートのみ
      const sheet = workbook.Sheets[sheetName];

      const csv = XLSX.utils.sheet_to_csv(sheet);
      setText(csv);
    }

    else {
      alert("対応している形式は .txt .csv .xlsx .xlsm です");
    }
  }

  /* ============================================
     プレビュー生成
  ============================================ */
  const handlePreview = () => {
    const rows = parseTextToRows(text);
    if (rows.length === 0) {
      alert("貼り付け内容が空です");
      return;
    }

    const headerRow = rows[0];

    const pastedNames = [];
    const normalizedNames = [];
    let seriesCounter = 1;

    for (let col = 0; col < headerRow.length; col += 2) {
      const nameCell = headerRow[col];
      const yCellExists = headerRow[col + 1] !== undefined;
      if (!yCellExists) continue;

      let rawName = String(nameCell).trim();

      if (/^\d+$/.test(rawName)) {
        rawName = `Series_${seriesCounter}`;
        seriesCounter++;
      }

      if (pastedNames.includes(rawName)) {
        alert(`貼り付け内で名前「${rawName}」が重複しています。修正して再度貼り付けてください。`);
        return;
      }

      pastedNames.push(rawName);
      normalizedNames.push({ col, rawName });
    }

    const nameSet = new Set(existingNamesRef.current);
    const now = Math.floor(Date.now() / 1000);
    const preview = [];

    normalizedNames.forEach((item) => {
      const { col, rawName } = item;

      const dupExisting = nameSet.has(rawName);
      let finalName = rawName;
      let renameSuffix = "";

      if (dupExisting) {
        finalName = generateNewName(rawName, nameSet);
        const m = finalName.match(/\((\d+)\)$/);
        renameSuffix = m ? m[1] : "";
      }

      nameSet.add(finalName);

      const X = [];
      const Y = [];

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (col < row.length && col + 1 < row.length) {
          const xVal = parseFloat(row[col]);
          const yVal = parseFloat(row[col + 1]);
          if (!isNaN(xVal) && !isNaN(yVal)) {
            X.push(xVal);
            Y.push(yVal);
          }
        }
      }

      /* 偶数列1行目の日付判定 */
      const dateRow = rows[0];
      const rawValue = dateRow?.[col + 1];
      const timestamp = parseDateCell(rawValue, now);

      preview.push({
        id: Date.now() + col,
        name: finalName,
        rawName,
        dupExisting,
        renameSuffix,
        timestamp: timestamp,
        created_by_username: username,
        x: X,
        y: Y
      });
    });

    setPreviewSeries(preview);
  };

  async function handleApply() {
    if (previewSeries.length === 0) {
      return alert("まずプレビューを生成してください");
    }

    setStatus("追加中...");

    const reply = await apiAppendClipboard({
      project_id: project_id,
      series: previewSeries
    });

    if (reply.status === "OK") {
      alert("データ追加完了");
      window.opener?.postMessage({ type: "clipboard_added", project_id }, "*");
      window.close();
    } else {
      setStatus("エラー: " + (reply.reason || reply.error));
    }
  }

  return (
    <div className="clipboard-container">
      <h2>データ追加先： {project_name}</h2>

      {/* Ctrl+V 入力欄 */}
      <div className="clipboard-textarea-wrapper">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Excelでコピーして貼り付け（Ctrl+V）"
          className="clipboard-textarea"
          onMouseEnter={() => setShowSample(true)}
          onMouseLeave={() => setShowSample(false)}
        />

        {showSample && (
          <img
            src="../icons/clipboard_sample.png"
            alt="clipboard sample"
            className="clipboard-sample-img"
          />
        )}
      </div>

      {/* ファイルドロップゾーン */}
      <div
        className="clipboard-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
      >
        <div className="clipboard-dropzone-title">
          ここに .txt .csv .xlsx .xlsm をドロップ
        </div>
        <div className="clipboard-dropzone-sub">
          または下のボタンから選択してください
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => {
            const input = document.getElementById("clipboard-file-input");
            if (input) input.click();
          }}
        >
          ファイルを選択
        </button>

        <input
          id="clipboard-file-input"
          type="file"
          accept=".txt,.csv,.xlsx,.xlsm"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const ext = file.name.split(".").pop().toLowerCase();

            if (ext === "txt" || ext === "csv") {
              const raw = await file.text();
              setText(raw);
            } else if (ext === "xlsx" || ext === "xlsm") {
              const buffer = await file.arrayBuffer();
              const workbook = XLSX.read(buffer, { type: "array" });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const csv = XLSX.utils.sheet_to_csv(sheet);
              setText(csv);
            } else {
              alert("対応している形式は .txt .csv .xlsx .xlsm です");
            }
          }}
        />
      </div>

      <div className="mt-15">
        <button onClick={handlePreview} className="btn" style={{ marginRight: "10px" }}>
          プレビュー生成
        </button>

        <button
          className="btn"
          onClick={() => {
            setText("");          // 貼り付けエリアをクリア
            setPreviewSeries([]); // プレビューも消すならここを有効化
          }}
        >
          クリア
        </button>
      </div>


      {previewSeries.length >= 0 && (
        <div className="preview-box">
          <strong>プレビュー（全 {previewSeries.length} 件）</strong>

          <table className="preview-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名前</th>
                <th>登録日</th>
                <th>登録者</th>
              </tr>
            </thead>

            <tbody>
              {previewSeries.map(s => {
                const hoverMessage = s.dupExisting
                  ? "この行は既存データと同名のため別名で追加されます"
                  : "";

                const warnIcon = s.dupExisting
                  ? <span className="warn-icon">⚠</span>
                  : null;

                const nameParts = s.name.match(/^(.*?)( \(\d+\))?$/);
                const baseName = nameParts[1];
                const suffix = nameParts[2];

                return (
                  <tr
                    key={s.id}
                    title={hoverMessage}
                    className={s.dupExisting ? "preview-row-duplicate" : ""}
                  >
                    <td>
                      {warnIcon}
                      {s.id}
                    </td>

                    <td>
                      {baseName}
                      {suffix && <span className="suffix">{suffix}</span>}
                      {s.dupExisting && (
                        <span className="duplicate-note">
                          （重複名のため別名保存）
                        </span>
                      )}
                    </td>

                    <td>{new Date(s.timestamp * 1000).toLocaleDateString("ja-JP")}</td>
                    <td>{s.created_by_username}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-20">
        <button onClick={handleApply} className="btn">
          データ追加実行
        </button>
        <button onClick={() => window.close()} className="btn">
          閉じる
        </button>
      </div>

      <div className="status-text">{status}</div>
    </div>
  );
}
