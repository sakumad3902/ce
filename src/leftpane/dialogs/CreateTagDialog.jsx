import Modal from "../Modal";
import { useState, useMemo } from "react";

// ▼ normalized_name 用（重複判定・DB の unique 制約用）
function normalizeTagName(name) {
  return name.trim().toLowerCase().normalize("NFKC");
}

export default function CreateTagDialog({
  mode = "create",
  existingTags,
  initialTag,
  onSubmit,
  onClose
}) {
  const [name, setName] = useState(initialTag?.name ?? "");

  // ▼ normalized_name（重複判定用）
  const normalized = normalizeTagName(name);

  // ▼ 入力が空なら候補を出さない
  const suggestions = useMemo(() => {
    if (!normalized) return [];
    return existingTags.filter(t =>
      normalizeTagName(t.name).includes(normalized)
    );
  }, [normalized, existingTags]);

  // ▼ 重複時の処理
  const isDuplicate = existingTags.some(t => {
    // 編集時は「自分自身と normalized が一致する場合」は重複扱いにしない
    if (mode === "edit" && t.id === initialTag?.id) {
      // 自分自身なら normalized が一致しても OK
      return false;
    }
    // 新規作成時は normalized が一致したら重複
    return normalizeTagName(t.name) === normalized;
  });

  const isTooLong = name.length > 20; //最大20文字

  const handleOk = () => {
    if (!normalized) return;
    if (isDuplicate) return;
    if (isTooLong) return;

    if (mode === "create") {
      // name はユーザー入力そのまま
      // normalized_name は正規化したもの
      onSubmit({
        name,                 // ← 大文字保持
        normalized_name: normalized
      });
    } else {
      onSubmit({
        id: initialTag.id,
        newName: name,        // ← 大文字保持
        normalized_name: normalized
      });
    }

    onClose();
  };

  return (
    <Modal
      title={mode === "create" ? "タグ作成" : "タグ名の編集"}
      onCancel={onClose}
      onOk={handleOk}
      okText="OK"
      cancelText="Cancel"
    >
      <div className="modal-content">

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="タグ名（20文字まで）"
        />

        {isTooLong && (
          <div style={{ color: "red" }}>
            20文字以内で入力してください
          </div>
        )}

        {isDuplicate && (
          <div style={{ color: "red" }}>
            このタグ名は既に存在します
          </div>
        )}

        {normalized && (
          <div className="tag-suggest-box">
            {suggestions.map(s => {
              const isExactMatch =
                normalizeTagName(s.name) === normalized;

              return (
                <div
                  key={s.id}
                  className={`tag-suggest-item ${
                    isExactMatch ? "exact-match" : ""
                  }`}
                  onClick={() => setName(s.name)}
                >
                  {s.name}
                  {isExactMatch && (
                    <span style={{ marginLeft: 8, color: "red" }}>
                      （既存）
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Modal>
  );
}
