import Modal from "../Modal";

export default function ProjectRenameDialog({ logic }) {
  const pos = logic.modalPos;

  return (
    <Modal
      title="新しい装置名を入力してください"
      onCancel={logic.handleProjectRenameCancel}
      onOk={logic.handleProjectRenameOk}
      x={pos.x}
      y={pos.y}
    >
      <input
        value={logic.projectRenameValue}
        onChange={(e) => logic.setProjectRenameValue(e.target.value)}
        className="name-input"
      />
    </Modal>
  );
}
