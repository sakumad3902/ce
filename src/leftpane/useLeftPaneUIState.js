// src/leftpane/useLeftPaneUIState.js

import { useState } from "react";

export function useLeftPaneUIState() {
  const [contextMenu, setContextMenu] = useState(null);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });

  /* ▼ 統合編集モーダル */
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editTags, setEditTags] = useState([]);   // {id, name}
  const [editDate, setEditDate] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const [tagValueLocal, setTagValueLocal] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);

  /* ▼ タグ作成、編集、削除ダイアログ */
  const [showCreateTagDialog, setShowCreateTagDialog] = useState(false);
  const [showEditTagDialog, setShowEditTagDialog] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [showDeleteUnusedTagDialog, setShowDeleteUnusedTagDialog] = useState(false);
  const [unusedTags, setUnusedTags] = useState([]);
  const [selectedUnusedTagIds, setSelectedUnusedTagIds] = useState([]);
  
  /* ▼ フィルタモーダル */
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterModalPos, setFilterModalPos] = useState({ x: 0, y: 0 });

  /* ▼ 装置追加 */
  const [showProjectAppendModal, setShowProjectAppendModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  /* ▼ 装置名変更 */
  const [showProjectRenameModal, setShowProjectRenameModal] = useState(false);
  const [projectRenameValue, setProjectRenameValue] = useState("");
  const [projectRenameTarget, setProjectRenameTarget] = useState(null);

  /* ▼ 装置削除 */
  const [showProjectDeleteModal, setShowProjectDeleteModal] = useState(false);
  const [projectDeleteTarget, setProjectDeleteTarget] = useState(null);

  /* ▼ 選択データ移動 */
  const [showMoveSelectedModal, setShowMoveSelectedModal] = useState(false);
  const [moveSelectedIds, setMoveSelectedIds] = useState([]);
  const [moveTargetProjectId, setMoveTargetProjectId] = useState(null);

  /* ▼ 選択データ削除 */
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [deleteSelectedIds, setDeleteSelectedIds] = useState([]);

  return {
    contextMenu, setContextMenu,
    modalPos, setModalPos,

    /* 統合編集モーダル */
    showEditModal, setShowEditModal,
    editTarget, setEditTarget,
    editName, setEditName,
    editComment, setEditComment,
    editTags, setEditTags,
    editDate, setEditDate,
    
    tagFilter, setTagFilter,
    tagValueLocal,
    setTagValueLocal,

    tagSuggestions,
    setTagSuggestions,

    /* フィルタモーダル */
    showFilterModal, setShowFilterModal,
    filterModalPos, setFilterModalPos,

    /* 装置追加 */
    showProjectAppendModal, setShowProjectAppendModal,
    newProjectName, setNewProjectName,

    /* 装置名変更 */
    showProjectRenameModal, setShowProjectRenameModal,
    projectRenameValue, setProjectRenameValue,
    projectRenameTarget, setProjectRenameTarget,

    /* 装置削除 */
    showProjectDeleteModal, setShowProjectDeleteModal,
    projectDeleteTarget, setProjectDeleteTarget,

    /* 選択データ移動 */
    showMoveSelectedModal, setShowMoveSelectedModal,
    moveSelectedIds, setMoveSelectedIds,
    moveTargetProjectId, setMoveTargetProjectId,

    /* 選択データ削除 */
    showDeleteSelectedModal, setShowDeleteSelectedModal,
    deleteSelectedIds, setDeleteSelectedIds,

    /* ▼ タグ作成、編集、削除ダイアログ */
    showCreateTagDialog, setShowCreateTagDialog,
    showEditTagDialog, setShowEditTagDialog,
    editingTag, setEditingTag,
    showDeleteUnusedTagDialog, setShowDeleteUnusedTagDialog,
    unusedTags, setUnusedTags,
    selectedUnusedTagIds, setSelectedUnusedTagIds,
  };
}
