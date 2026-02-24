import type { TaskActionState } from './taskBoardTypes';

interface TaskBoardActionFormProps {
  actionState: TaskActionState;
  actionComment: string;
  setActionComment: (value: string) => void;
  actionSaving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TaskBoardActionForm({
  actionState,
  actionComment,
  setActionComment,
  actionSaving,
  onConfirm,
  onCancel,
}: TaskBoardActionFormProps) {
  const requiresComment = actionState.type === 'discard';
  return (
    <div className="task-board-action-form">
      <p className="task-board-action-title">
        {actionState.type === 'complete' ? 'Complete task' : 'Discard task'}: {actionState.task.description}
      </p>
      <textarea
        className="task-board-action-comment"
        value={actionComment}
        onChange={(e) => setActionComment(e.target.value)}
        placeholder={requiresComment ? 'Comment (required)' : 'Comment (optional)'}
      />
      <div className="task-board-action-buttons">
        <button
          className="save-btn"
          onClick={onConfirm}
          disabled={actionSaving || (requiresComment && actionComment.trim() === '')}
          title="Confirm"
          aria-label="Confirm"
        >
          {actionSaving ? '…' : '✓'}
        </button>
        <button
          className="cancel-btn"
          onClick={onCancel}
          disabled={actionSaving}
          title="Cancel"
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
