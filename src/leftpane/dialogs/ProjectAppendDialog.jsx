import Modal from "../Modal";

export default function ProjectAppendDialog({ logic }) {
  const pos = logic.modalPos;

  return (
    <Modal
      title="新しい装置名を入力してください"
      onCancel={() => {
        logic.setShowProjectAppendModal(false);
        logic.setNewProjectName("");
      }}
      onOk={logic.handleProjectAppendOk}
      x={pos.x}
      y={pos.y}
    >
      <input
        value={logic.newProjectName}
        onChange={(e) => logic.setNewProjectName(e.target.value)}
        className="name-input"
      />
    </Modal>
  );
}
