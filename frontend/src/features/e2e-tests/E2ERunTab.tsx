import E2EResultSection from './E2EResultSection';
import type { E2ETestsViewModel } from './types';

interface E2ERunTabProps {
  model: E2ETestsViewModel;
}

export default function E2ERunTab({ model }: E2ERunTabProps) {
  return (
    <>
      <section className="detail-section ui-panel-section">
        <div className="detail-section-heading">
          <h2>Configuration & Start</h2>
          <div className="e2e-header-actions">
            <button
              className="e2e-action-btn"
              onClick={() => void model.runTests()}
              disabled={model.running || model.loading || model.runners.length === 0}
            >
              {model.running ? 'Running...' : 'Run E2E Tests'}
            </button>
          </div>
        </div>

        <div className="e2e-config-grid">
          <label className="reports-field">
            <span className="detail-label">Runner</span>
            <select
              className="detail-input"
              value={model.selectedRunner}
              onChange={(e) => model.setSelectedRunner(e.target.value as typeof model.selectedRunner)}
            >
              {model.runners.map((runner) => (
                <option key={runner.key} value={runner.key}>
                  {runner.label}
                </option>
              ))}
            </select>
          </label>
          <label className="reports-field">
            <span className="detail-label">Output tail lines</span>
            <input
              className="detail-input"
              type="number"
              min={20}
              max={2000}
              value={model.outputTailLines}
              onChange={(e) => model.setOutputTailLines(Number(e.target.value) || 160)}
            />
          </label>
        </div>
        <p className="status e2e-runner-help">
          {model.runners.find((entry) => entry.key === model.selectedRunner)?.description ?? 'Select a runner and start.'}
        </p>
        <button
          className="e2e-action-btn e2e-clear-btn e2e-clear-inline"
          onClick={model.clearResults}
          title="Clear shown result"
        >
          Clear run result
        </button>
      </section>

      <section className="detail-section ui-panel-section">
        <div className="detail-section-heading">
          <h2>Results</h2>
          <button
            className="e2e-action-btn e2e-clear-btn"
            onClick={model.clearResults}
            title="Clear shown result"
          >
            Clear run result
          </button>
        </div>
        <E2EResultSection model={model} />
      </section>
    </>
  );
}
