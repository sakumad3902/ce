import FilterModal from "../FilterModal";
import { FilterForm } from "../dialogs/FilterForm";

export default function ProjectSearchDialog({ logic }) {
  return (
    <FilterModal
      title="装置の検索条件"
      onCancel={() => {
        logic.handleProjectFilterReset();
        logic.setShowProjectSearchModal(false);
      }}
      onReset={logic.handleProjectFilterReset}
      x={logic.projectSearchModalPos.x}
      y={logic.projectSearchModalPos.y}
      zIndex={logic.projectSearchModalPos.zIndex}
    >
      <FilterForm
        fields={[
          {
            label: "並び替え：",
            type: "select",
            value: logic.projectSortMode,
            onChange: logic.setProjectSortMode,
            options: [
              { value: "updatedAsc", label: "更新日（昇順）" },
              { value: "updatedDesc", label: "更新日（降順）" },
              { value: "nameAsc", label: "装置名（昇順）" },
              { value: "nameDesc", label: "装置名（降順）" },
            ],
          },
          {
            label: "更新期間：",
            type: "date-range",
            from: logic.projectDateFrom,
            to: logic.projectDateTo,
            onChangeFrom: logic.setProjectDateFrom,
            onChangeTo: logic.setProjectDateTo,
          },
          {
            label: "装置名　：",
            type: "text",
            value: logic.projectKeyword,
            onChange: logic.setProjectKeyword,
          },
        ]}
      />
    </FilterModal>
  );
}
