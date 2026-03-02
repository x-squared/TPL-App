import TaskBoard from '../../tasks/TaskBoard';

interface CoordinationProtocolTasksPanelProps {
  coordinationId: number;
  organId: number;
}

export default function CoordinationProtocolTasksPanel({ coordinationId, organId }: CoordinationProtocolTasksPanelProps) {
  return (
    <section className="coord-protocol-pane">
      <TaskBoard
        title="Protocol Tasks"
        hideFilters
        hideAddButton
        includeClosedTasks
        criteria={{
          extraParams: {
            coordination_id: coordinationId,
            organ_id: organId,
          },
        }}
      />
    </section>
  );
}
