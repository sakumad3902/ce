import Modal from "../Modal";

export default function ProjectDeleteDialog({ logic }) {
  const pos = logic.modalPos;

  const target = logic.projectList.find(
    p => p.project_id === logic.projectDeleteTarget
  );

  return (
    <Modal
      title="この装置を削除しますか？"
      onCancel={logic.handleProjectDeleteCancel}
      onOk={logic.handleProjectDeleteOk}
      x={pos.x}
      y={pos.y}
    >
      <div>
        装置名：<strong>{target?.name}</strong>
      </div>
      <div>この操作は取り消せません。</div>
    </Modal>
  );
}
