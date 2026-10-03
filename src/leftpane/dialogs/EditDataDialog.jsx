import Modal from "../Modal";

export default function EditDataDialog({ logic }) {
  const pos = logic.modalPos;

  return (
    <Modal
      title="データ編集"
      onCancel={logic.handleEditCancel}
      onOk={logic.handleEditOk}
      x={pos.x}
      y={pos.y}
    >
      <div className="modal-content">

        {/* 名前 */}
          <label htmlFor="edit-name">名前　　：</label>
          <input
            id="edit-name"
            value={logic.editName}
            onChange={(e) => logic.setEditName(e.target.value)}
            maxLength={50}
            className="name-input"
          />
        <br/>

        {/* 登録日 */}
          <label htmlFor="edit-date">登録日　：</label>
          <input
            id="edit-date"
            type="date"
            value={logic.editDate}
            onChange={(e) => logic.setEditDate(e.target.value)}
            className="date-input"
          />
        <br/>

        {/* コメント */}
          <label htmlFor="edit-comment">コメント：</label>
          <input
            id="edit-comment"
            value={logic.editComment}
            onChange={(e) => logic.setEditComment(e.target.value)}
            maxLength={100}
            className="comment-input"
          />
        <br/>

        {/* タグ */}
        <div className="form-block">
          <label>タグ　　：（最大5つ）</label>

          {/* 選択済みタグ */}
          <div className="tag-suggest-box">
            {Array.isArray(logic.editTags) &&
              logic.editTags.map(tag => (
                <span key={tag.id} className="tag-selected-item">
                  {tag.name}

                  {/* 編集ボタン */}
                  <img
                    src="/icons/edit.png"
                    className="leftpane-row-iconbtn"
                    title="タグ名編集"
                    onClick={() => {
                      logic.setEditingTag(tag);
                      logic.setShowEditTagDialog(true);
                    }}
                  />

                  {/* 削除ボタン */}
                  <span
                    className="tag-delete"
                    title="タグ選択解除"
                    onClick={() =>
                      logic.setEditTags(
                        logic.editTags.filter(t => t.id !== tag.id)
                      )
                    }
                  >
                    ×
                  </span>
                </span>
              ))}
          </div>

          {/* タグ検索 */}
          <input
            id="tag-filter"
            value={logic.tagFilter}
            onChange={(e) => logic.setTagFilter(e.target.value)}
            placeholder="タグ検索（部分一致）"
            className="name-input"
          />

          {/* タグ候補 */}
          <div className="tag-suggest-box">
            {Array.isArray(logic.sortedTagSuggestions) &&
              logic.sortedTagSuggestions
                .filter(tag => tag.name.includes(logic.tagFilter))  
                .map(tag => {
                  const isSelected = Array.isArray(logic.editTags)
                    ? logic.editTags.some(t => t.id === tag.id)
                    : false;
                  const disabled =
                    !isSelected && Array.isArray(logic.editTags) && logic.editTags.length >= 5;

                  return (
                    <span
                      key={tag.id}
                      className={`tag-suggest-item ${isSelected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                      onClick={() => !disabled && logic.toggleEditTag(tag)}
                    >
                      {tag.name}
                    </span>
                  );
                })}
          </div>

          <button
            className={`tag-create-btn ${
              Array.isArray(logic.editTags) && logic.editTags.length >= 5
                ? "disabled"
                : ""
            }`}
            disabled={Array.isArray(logic.editTags) && logic.editTags.length >= 5}
            onClick={() => logic.setShowCreateTagDialog(true)}
          >
            ＋タグ作成
          </button>

          <button
            className="tag-create-btn"
            onClick={() => logic.openDeleteUnusedTagDialog(true)}
          >
            未使用タグ削除
          </button>
        </div>

      </div>
    </Modal>
  );
}
