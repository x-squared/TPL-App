import { useE2ETestsViewModel } from './useE2ETestsViewModel';

type Model = ReturnType<typeof useE2ETestsViewModel>;

function ResultSection({ model }: { model: Model }) {
  if (!model.lastResult) {
    return <p className="status">No run yet.</p>;
  }
  const result = model.lastResult;
  return (
    <div className="e2e-results">
      <div className="e2e-result-meta">
        <span className={`e2e-run-state ${result.success ? 'ok' : 'fail'}`}>
          {result.success ? 'PASS' : 'FAIL'}
        </span>
        <span>Exit code: {result.exit_code}</span>
        <span>Duration: {result.duration_seconds.toFixed(1)}s</span>
        {result.report_path ? <span>Report: {result.report_path}</span> : null}
      </div>
      <div className="e2e-output-block">
        <p className="detail-label">Console output (tail)</p>
        <pre>{result.output_tail || 'No output captured.'}</pre>
      </div>
      <div className="e2e-output-block">
        <p className="detail-label">Report excerpt</p>
        <pre>{result.report_excerpt || 'No report available.'}</pre>
      </div>
    </div>
  );
}

export default function E2ETestsPanel({ model }: { model: Model }) {
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
        <ResultSection model={model} />
      </section>
    </>
  );
}
