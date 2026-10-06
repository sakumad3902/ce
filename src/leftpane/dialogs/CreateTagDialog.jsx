import Modal from "../Modal";
import { useState, useMemo } from "react";

function normalizeTagName(name) {
  return name.trim().toLowerCase().normalize("NFKC");
}

export default function CreateTagDialog({
  mode = "create",
  existingTags,
  categories,          // カテゴリ一覧を親から受け取る
  initialTag,
  initialCategory,
  onSubmit,
  onCreateCategory,    // カテゴリ作成
  onEditCategory,      // カテゴリ編集
  onDeleteCategory,    // カテゴリ削除
  onClose
}) {
  const [name, setName] = useState(initialTag?.name ?? "");
  const [categoryId, setCategoryId] = useState(initialTag?.category_id ?? null);
  const normalized = normalizeTagName(name);

  const suggestions = useMemo(() => {
    if (!normalized) return [];
    return existingTags.filter(t =>
      normalizeTagName(t.name).includes(normalized)
    );
  }, [normalized, existingTags]);

  const isDuplicate = existingTags.some(t => {
    if (mode === "edit" && t.id === initialTag?.id) return false;
    return normalizeTagName(t.name) === normalized;
  });

  const isTooLong = name.length > 20;

  const handleOk = () => {
    if (!normalized) return;
    if (isDuplicate) return;
    if (isTooLong) return;

    if (mode === "create") {
      onSubmit({
        name,
        normalized_name: normalized,
        category_id: categoryId
      });
    } else {
      onSubmit({
        id: initialTag.id,
        newName: name,
        normalized_name: normalized,
        category_id: categoryId 
      });
    }

    onClose();
  };

  return (
    <Modal
      title={mode === "create" ? "タグ作成" : "タグ編集"}
      onCancel={onClose}
      onOk={handleOk}
      okText="OK"
      cancelText="Cancel"
    >
      <div className="modal-content">

        {/* ▼ タグ名入力 */}
        <label>タグ名　：</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="タグ名（20文字まで）"
        />

        {isTooLong && <div style={{ color: "red" }}>20文字以内で入力してください</div>}
        {isDuplicate && <div style={{ color: "red" }}>このタグ名は既に存在します</div>}

        {/* ▼ カテゴリ選択欄 */}
        <div style={{ marginTop: 12 }}>
          <label>カテゴリ：</label>
          <select
            value={categoryId ?? ""}
            onChange={e => {
              const v = e.target.value;
              setCategoryId(v === "" ? null : Number(v));
            }}
          >
            <option value="">（カテゴリなし）</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* ▼ カテゴリ管理ボタン */}
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={onCreateCategory}>カテゴリ作成</button>

            {categoryId && (
              <>
                <button onClick={() => onEditCategory(categoryId)}>カテゴリ名変更</button>
                <button onClick={() => onDeleteCategory(categoryId)}>カテゴリ削除</button>
              </>
            )}
          </div>
        </div>

        {/* ▼ タグ候補 */}
        {normalized && (
          <div className="tag-suggest-box">
            {suggestions.map(s => {
              const isExactMatch = normalizeTagName(s.name) === normalized;
              return (
                <div
                  key={s.id}
                  className={`tag-suggest-item ${isExactMatch ? "exact-match" : ""}`}
                  onClick={() => setName(s.name)}
                >
                  {s.name}
                  {isExactMatch && <span style={{ marginLeft: 8, color: "red" }}>（既存）</span>}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Modal>
  );
}
