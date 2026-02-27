import type { E2ETestsViewModel } from './types';

interface E2EHealthCheckTabProps {
  model: E2ETestsViewModel;
}

export default function E2EHealthCheckTab({ model }: E2EHealthCheckTabProps) {
  return (
    <section className="detail-section ui-panel-section">
      <div className="detail-section-heading">
        <h2>Health Check</h2>
      </div>
      <div className="e2e-health-grid">
        <fieldset className="e2e-health-box">
          <legend>Error Framework Check</legend>
          <p className="detail-empty e2e-health-help">
            This test intentionally triggers a backend `422` response so the shared error framework can be verified.
          </p>
          <div className="e2e-health-actions">
            <button
              className="e2e-action-btn"
              onClick={() => {
                void model.triggerHealthCheck422();
              }}
              disabled={model.runningHealthCheck}
            >
              {model.runningHealthCheck ? 'Creating...' : 'Create error'}
            </button>
          </div>
        </fieldset>
      </div>
    </section>
  );
}
