// src/leftpane/dialogs/CreateCategoryDialog.jsx

import Modal from "../Modal";
import { useState } from "react";

function normalizeCategoryName(name) {
  return name.trim().toLowerCase().normalize("NFKC");
}

export default function CreateCategoryDialog({
  mode = "create",
  existingCategories,
  initialCategory,
  onSubmit,
  onClose
}) {
  const [name, setName] = useState(initialCategory?.name ?? "");

  const normalized = normalizeCategoryName(name);

  const isDuplicate = existingCategories.some(cat => {
    if (mode === "edit" && cat.id === initialCategory?.id) return false;
    return normalizeCategoryName(cat.name) === normalized;
  });

  const isTooLong = name.length > 20;

  const handleOk = () => {
    if (!normalized) return;
    if (isDuplicate) return;
    if (isTooLong) return;

    if (mode === "create") {
      onSubmit({ name });
    } else {
      onSubmit({ id: initialCategory.id, newName: name });
    }

    onClose();
  };

  return (
    <Modal
      title={mode === "create" ? "カテゴリ作成" : "カテゴリ編集"}
      onCancel={onClose}
      onOk={handleOk}
      okText="OK"
      cancelText="Cancel"
    >
      <div className="modal-content">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="カテゴリ名（20文字まで）"
        />

        {isTooLong && <div style={{ color: "red" }}>20文字以内で入力してください</div>}
        {isDuplicate && <div style={{ color: "red" }}>このカテゴリ名は既に存在します</div>}
      </div>
    </Modal>
  );
}
