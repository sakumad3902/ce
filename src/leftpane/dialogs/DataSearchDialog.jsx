import FilterModal from "../FilterModal";
import { FilterForm } from "../dialogs/FilterForm";

export default function DataSearchDialog({ logic }) {
  return (
    <FilterModal
      title="登録データの検索条件"
      onCancel={() => {
        logic.handleFilterReset();
        logic.setShowFilterModal(false);
      }}
      onReset={logic.handleFilterReset}
      x={logic.filterModalPos.x}
      y={logic.filterModalPos.y}
      zIndex={logic.projectSearchModalPos.zIndex}
    >
      <FilterForm
        fields={[
          {
            label: "並び替え：",
            type: "select",
            value: logic.sortMode,
            onChange: logic.setSortMode,
            options: [
              { value: "asc", label: "登録日（昇順）" },
              { value: "desc", label: "登録日（降順）" },
              { value: "nameAsc", label: "データ名（昇順）" },
              { value: "nameDesc", label: "データ名（降順）" },
            ],
          },
          {
            label: "登録期間：",
            type: "date-range",
            from: logic.dateFrom,
            to: logic.dateTo,
            onChangeFrom: logic.setDateFrom,
            onChangeTo: logic.setDateTo,
          },
          {
            label: "データ名：",
            type: "text",
            value: logic.keyword,
            onChange: logic.setKeyword,
          },
          {
            label: "登録者名：",
            type: "custom",
            render: () => (
              <>
                <input
                  type="text"
                  value={logic.creatorKeyword}
                  onChange={(e) => logic.setCreatorKeyword(e.target.value)}
                  className="name-input"
                />

                <label style={{ alignItems: "center", gap: "4px", fontSize: "12px" }}>
                  <input
                    type="checkbox"
                    checked={logic.creatorKeyword === localStorage.getItem("username")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        logic.setCreatorKeyword(localStorage.getItem("username"));
                      } else {
                        logic.setCreatorKeyword("");
                      }
                    }}
                  />
                  自分
                </label>
              </>
            )
          },
          {
            label: "コメント：",
            type: "text",
            value: logic.commentKeyword,
            onChange: logic.setCommentKeyword,
          },
          {
            label: "タグ選択：",
            type: "custom",
            render: () => (
              <></>
            )
          },
          {
            label: "",
            type: "custom",
            fullWidth: true,
            render: () => (
              <>
                <div className="tag-suggest-box">
                {Array.isArray(logic.tagKeyword) &&
                  logic.tagKeyword.map(tagId => {
                    const tag = logic.allTags.find(t => t.id === tagId);
                    if (!tag) return null;

                    return (
                      <span key={tag.id} className="tag-selected-item">
                        {tag.name}

                        {/* 削除ボタン */}
                        <span
                          className="tag-delete"
                          title="タグ選択解除"
                          onClick={() =>
                            logic.setTagKeyword(
                              logic.tagKeyword.filter(id => id !== tag.id)
                            )
                          }
                        >
                          ×
                        </span>
                      </span>
                    );
                  })}
                </div>
              </>
            )
          },
          {
            label: "",
            type: "custom",
            fullWidth: true,
            render: () => (
              <>
                {/* タグ検索 */}
                <input
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
                        const isSelected = Array.isArray(logic.tagKeyword)
                          ? logic.tagKeyword.includes(tag.id)
                          : false;

                        return (
                          <span
                            key={tag.id}
                            className={`tag-suggest-item ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              if (!Array.isArray(logic.tagKeyword)) {
                                logic.setTagKeyword([tag.id]);
                                return;
                              }

                              if (isSelected) {
                                logic.setTagKeyword(
                                  logic.tagKeyword.filter(id => id !== tag.id)
                                );
                              } else {
                                logic.setTagKeyword([...logic.tagKeyword, tag.id]);
                              }
                            }}
                          >
                            {tag.name}
                          </span>
                        );
                      })}
                </div>
              </>
            )
          },
          {
            label: "",
            type: "custom",
            fullWidth: true,
            render: () => (
              <>
                <div className="tag-mode-radio">
                    <input
                      type="radio"
                      name="tagMode"
                      value="AND"
                      checked={logic.tagMode === "AND"}
                      onChange={() => logic.setTagMode("AND")}
                    />
                    AND／
                    <input
                      type="radio"
                      name="tagMode"
                      value="OR"
                      checked={logic.tagMode === "OR"}
                      onChange={() => logic.setTagMode("OR")}
                    />
                    OR
                </div>
              </>
            )
          }
        ]}
        logic={logic}
      />
    </FilterModal>
  );
}
