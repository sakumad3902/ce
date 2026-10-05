// src/leftpane/useCategoryActions.js

export function useCategoryActions({ api, setCategories, ui, categories }){

  async function createCategory({ name }) {
    const res = await api.createCategory(name);

    if (res?.status !== "OK" || !res.category_id) {
      alert("カテゴリ作成に失敗しました");
      return;
    }

    const newCategory = { id: Number(res.category_id), name };
    setCategories(prev => [...prev, newCategory]);

    ui.setShowCreateCategoryDialog(false);
  }

  async function updateCategory({ id, newName }) {
    const res = await api.updateCategory(id, newName);

    if (res?.status !== "OK") {
      alert("カテゴリ名の更新に失敗しました");
      return;
    }

    setCategories(prev =>
      prev.map(c => c.id === id ? { ...c, name: newName } : c)
    );

    ui.setShowEditCategoryDialog(false);
  }

  async function deleteCategory(id) {
    const res = await api.deleteCategory(id);

    if (res?.status !== "OK") {
      alert("カテゴリ削除に失敗しました");
      return;
    }

    setCategories(prev => prev.filter(c => c.id !== id));
    ui.setShowDeleteCategoryDialog(false);
  }

  function openCreateCategoryDialog() {
    ui.setEditingCategory(null);
    ui.setShowCreateCategoryDialog(true);
  }

  function openEditCategoryDialog(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    ui.setEditingCategory(category);
    ui.setShowEditCategoryDialog(true);
  }

  function openDeleteCategoryDialog(category) {
    ui.setEditingCategory(category);
    ui.setShowDeleteCategoryDialog(true);
  }

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    openCreateCategoryDialog,
    openEditCategoryDialog,
    openDeleteCategoryDialog
  };
}
