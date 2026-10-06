// src/leftpane/dialogs/DeleteCategoryDialog.jsx

import Modal from "../Modal";

export default function DeleteCategoryDialog({
  category,
  onSubmit,
  onClose
}) {
  if (!category) return null;  // safety

  const handleOk = () => {
    onSubmit(category.id);   // useCategoryActions.deleteCategory(id)
  };

  return (
    <Modal
      title="カテゴリ削除"
      onCancel={onClose}
      onOk={handleOk}
      okText="削除する"
      cancelText="キャンセル"
    >
      <div className="modal-content">

        <div style={{ marginBottom: 12 }}>
          カテゴリ「<strong>{category.name}</strong>」を削除しますか？
        </div>

        <div style={{ color: "#b00", marginBottom: 12 }}>
          ※ このカテゴリに紐づくタグは「カテゴリなし」になります。
        </div>

      </div>
    </Modal>
  );
}
