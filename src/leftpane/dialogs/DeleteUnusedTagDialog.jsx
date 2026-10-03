// src/leftpane/dialogs/DeleteUnusedTagDialog.jsx

import Modal from "../Modal";

export default function DeleteUnusedTagDialog({
  unusedTags,
  selectedUnusedTagIds,
  toggleUnusedTagSelection,
  onSubmit,
  onClose
}) {
  const handleOk = () => {
    onSubmit();   // LeftPaneLogic.js の handleDeleteUnusedTagsOk を呼ぶ
  };

  return (
    <Modal
      title="未使用タグの削除"
      onCancel={onClose}
      onOk={handleOk}
      okText="削除する"
      cancelText="キャンセル"
    >
      <div className="modal-content">

        {/* 未使用タグがない場合 */}
        {unusedTags.length === 0 && (
          <div style={{ marginBottom: 12 }}>
            未使用タグはありません。
          </div>
        )}

        {/* 未使用タグ一覧 */}
        {unusedTags.length > 0 && (
          <div className="unused-tag-list">
            {unusedTags.map(tag => (
              <label
                key={tag.id}
                className="unused-tag-item"
                style={{ display: "flex", alignItems: "center", marginBottom: 6 }}
              >
                <input
                  type="checkbox"
                  checked={selectedUnusedTagIds.includes(tag.id)}
                  onChange={() => toggleUnusedTagSelection(tag.id)}
                  style={{ marginRight: 8 }}
                />
                {tag.name}
              </label>
            ))}
          </div>
        )}

      </div>
    </Modal>
  );
}
