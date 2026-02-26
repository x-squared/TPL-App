import type { ReportExecuteResponse } from '../../api';
import { useReportsViewModel } from './useReportsViewModel';
import { exportReportResultAsCsv } from './reportExport';

type Model = ReturnType<typeof useReportsViewModel>;

function ReportsResultTable({ result }: { result: ReportExecuteResponse | null }) {
  if (!result) return <p className="status">Run a report to see results.</p>;
  if (result.row_count === 0) return <p className="status">No rows found for current criteria.</p>;

  return (
    <div className="patients-table-wrap ui-table-wrap reports-results">
      <table className="data-table">
        <thead>
          <tr>
            {result.columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, idx) => (
            <tr key={idx}>
              {result.columns.map((col) => (
                <td key={col.key}>{row[col.key] ?? '–'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsBuilder({ model }: { model: Model }) {
  const allFieldKeys = model.sourceFields.map((field) => field.key);
  const allSelected = allFieldKeys.length > 0 && allFieldKeys.every((key) => model.selectedFields.includes(key));

  return (
    <>
      <section className="detail-section ui-panel-section">
        <div className="detail-section-heading">
          <h2>Query Builder</h2>
        </div>

        <div className="reports-grid">
          <label className="reports-field">
            <span className="detail-label">Source</span>
            <select
              className="detail-input"
              value={model.selectedSourceKey}
              onChange={(e) => model.setSelectedSourceKey(e.target.value)}
            >
              {model.sources.map((source) => (
                <option key={source.key} value={source.key}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>

          <label className="reports-field">
            <span className="detail-label">Limit</span>
            <input
              className="detail-input"
              type="number"
              min={1}
              max={1000}
              value={model.limit}
              onChange={(e) => model.setLimit(Number(e.target.value) || 200)}
            />
          </label>
        </div>

        {model.joinOptions.length > 0 ? (
          <div className="reports-field-list">
            <p className="detail-label">Joins</p>
            <div className="reports-checkbox-grid">
              {model.joinOptions.map((join) => (
                <label key={join.key} className="reports-checkbox">
                  <input
                    type="checkbox"
                    checked={model.selectedJoins.includes(join.key)}
                    onChange={(e) => {
                      model.setSelectedJoins((prev) =>
                        e.target.checked ? [...prev, join.key] : prev.filter((key) => key !== join.key),
                      );
                    }}
                  />
                  <span>{join.label}</span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="reports-field-list">
          <div className="detail-section-heading reports-subheading">
            <h3>Columns</h3>
            <button
              className="ci-add-btn"
              onClick={() => model.setSelectedFields(allSelected ? [] : allFieldKeys)}
              disabled={allFieldKeys.length === 0}
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="reports-checkbox-grid">
            {model.sourceFields.map((field) => (
              <label key={field.key} className="reports-checkbox">
                <input
                  type="checkbox"
                  checked={model.selectedFields.includes(field.key)}
                  onChange={(e) => {
                    model.setSelectedFields((prev) =>
                      e.target.checked ? [...prev, field.key] : prev.filter((key) => key !== field.key),
                    );
                  }}
                />
                <span>{field.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="reports-filters">
          <div className="detail-section-heading">
            <h3>Filters</h3>
            <button className="ci-add-btn" onClick={model.addFilter}>
              + Add filter
            </button>
          </div>
          {model.filters.length === 0 ? (
            <p className="status">No filters. Report will use all rows for this source.</p>
          ) : (
            model.filters.map((filter) => {
              const field = model.sourceFields.find((item) => item.key === filter.field);
              const operators = field?.operators ?? ['eq'];
              return (
                <div key={filter.id} className="reports-filter-row">
                  <select
                    className="detail-input"
                    value={filter.field}
                    onChange={(e) => model.updateFilter(filter.id, { field: e.target.value })}
                  >
                    {model.sourceFields.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="detail-input"
                    value={filter.operator}
                    onChange={(e) => model.updateFilter(filter.id, { operator: e.target.value as typeof filter.operator })}
                  >
                    {operators.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                  <input
                    className="detail-input"
                    type="text"
                    value={filter.value}
                    onChange={(e) => model.updateFilter(filter.id, { value: e.target.value })}
                    placeholder="value"
                  />
                  <button className="ci-delete-btn" onClick={() => model.removeFilter(filter.id)} title="Delete filter">
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="detail-section ui-panel-section">
        <div className="detail-section-heading">
          <div className="reports-results-heading-left">
            <h2>Results</h2>
            <span className="status">{model.result ? `${model.result.row_count} row(s)` : 'No run yet'}</span>
          </div>
          <div className="reports-results-actions">
            <button
              className="ci-add-btn"
              onClick={() => {
                if (!model.result || model.result.row_count === 0) return;
                exportReportResultAsCsv(model.result);
              }}
              disabled={!model.result || model.result.row_count === 0}
            >
              Export CSV
            </button>
            <button
              className="ci-add-btn"
              onClick={() => void model.runReport()}
              disabled={model.running || !model.selectedSource || model.selectedFields.length === 0}
            >
              {model.running ? 'Running...' : 'Run report'}
            </button>
          </div>
        </div>
        <ReportsResultTable result={model.result} />
      </section>
    </>
  );
}
