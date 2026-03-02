import { useMemo } from 'react';

import ErrorBanner from '../../layout/ErrorBanner';
import { useAdminTranslations } from '../hooks/useAdminTranslations';

interface TreeNode {
  key: string;
  fullPath: string;
  children: TreeNode[];
  isLeaf: boolean;
}

function TranslationTree({
  nodes,
  depth,
  draft,
  onChange,
  getSourceKind,
  getEnglishReference,
}: {
  nodes: TreeNode[];
  depth: number;
  draft: Record<string, string>;
  onChange: (key: string, value: string) => void;
  getSourceKind: (key: string) => 'file' | 'code';
  getEnglishReference: (key: string) => string;
}) {
  return (
    <ul className="admin-translation-tree">
      {nodes.map((node) => (
        <li key={node.fullPath} className="admin-translation-node">
          {node.isLeaf ? (
            <div className="admin-translation-leaf" style={{ marginLeft: `${depth * 12}px` }}>
              <div className="admin-translation-meta">
                <div className="admin-translation-key-row">
                  <div className="admin-translation-key">{node.fullPath}</div>
                  <span className={`admin-translation-source-badge admin-translation-source-${getSourceKind(node.fullPath)}`}>
                    {getSourceKind(node.fullPath) === 'file' ? 'FILE' : 'CODE'}
                  </span>
                </div>
              </div>
              <div className="admin-translation-english-ref">{getEnglishReference(node.fullPath)}</div>
              <input
                className="detail-input admin-translation-input"
                value={draft[node.fullPath] ?? ''}
                onChange={(event) => onChange(node.fullPath, event.target.value)}
              />
            </div>
          ) : (
            <details open>
              <summary className="admin-translation-group" style={{ marginLeft: `${depth * 12}px` }}>
                {node.key}
              </summary>
              <TranslationTree
                nodes={node.children}
                depth={depth + 1}
                draft={draft}
                onChange={onChange}
                getSourceKind={getSourceKind}
                getEnglishReference={getEnglishReference}
              />
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function AdminTranslationsTab() {
  const model = useAdminTranslations();

  const leafCount = useMemo(() => model.knownKeys.length, [model.knownKeys.length]);

  return (
    <section className="detail-section ui-panel-section">
      <div className="detail-section-heading">
        <h2>Translations</h2>
      </div>
      <div className="admin-task-template-create admin-people-form">
        <label>
          <span>Language</span>
          <select className="detail-input" value={model.locale} onChange={(e) => model.setLocale(e.target.value)}>
            <option value="de">Deutsch (de)</option>
            <option value="en">English (en)</option>
          </select>
        </label>
        <div className="admin-proc-action-cell">
          <button className="save-btn" disabled={model.saving || model.loading} onClick={() => { void model.save(); }}>
            {model.saving ? 'Saving...' : 'Save translations'}
          </button>
        </div>
      </div>
      <p className="subtitle">
        Tree keys are fixed by the translation file. Admins can edit text values only. Items: {leafCount}
      </p>
      {model.loading ? <p className="status">Loading translations...</p> : null}
      {model.error ? <ErrorBanner message={model.error} /> : null}
      {model.status ? <p className="status">{model.status}</p> : null}
      {!model.loading && (
        <TranslationTree
          nodes={model.tree}
          depth={0}
          draft={model.draft}
          onChange={model.setDraftValue}
          getSourceKind={model.getSourceKind}
          getEnglishReference={model.getEnglishReference}
        />
      )}
    </section>
  );
}
