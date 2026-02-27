import type { E2ETestsViewModel } from './types';

interface E2EResultSectionProps {
  model: E2ETestsViewModel;
}

export default function E2EResultSection({ model }: E2EResultSectionProps) {
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
