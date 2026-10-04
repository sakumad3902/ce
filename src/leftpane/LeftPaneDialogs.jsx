import ProjectSearchDialog from "./dialogs/ProjectSearchDialog";
import DataSearchDialog from "./dialogs/DataSearchDialog";
import ContextMenu from "./dialogs/ContextMenu";
import ProjectAppendDialog from "./dialogs/ProjectAppendDialog";
import ProjectRenameDialog from "./dialogs/ProjectRenameDialog";
import ProjectDeleteDialog from "./dialogs/ProjectDeleteDialog";
import EditDataDialog from "./dialogs/EditDataDialog";
import MoveSelectedDialog from "./dialogs/MoveSelectedDialog";
import DeleteSelectedDialog from "./dialogs/DeleteSelectedDialog";
import CreateTagDialog from "./dialogs/CreateTagDialog";
import DeleteUnusedTagDialog from "./dialogs/DeleteUnusedTagDialog";

export default function LeftPaneDialogs({ logic }) {
  return (
    <>
      {/* ▼ 検索モーダル */}
      {logic.showProjectSearchModal && <ProjectSearchDialog logic={logic} />}
      {logic.showFilterModal && <DataSearchDialog logic={logic} />}

      {/* ▼ コンテキストメニュー */}
      {logic.contextMenu && <ContextMenu logic={logic} />}

      {/* ▼ 装置追加・編集系 */}
      {logic.showProjectAppendModal && <ProjectAppendDialog logic={logic} />}
      {logic.showProjectRenameModal && <ProjectRenameDialog logic={logic} />}
      {logic.showProjectDeleteModal && <ProjectDeleteDialog logic={logic} />}

      {/* ▼ データ編集 */}
      {logic.showEditModal && <EditDataDialog logic={logic} />}

      {/* ▼ 選択移動・削除 */}
      {logic.showMoveSelectedModal && <MoveSelectedDialog logic={logic} />}
      {logic.showDeleteSelectedModal && <DeleteSelectedDialog logic={logic} />}

      {/* ▼ タグ作成 */}
      {logic.showCreateTagDialog && (
        <CreateTagDialog
          mode="create"
          categories={logic.categories}         // カテゴリー
          existingTags={logic.allTags}      // UI に渡す辞書
          onSubmit={logic.createTag}        // ロジックへ委譲
          onClose={() => logic.setShowCreateTagDialog(false)}
        />
      )}

      {/* ▼ タグ編集 */}
      {logic.showEditTagDialog && (
        <CreateTagDialog
          mode="edit"
          categories={logic.categories}         // カテゴリー
          existingTags={logic.allTags}    // UI に渡す辞書
          initialTag={logic.editingTag}   // ← 編集対象
          onSubmit={logic.updateTag}  // ロジックへ委譲
          onClose={() => logic.setShowEditTagDialog(false)}
        />
      )}

      {/* ▼ 未使用タグ削除 */}
      {logic.showDeleteUnusedTagDialog && (
        <DeleteUnusedTagDialog
          unusedTags={logic.unusedTags}
          selectedUnusedTagIds={logic.selectedUnusedTagIds}
          toggleUnusedTagSelection={logic.toggleUnusedTagSelection}
          onSubmit={logic.handleDeleteUnusedTagsOk}
          onClose={() => logic.setShowDeleteUnusedTagDialog(false)}
        />
      )}
    </>
  );
}
