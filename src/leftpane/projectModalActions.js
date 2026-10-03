// src/leftpane/projectModalActions.js

export function buildProjectModalActions({
  ui,
  projectList,
  reloadProjects,
  api,
  setSelectedProject,
  setOpenProject
}) {

  const handleProjectAppendOk = async () => {
    const name = ui.newProjectName.trim();
    if (!name) return;

    if (projectList.some(p => p.name === name)) {
      return alert("同名の装置が存在します\n別の名前を入力してください");
    }

    const reply = await api.addProject(name);
    if (reply.status !== "OK") return alert("追加に失敗しました");

    const project_id = reply.project_id;

    await reloadProjects();
    setSelectedProject(project_id);
    setOpenProject(true);

    ui.setShowProjectAppendModal(false);
    ui.setNewProjectName("");
  };

  const handleProjectRenameOk = async () => {
    const newName = ui.projectRenameValue.trim();
    if (!newName) return;

    if (projectList.some(p => p.name === newName)) {
      return alert("同名の装置が存在します\n別の名前を入力してください");
    }

    await api.renameProject(ui.projectRenameTarget, newName);
    await reloadProjects();

    if (ui.projectRenameTarget === ui.selectedProject) {
      setSelectedProject(ui.projectRenameTarget);
    }

    ui.setShowProjectRenameModal(false);
  };

  const handleProjectDeleteOk = async () => {
    const reply = await api.deleteProject(ui.projectDeleteTarget);
    if (reply.status !== "OK") return alert("削除に失敗しました");

    await reloadProjects();
    setSelectedProject(null);

    ui.setShowProjectDeleteModal(false);
    ui.setProjectDeleteTarget(null);
  };

  return {
    handleProjectAppendOk,
    handleProjectRenameOk,
    handleProjectDeleteOk
  };
}
