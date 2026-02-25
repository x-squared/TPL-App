interface InlineDeleteActionsProps {
  confirming: boolean;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onEdit?: () => void;
  deleting?: boolean;
}

export default function InlineDeleteActions({
  confirming,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onEdit,
  deleting = false,
}: InlineDeleteActionsProps) {
  if (confirming) {
    return (
      <span className="ci-confirm">
        <span className="ci-confirm-text">Delete?</span>
        <button className="ci-confirm-yes" onClick={onConfirmDelete} disabled={deleting}>
          Yes
        </button>
        <button className="ci-confirm-no" onClick={onCancelDelete} disabled={deleting}>
          No
        </button>
      </span>
    );
  }

  return (
    <>
      {onEdit ? (
        <button className="ci-edit-inline" onClick={onEdit} title="Edit">
          ✎
        </button>
      ) : null}
      <button className="ci-delete-btn" onClick={onRequestDelete} title="Delete" disabled={deleting}>
        {deleting ? '…' : '×'}
      </button>
    </>
  );
}
